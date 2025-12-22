
import { Inputs, ProductType, Destination, CalculationResult } from '../types';

const VOL_20FT = 33; 
const VOL_40FT = 67; 
const CARTON1_VOL = 5.5 * 2.8 * 3.55; 
const CAP_STEEL_C1 = 105;
const CAP_PV_C1 = 406;
const CAP_CAR_C1 = 1;

export const getDiscountedPrice = (type: ProductType, basePrice: number, q: number): number => {
  let multiplier = 1.0;
  if (type === ProductType.STEEL) {
    if (q > 800) multiplier = 0.75;
    else if (q > 500) multiplier = 0.8;
    else if (q > 400) multiplier = 0.9;
  } else if (type === ProductType.PV) {
    if (q > 2000) multiplier = 0.7;
    else if (q > 1200) multiplier = 0.8;
    else if (q > 600) multiplier = 0.9;
  } else if (type === ProductType.CAR) {
    if (q > 30) multiplier = 0.8;
    else if (q > 20) multiplier = 0.85;
    else if (q > 10) multiplier = 0.9;
  }
  return basePrice * multiplier;
};

export const calculateLogistics = (q: number, type: ProductType, destination: Destination, freightCostUSD: number) => {
  let itemsPerBox = type === ProductType.STEEL ? CAP_STEEL_C1 : type === ProductType.PV ? CAP_PV_C1 : CAP_CAR_C1;
  const numBoxes = Math.ceil(q / itemsPerBox);
  const totalVolume = numBoxes * CARTON1_VOL;
  const isLargeDest = destination === Destination.MIAMI || destination === Destination.SEATTLE;
  const containerVol = isLargeDest ? VOL_40FT : VOL_20FT;
  const m = Math.ceil(totalVolume / containerVol);
  const spareCapacity = (numBoxes * itemsPerBox - q) + (Math.max(0, Math.floor((m * containerVol) / CARTON1_VOL) - numBoxes) * itemsPerBox);
  const totalFreightUSD = m * freightCostUSD;
  const unitFreightUSD = q > 0 ? totalFreightUSD / q : 0;

  return { 
    m, totalFreightUSD, unitFreightUSD, spareCapacity, containerVol, totalVolume,
    containerType: isLargeDest ? '40ft' : '20ft' as const
  };
};

export const calculateScenario = (q: number, type: ProductType, inputs: Inputs): CalculationResult => {
  const { exchangeRate: c, freightCostUSD: d, margin: k, destination, miscFee } = inputs;

  let basePrice = 0, r = 0, eDuty = 0, iDuty = 0;
  if (type === ProductType.STEEL) { 
    basePrice = inputs.priceSteel; r = inputs.sellPriceSteelUSD; 
    eDuty = inputs.exportDutySteel; iDuty = inputs.importDutySteel;
  } else if (type === ProductType.PV) { 
    basePrice = inputs.pricePV; r = inputs.sellPricePVUSD; 
    eDuty = inputs.exportDutyPV; iDuty = inputs.importDutyPV;
  } else { 
    basePrice = inputs.priceCar; r = inputs.sellPriceCarUSD; 
    eDuty = inputs.exportDutyCar; iDuty = inputs.importDutyCar;
  }

  const x = getDiscountedPrice(type, basePrice, q);
  const { m, totalFreightUSD, unitFreightUSD: F_USD, spareCapacity, containerVol, totalVolume, containerType } = calculateLogistics(q, type, destination, d);
  const containerUtilization = m > 0 ? (totalVolume / (m * containerVol)) * 100 : 0;

  const avgMiscRMB = miscFee / q;
  const N_USD = (x + avgMiscRMB) / c;
  
  // FOB price factors in: Cost + Target Margin + Export Duty
  const FOB_USD = ((x + avgMiscRMB) * (1 + k + eDuty)) / c;
  const I_USD = FOB_USD * 0.033;
  const CFR_USD = FOB_USD + F_USD;
  const CIF_USD = CFR_USD / 0.967;

  // Landed cost includes: FOB + Import Duty + Handling(Fixed 5%) + Insurance + Freight
  const foreignActualCostUSD = (FOB_USD * (1 + iDuty + 0.05)) + I_USD + F_USD;
  
  const domesticUnitProfitUSD = (FOB_USD - N_USD - ( (x + avgMiscRMB) * eDuty / c )) * 0.8;
  const domesticTotalProfitUSD = domesticUnitProfitUSD * q;
  const foreignUnitProfitUSD = (r - foreignActualCostUSD) * 0.8;
  const foreignTotalProfitUSD = foreignUnitProfitUSD * q;
  const jointTotalProfitUSD = domesticTotalProfitUSD + foreignTotalProfitUSD;
  const domesticTotalCostRMB = q * x + miscFee;

  return {
    quantity: q, unitPriceRMB: x, containerCount: m, containerType: containerType as '20ft' | '40ft',
    containerUtilization, spareCapacity, totalFreightUSD, avgMiscRMB, N_USD, FOB_USD, CFR_USD, CIF_USD, I_USD, F_USD,
    foreignActualCostUSD, domesticUnitProfitUSD, domesticTotalProfitUSD, foreignUnitProfitUSD, foreignTotalProfitUSD, jointTotalProfitUSD, domesticTotalCostRMB,
    exportDutyRate: eDuty, importDutyRate: iDuty
  };
};

export const findOptimalQuantity = (type: ProductType, inputs: Inputs) => {
  const { balance, reserve } = inputs;
  const budgetRMB = (balance - reserve) * 10000;
  let basePrice = type === ProductType.STEEL ? inputs.priceSteel : type === ProductType.PV ? inputs.pricePV : inputs.priceCar;
  if (basePrice <= 0) return null;

  const safeMaxQ = Math.floor((budgetRMB / (basePrice * 0.7)) * 1.1) + 1;
  const effectiveLimit = Math.min(safeMaxQ, 50000);

  let maxProfit = -Infinity, optimalResult: CalculationResult | null = null;
  const dataPoints: CalculationResult[] = [];
  const step = Math.max(1, Math.ceil(effectiveLimit / 50));

  for (let q = 1; q <= effectiveLimit; q += step) {
    const res = calculateScenario(q, type, inputs);
    if (res.domesticTotalCostRMB > budgetRMB) break;
    if (res.jointTotalProfitUSD > maxProfit) { maxProfit = res.jointTotalProfitUSD; optimalResult = res; }
    dataPoints.push(res);
  }
  return { optimal: optimalResult, dataPoints, maxAffordableQ: effectiveLimit };
};

export const calculateForeignMetrics = (fob: number, qty: number, type: ProductType, inputs: Inputs) => {
  const { exchangeRate, destination, freightCostUSD } = inputs;
  let r = 0, iDuty = 0;
  if (type === ProductType.STEEL) { r = inputs.sellPriceSteelUSD; iDuty = inputs.importDutySteel; }
  else if (type === ProductType.PV) { r = inputs.sellPricePVUSD; iDuty = inputs.importDutyPV; }
  else { r = inputs.sellPriceCarUSD; iDuty = inputs.importDutyCar; }

  const { m, totalFreightUSD, unitFreightUSD: F_USD } = calculateLogistics(qty, type, destination, freightCostUSD);
  const I_USD = fob * 0.033;
  // Use custom import duty + 5% fixed handling
  const unitCost = (fob * (1 + iDuty + 0.05)) + I_USD + F_USD;
  const totalLandedCost = unitCost * qty;
  const unitProfit = (r - unitCost) * 0.8;
  const totalProfit = unitProfit * qty;
  const sellerProfit = calculateDomesticProfitAtFOB(fob, qty, type, inputs);
  
  return { 
    containerCount: m, totalFreightUSD, unitFreightUSD: F_USD, insuranceUSD: I_USD, 
    unitCost, totalLandedCost, unitProfit, totalProfit, sellerProfit,
    margin: r > 0 ? unitProfit / r : 0, F_USD 
  };
};

export const calculateDomesticProfitAtFOB = (fob: number, q: number, type: ProductType, inputs: Inputs): number => {
    const { exchangeRate, miscFee } = inputs;
    if (q <= 0) return 0;
    let basePrice = type === ProductType.STEEL ? inputs.priceSteel : type === ProductType.PV ? inputs.pricePV : inputs.priceCar;
    let eDuty = type === ProductType.STEEL ? inputs.exportDutySteel : type === ProductType.PV ? inputs.exportDutyPV : inputs.exportDutyCar;
    const x = getDiscountedPrice(type, basePrice, q);
    const avgMiscRMB = miscFee / q;
    const N_USD = (x + avgMiscRMB) / exchangeRate;
    const dutyUSD = ( (x + avgMiscRMB) * eDuty ) / exchangeRate;
    return (fob - N_USD - dutyUSD) * 0.8 * q;
};

export const calculateTargetFOB = (desiredMargin: number, sellPrice: number, unitFreight: number, importDuty: number): number => {
    const targetNetProfit = sellPrice * desiredMargin;
    const targetCost = sellPrice - (targetNetProfit / 0.8);
    // Cost = FOB * (1 + iDuty + 0.05) + Insurance(FOB * 0.033) + Freight
    // targetCost = FOB * (1 + iDuty + 0.05 + 0.033) + unitFreight
    const factor = (1 + importDuty + 0.05 + 0.033);
    const targetFOB = (targetCost - unitFreight) / factor;
    return targetFOB > 0 ? targetFOB : 0;
};

// Fix: Add the missing findDominantMargin function used by ResultCard component.
export const findDominantMargin = (q: number, type: ProductType, inputs: Inputs) => {
    const { exchangeRate: c, freightCostUSD: d, destination, miscFee } = inputs;
    let basePrice = 0, r = 0, eDuty = 0, iDuty = 0;
    if (type === ProductType.STEEL) { basePrice = inputs.priceSteel; r = inputs.sellPriceSteelUSD; eDuty = inputs.exportDutySteel; iDuty = inputs.importDutySteel; }
    else if (type === ProductType.PV) { basePrice = inputs.pricePV; r = inputs.sellPricePVUSD; eDuty = inputs.exportDutyPV; iDuty = inputs.importDutyPV; }
    else { basePrice = inputs.priceCar; r = inputs.sellPriceCarUSD; eDuty = inputs.exportDutyCar; iDuty = inputs.importDutyCar; }

    const x = getDiscountedPrice(type, basePrice, q);
    const { unitFreightUSD: F_USD } = calculateLogistics(q, type, destination, d);
    const avgMiscRMB = miscFee / q;
    const A = (x + avgMiscRMB) / c;
    
    const targetRatio = 1.18;
    const factor = 1.083 + iDuty;
    
    // Algebra: A*k >= targetRatio * (r - F_USD - A * (1 + k + eDuty) * factor)
    const numerator = targetRatio * (r - F_USD - A * factor * (1 + eDuty));
    const denominator = A * (1 + targetRatio * factor);
    
    const requiredK = denominator !== 0 ? numerator / denominator : 0;
    return { requiredK: Math.max(0, requiredK) };
};
