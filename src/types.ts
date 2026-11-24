export type DatasetId = 'hyderabad' | 'ames' | 'california' | 'multi';
export type GnnBackbone = 'graphsage' | 'chebnet';
export type PoiCategory = 'school' | 'transit' | 'commercial' | 'hospital';
export type PropertyType = 'Apartment' | 'Villa' | 'Independent House' | 'Townhouse';
export type BuildingStatus = 'Ready to Move' | 'Under Construction' | 'Resale';
export type PriceTier = 'Budget' | 'Mid-Market' | 'Premium';
export type AreaUnit = 'sqft' | 'sqyd';

export interface PoiNode {
  id: string;
  name: string;
  category: PoiCategory;
  lat: number;
  lng: number;
  prestigeScore: number; // 0.4 to 1.0
  dataset: Exclude<DatasetId, 'multi'>;
}

export interface LocalityInfo {
  name: string;
  lat: number;
  lng: number;
  baseRatePerSqFt: number; // in native currency units
  clusterTier: PriceTier;
  dataset: Exclude<DatasetId, 'multi'>;
}

export interface PropertyRecord {
  id: string;
  dataset: Exclude<DatasetId, 'multi'>;
  title: string;
  locality: string;
  lat: number;
  lng: number;
  areaSqFt: number;
  bedrooms: number;
  bathrooms: number;
  qualityScore: number; // 1 - 10
  ageYears: number;
  propertyType: PropertyType;
  floorsCount: number;
  buildingStatus: BuildingStatus;
  priceNative: number; // ₹ Lakhs for Hyderabad, $k for Ames & California
  priceNormalizedUsdK: number; // Unified USD ($k) for multi-dataset joint modeling
  priceTier: PriceTier;
}

export interface DatasetSummary {
  id: DatasetId;
  name: string;
  regionLabel: string;
  currencySymbol: string;
  currencyUnit: string;
  totalRows: number;
  sampledGraphNodes: number;
  poiCount: number;
  localityCount: number;
  sourceCitation: string;
  spatialEnrichment: string;
  localities: LocalityInfo[];
  sampleProperties: PropertyRecord[];
}

export interface ModelMetrics {
  modelKey: 'gbdt' | 'gnn' | 'hybrid';
  modelName: string;
  rmse: number;
  mae: number;
  mape: number;
  r2: number;
  tierMetrics: Record<PriceTier, { count: number; rmse: number; mape: number; r2: number }>;
  trainTimeMs: number;
}

export interface ScatterPoint {
  id: string;
  locality: string;
  actual: number;
  predictedHybrid: number;
  predictedGbdt: number;
  predictedGnn: number;
  tier: PriceTier;
}

export interface TrainingBenchmarkResult {
  datasetId: DatasetId;
  backbone: GnnBackbone;
  currencyUnit: string;
  trainSamples: number;
  testSamples: number;
  hyperparams: {
    trees: number;
    learningRate: number;
    maxDepth: number;
    sigmaKm: number;
    embeddingDim: number;
  };
  models: ModelMetrics[];
  globalXaiImportance: Array<{
    feature: string;
    group: 'Property' | 'Spatial';
    importancePct: number;
  }>;
  clusterStabilityMean: number;
  scatterPoints: ScatterPoint[];
  trainedAtIso: string;
}

export interface ValuationRequest {
  datasetId: DatasetId;
  backbone: GnnBackbone;
  locality: string;
  lat: number;
  lng: number;
  areaSqFt: number;
  bedrooms: number;
  bathrooms: number;
  qualityScore: number;
  ageYears: number;
  propertyType: PropertyType;
  floorsCount?: number;
  buildingStatus: BuildingStatus;
}

export interface XaiContribution {
  factor: string;
  category: 'Property' | 'Spatial';
  deltaValue: number;
  description: string;
}

export interface NearbyPoiDetail {
  id: string;
  name: string;
  category: PoiCategory;
  distanceKm: number;
  edgeWeight: number;
  estimatedImpact: number;
  lat: number;
  lng: number;
}

export interface ValuationResponse {
  datasetId: DatasetId;
  backbone: GnnBackbone;
  currencyUnit: string;
  currencySymbol: string;
  predictedHybrid: number;
  predictedGbdtBaseline: number;
  predictedGnnBaseline: number;
  confidenceLow: number;
  confidenceHigh: number;
  pricePerSqFt: number;
  priceTier: PriceTier;
  baseExpectedValue: number;
  xaiContributions: XaiContribution[];
  spatialEmbedding: number[];
  nearbyPois: NearbyPoiDetail[];
  nearestPeers: Array<{
    id: string;
    locality: string;
    areaSqFt: number;
    bedrooms: number;
    priceNative: number;
    distanceKm: number;
    edgeWeight: number;
  }>;
  clusterStabilityScore: number; // 0 to 1 cosine stability across k-NN spatial cluster
}

export interface GraphExplorerPayload {
  datasetId: DatasetId;
  backbone: GnnBackbone;
  scope: 'local' | 'region';
  activeNodeId?: string;
  focusLocality?: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  properties: Array<PropertyRecord & { embedding: number[]; clusterStability: number }>;
  pois: PoiNode[];
  edges: Array<{
    source: string;
    target: string;
    kind: 'poi' | 'peer';
    distanceKm: number;
    weight: number;
  }>;
}
