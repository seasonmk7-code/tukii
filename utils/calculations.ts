
import { Inputs, ProductType, Destination, CalculationResult } from '../types';

// Constants
const VOL_20FT = 33; // m3
const VOL_40FT = 67; // m3

// Carton 1 Dimensions (meters)
const CARTON1_VOL = 5.5 * 2.8 * 3.55; 

// Capacities per Carton 1
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
  let itemsPerBox = 0;
  if (type === ProductType.STEEL) itemsPerBox = CAP_STEEL_C1;
  else if (type === ProductType.PV) itemsPerBox = CAP_PV_C1;
  else itemsPerBox = CAP_CAR_C1;

  const numBoxes = Math.ceil(q / itemsPerBox);
  const totalVolume = numBoxes * CARTON1_VOL;
  const isLargeDest = destination === Destination.MIA_SEA;
  const containerVol = isLargeDest ? VOL_40FT : VOL_20FT;
  const m = Math.ceil(totalVolume / containerVol);
  const spareCapacity = (numBoxes * itemsPerBox - q) + (Math.max(0, Math.floor((m * containerVol) / CARTON1_VOL) - numBoxes) * itemsPerBox);
  const totalFreightUSD = m * freightCostUSD;
  const unitFreightUSD = q > 0 ? totalFreightUSD / q : 0;

  return { m, totalFreightUSD, unitFreightUSD, spareCapacity, containerVol, totalVolume };
};

export const calculateScenario = (q: number, type: ProductType, inputs: Inputs): CalculationResult => {
  const { priceSteel, pricePV, priceCar, exchangeRate: c, freightCostUSD: d, margin: k, sellPriceSteelUSD, sellPricePVUSD, sellPriceCarUSD, destination, miscFee } = inputs;

  let basePrice = 0, r = 0;
  if (type === ProductType.STEEL) { basePrice = priceSteel; r = sellPriceSteelUSD; }
  else if (type === ProductType.PV) { basePrice = pricePV; r = sellPricePVUSD; }
  else { basePrice = priceCar; r = sellPriceCarUSD; }

  const x = getDiscountedPrice(type, basePrice, q);
  const { m, totalFreightUSD, unitFreightUSD: F_USD, spareCapacity, containerVol, totalVolume } = calculateLogistics(q, type, destination, d);
  const containerUtilization = m > 0 ? (totalVolume / (m * containerVol)) * 100 : 0;

  const avgMiscRMB = miscFee / q;
  const N_USD = (x + avgMiscRMB) / c;
  const FOB_USD = ((x + avgMiscRMB) * (1 + k)) / c;
  const I_USD = FOB_USD * 0.033;
  const CFR_USD = FOB_USD + F_USD;
  const CIF_USD = CFR_USD / 0.967;

  const foreignActualCostUSD = (FOB_USD * 1.25) + I_USD + F_USD;
  const domesticUnitProfitUSD = (FOB_USD - N_USD) * 0.8;
  const domesticTotalProfitUSD = domesticUnitProfitUSD * q;
  const foreignUnitProfitUSD = (r - foreignActualCostUSD) * 0.8;
  const foreignTotalProfitUSD = foreignUnitProfitUSD * q;
  const jointTotalProfitUSD = domesticTotalProfitUSD + foreignTotalProfitUSD;
  const domesticTotalCostRMB = q * x + miscFee;

  return {
    quantity: q, unitPriceRMB: x, containerCount: m, containerType: destination === Destination.MIA_SEA ? '40ft' : '20ft',
    containerUtilization, spareCapacity, totalFreightUSD, avgMiscRMB, N_USD, FOB_USD, CFR_USD, CIF_USD, I_USD, F_USD,
    foreignActualCostUSD, domesticUnitProfitUSD, domesticTotalProfitUSD, foreignUnitProfitUSD, foreignTotalProfitUSD, jointTotalProfitUSD, domesticTotalCostRMB
  };
};

export const findOptimalQuantity = (type: ProductType, inputs: Inputs) => {
  const { balance, reserve, priceSteel, pricePV, priceCar } = inputs;
  const budgetRMB = (balance - reserve) * 10000;
  let basePrice = (type === ProductType.STEEL ? priceSteel : type === ProductType.PV ? pricePV : priceCar);
  if (basePrice <= 0) return null;

  const safeMaxQ = Math.floor((budgetRMB / (basePrice * 0.7)) * 1.1) + 1;
  const effectiveLimit = Math.min(safeMaxQ, 200000);

  let maxProfit = -Infinity, optimalResult: CalculationResult | null = null;
  const dataPoints: CalculationResult[] = [];

  for (let q = 1; q <= effectiveLimit; q++) {
    const res = calculateScenario(q, type, inputs);
    if (res.domesticTotalCostRMB > budgetRMB) break;
    if (res.jointTotalProfitUSD > maxProfit) { maxProfit = res.jointTotalProfitUSD; optimalResult = res; }
    if (effectiveLimit < 200 || q % Math.ceil(effectiveLimit / 50) === 0) dataPoints.push(res);
  }
  return { optimal: optimalResult, dataPoints, maxAffordableQ: effectiveLimit };
};

export const calculateForeignMetrics = (fob: number, qty: number, type: ProductType, inputs: Inputs) => {
  const { sellPriceSteelUSD, sellPricePVUSD, sellPriceCarUSD, freightCostUSD, destination } = inputs;
  let sellPrice = type === ProductType.STEEL ? sellPriceSteelUSD : type === ProductType.PV ? sellPricePVUSD : sellPriceCarUSD;
  const { m, totalFreightUSD, unitFreightUSD: F_USD } = calculateLogistics(qty, type, destination, freightCostUSD);
  const I_USD = fob * 0.033;
  const unitCost = (fob * 1.25) + I_USD + F_USD;
  const totalLandedCost = unitCost * qty;
  const unitProfit = (sellPrice - unitCost) * 0.8;
  const totalProfit = unitProfit * qty;
  const sellerProfit = calculateDomesticProfitAtFOB(fob, qty, type, inputs);
  
  return { 
    containerCount: m, 
    totalFreightUSD, 
    unitFreightUSD: F_USD, 
    insuranceUSD: I_USD, 
    unitCost, 
    totalLandedCost,
    unitProfit, 
    totalProfit, 
    sellerProfit,
    margin: sellPrice > 0 ? unitProfit / sellPrice : 0, 
    F_USD 
  };
};

export const calculateDomesticProfitAtFOB = (fob: number, q: number, type: ProductType, inputs: Inputs): number => {
    const { priceSteel, pricePV, priceCar, exchangeRate, miscFee } = inputs;
    if (q <= 0) return 0;
    let basePrice = type === ProductType.STEEL ? priceSteel : type === ProductType.PV ? pricePV : priceCar;
    const x = getDiscountedPrice(type, basePrice, q);
    const avgMiscRMB = miscFee / q;
    const N_USD = (x + avgMiscRMB) / exchangeRate;
    return (fob - N_USD) * 0.8 * q;
};

export const calculateTargetFOB = (desiredMargin: number, sellPrice: number, unitFreight: number): number => {
    const targetNetProfit = sellPrice * desiredMargin;
    const targetCost = sellPrice - (targetNetProfit / 0.8);
    const factor = 1.25 + 0.033;
    const targetFOB = (targetCost - unitFreight) / factor;
    return targetFOB > 0 ? targetFOB : 0;
};

export const findDominantMargin = (q: number, type: ProductType, inputs: Inputs): { requiredK: number; domesticProfit: number; foreignProfit: number } | null => {
    const tempInputs = { ...inputs };
    for (let k = 0.01; k < 2.0; k += 0.01) {
        tempInputs.margin = k;
        const res = calculateScenario(q, type, tempInputs);
        if (res.domesticTotalProfitUSD > (res.foreignTotalProfitUSD * 1.18)) {
            return { requiredK: k, domesticProfit: res.domesticTotalProfitUSD, foreignProfit: res.foreignTotalProfitUSD };
        }
    }
    return null;
};
