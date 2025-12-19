
export enum ProductType {
  STEEL = 'STEEL',
  PV = 'PV',
  CAR = 'CAR',
}

export enum Destination {
  LA = 'LA',           // 20ft
  NY = 'NY',           // 20ft
  MIAMI = 'MIAMI',     // 40ft
  SEATTLE = 'SEATTLE', // 40ft
}

export interface Inputs {
  priceSteel: number;
  pricePV: number;
  priceCar: number;
  exchangeRate: number; // c
  freightCostUSD: number; // d
  balance: number; // e (10k CNY)
  reserve: number; // g (10k CNY)
  margin: number; // k (percentage 0-1)
  sellPriceSteelUSD: number; // r
  sellPricePVUSD: number; // r
  sellPriceCarUSD: number; // r
  foreignBalance: number; // Foreign Buyer Budget in USD
  destination: Destination;
  miscFee: number; // 杂费 (RMB)
}

export interface CalculationResult {
  quantity: number;
  unitPriceRMB: number;
  containerCount: number;
  containerType: '20ft' | '40ft';
  containerUtilization: number;
  spareCapacity: number; 
  totalFreightUSD: number;
  avgMiscRMB: number;
  N_USD: number; // Cost
  FOB_USD: number;
  CFR_USD: number;
  CIF_USD: number;
  I_USD: number; // Insurance
  F_USD: number; // Unit Freight
  foreignActualCostUSD: number;
  domesticUnitProfitUSD: number;
  domesticTotalProfitUSD: number;
  foreignUnitProfitUSD: number;
  foreignTotalProfitUSD: number;
  jointTotalProfitUSD: number;
  domesticTotalCostRMB: number;
  isOptimal?: boolean;
}

export interface OptimizationResult {
  type: ProductType;
  optimal: CalculationResult;
  dataPoints: CalculationResult[];
  maxAffordableQ: number;
}
