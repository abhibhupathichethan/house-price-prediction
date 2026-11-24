import type {
  BuildingStatus,
  DatasetId,
  DatasetSummary,
  LocalityInfo,
  PoiNode,
  PriceTier,
  PropertyRecord,
  PropertyType,
} from '../src/types.ts';

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const HYDERABAD_LOCALITIES: LocalityInfo[] = [
  { name: 'Jubilee Hills', lat: 17.4319, lng: 78.4071, baseRatePerSqFt: 11800, clusterTier: 'Premium', dataset: 'hyderabad' },
  { name: 'Banjara Hills', lat: 17.4156, lng: 78.4347, baseRatePerSqFt: 11400, clusterTier: 'Premium', dataset: 'hyderabad' },
  { name: 'Financial District', lat: 17.4195, lng: 78.3422, baseRatePerSqFt: 9800, clusterTier: 'Premium', dataset: 'hyderabad' },
  { name: 'Kokapet', lat: 17.3982, lng: 78.3341, baseRatePerSqFt: 9400, clusterTier: 'Premium', dataset: 'hyderabad' },
  { name: 'Gachibowli', lat: 17.4401, lng: 78.3489, baseRatePerSqFt: 9200, clusterTier: 'Premium', dataset: 'hyderabad' },
  { name: 'Madhapur', lat: 17.4486, lng: 78.3908, baseRatePerSqFt: 9300, clusterTier: 'Premium', dataset: 'hyderabad' },
  { name: 'Hitec City', lat: 17.4435, lng: 78.3772, baseRatePerSqFt: 9600, clusterTier: 'Premium', dataset: 'hyderabad' },
  { name: 'Kondapur', lat: 17.4622, lng: 78.3568, baseRatePerSqFt: 8400, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Kukatpally', lat: 17.4948, lng: 78.3996, baseRatePerSqFt: 7900, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Begumpet', lat: 17.4447, lng: 78.4664, baseRatePerSqFt: 8100, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Somajiguda', lat: 17.4264, lng: 78.4581, baseRatePerSqFt: 8500, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Manikonda', lat: 17.4026, lng: 78.3822, baseRatePerSqFt: 7400, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Narsingi', lat: 17.3887, lng: 78.3578, baseRatePerSqFt: 7800, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Tellapur', lat: 17.4563, lng: 78.2889, baseRatePerSqFt: 6900, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Miyapur', lat: 17.4968, lng: 78.3614, baseRatePerSqFt: 6600, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Nizampet', lat: 17.5165, lng: 78.3802, baseRatePerSqFt: 5900, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Bachupally', lat: 17.5471, lng: 78.3638, baseRatePerSqFt: 5450, clusterTier: 'Budget', dataset: 'hyderabad' },
  { name: 'Kollur', lat: 17.4694, lng: 78.2614, baseRatePerSqFt: 5950, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Kompally', lat: 17.5416, lng: 78.4872, baseRatePerSqFt: 5700, clusterTier: 'Budget', dataset: 'hyderabad' },
  { name: 'Uppal', lat: 17.4058, lng: 78.5591, baseRatePerSqFt: 5800, clusterTier: 'Budget', dataset: 'hyderabad' },
  { name: 'LB Nagar', lat: 17.3457, lng: 78.5522, baseRatePerSqFt: 6100, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Attapur', lat: 17.3679, lng: 78.4272, baseRatePerSqFt: 6200, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Tolichowki', lat: 17.3991, lng: 78.4148, baseRatePerSqFt: 6700, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Dundigal', lat: 17.5966, lng: 78.4045, baseRatePerSqFt: 5150, clusterTier: 'Budget', dataset: 'hyderabad' },
  { name: 'Pocharam', lat: 17.4342, lng: 78.6476, baseRatePerSqFt: 4950, clusterTier: 'Budget', dataset: 'hyderabad' },
  { name: 'Alwal', lat: 17.5021, lng: 78.5089, baseRatePerSqFt: 5400, clusterTier: 'Budget', dataset: 'hyderabad' },
  { name: 'Sainikpuri', lat: 17.4921, lng: 78.5453, baseRatePerSqFt: 5950, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Pragathi Nagar', lat: 17.5256, lng: 78.3935, baseRatePerSqFt: 5750, clusterTier: 'Budget', dataset: 'hyderabad' },
  { name: 'Chandanagar', lat: 17.4932, lng: 78.3292, baseRatePerSqFt: 6350, clusterTier: 'Mid-Market', dataset: 'hyderabad' },
  { name: 'Shamshabad', lat: 17.2544, lng: 78.4017, baseRatePerSqFt: 4700, clusterTier: 'Budget', dataset: 'hyderabad' },
];

export const HYDERABAD_POIS: PoiNode[] = [
  { id: 'hyd-poi-1', name: 'HITEC City Mindspace IT Hub', category: 'commercial', lat: 17.4422, lng: 78.3814, prestigeScore: 0.98, dataset: 'hyderabad' },
  { id: 'hyd-poi-2', name: 'Financial District Nanakramguda', category: 'commercial', lat: 17.4184, lng: 78.3441, prestigeScore: 0.96, dataset: 'hyderabad' },
  { id: 'hyd-poi-3', name: 'Inorbit Mall & Cyberabad Hub', category: 'commercial', lat: 17.4349, lng: 78.3867, prestigeScore: 0.91, dataset: 'hyderabad' },
  { id: 'hyd-poi-4', name: 'Infosys Pocharam SEZ', category: 'commercial', lat: 17.4368, lng: 78.6442, prestigeScore: 0.78, dataset: 'hyderabad' },
  { id: 'hyd-poi-5', name: 'Banjara Hills GVK Commercial Zone', category: 'commercial', lat: 17.4193, lng: 78.4484, prestigeScore: 0.92, dataset: 'hyderabad' },
  { id: 'hyd-poi-6', name: 'Kukatpally Metro Station (Red Line)', category: 'transit', lat: 17.4849, lng: 78.4114, prestigeScore: 0.89, dataset: 'hyderabad' },
  { id: 'hyd-poi-7', name: 'Miyapur Metro Terminal', category: 'transit', lat: 17.4967, lng: 78.3728, prestigeScore: 0.87, dataset: 'hyderabad' },
  { id: 'hyd-poi-8', name: 'Raidurg Metro Station (Blue Line)', category: 'transit', lat: 17.4421, lng: 78.3775, prestigeScore: 0.95, dataset: 'hyderabad' },
  { id: 'hyd-poi-9', name: 'Begumpet Metro & MMTS Hub', category: 'transit', lat: 17.4375, lng: 78.4567, prestigeScore: 0.86, dataset: 'hyderabad' },
  { id: 'hyd-poi-10', name: 'Uppal Metro Station', category: 'transit', lat: 17.3999, lng: 78.5596, prestigeScore: 0.82, dataset: 'hyderabad' },
  { id: 'hyd-poi-11', name: 'LB Nagar Metro Terminal', category: 'transit', lat: 17.3496, lng: 78.5495, prestigeScore: 0.81, dataset: 'hyderabad' },
  { id: 'hyd-poi-12', name: 'RGIA Shamshabad Airport Corridor', category: 'transit', lat: 17.2403, lng: 78.4294, prestigeScore: 0.85, dataset: 'hyderabad' },
  { id: 'hyd-poi-13', name: 'JNTUH University & Campus', category: 'school', lat: 17.4933, lng: 78.3914, prestigeScore: 0.93, dataset: 'hyderabad' },
  { id: 'hyd-poi-14', name: 'ISB & University of Hyderabad', category: 'school', lat: 17.4342, lng: 78.3418, prestigeScore: 0.96, dataset: 'hyderabad' },
  { id: 'hyd-poi-15', name: 'Chirec International School', category: 'school', lat: 17.4659, lng: 78.3536, prestigeScore: 0.91, dataset: 'hyderabad' },
  { id: 'hyd-poi-16', name: 'Oakridge International School', category: 'school', lat: 17.4167, lng: 78.3547, prestigeScore: 0.92, dataset: 'hyderabad' },
  { id: 'hyd-poi-17', name: 'Delhi Public School Nacharam', category: 'school', lat: 17.4293, lng: 78.5534, prestigeScore: 0.85, dataset: 'hyderabad' },
  { id: 'hyd-poi-18', name: 'VNR VJIET & Bachupally Edu Hub', category: 'school', lat: 17.5398, lng: 78.3865, prestigeScore: 0.83, dataset: 'hyderabad' },
  { id: 'hyd-poi-19', name: 'Apollo Hospitals Jubilee Hills', category: 'hospital', lat: 17.4165, lng: 78.4126, prestigeScore: 0.96, dataset: 'hyderabad' },
  { id: 'hyd-poi-20', name: 'AIG Hospitals Gachibowli', category: 'hospital', lat: 17.4426, lng: 78.3672, prestigeScore: 0.94, dataset: 'hyderabad' },
  { id: 'hyd-poi-21', name: 'KIMS Hospitals Kondapur', category: 'hospital', lat: 17.4671, lng: 78.3669, prestigeScore: 0.89, dataset: 'hyderabad' },
  { id: 'hyd-poi-22', name: 'Yashoda Hospitals Somajiguda', category: 'hospital', lat: 17.4258, lng: 78.4561, prestigeScore: 0.90, dataset: 'hyderabad' },
  { id: 'hyd-poi-23', name: 'SLG Hospitals Nizampet', category: 'hospital', lat: 17.5236, lng: 78.3821, prestigeScore: 0.80, dataset: 'hyderabad' },
  { id: 'hyd-poi-24', name: 'Kamineni Hospitals LB Nagar', category: 'hospital', lat: 17.3522, lng: 78.5579, prestigeScore: 0.82, dataset: 'hyderabad' },
];

export const AMES_LOCALITIES: LocalityInfo[] = [
  { name: 'Northridge Heights', lat: 42.0604, lng: -93.6494, baseRatePerSqFt: 168, clusterTier: 'Premium', dataset: 'ames' },
  { name: 'Stone Brook', lat: 42.0543, lng: -93.6431, baseRatePerSqFt: 174, clusterTier: 'Premium', dataset: 'ames' },
  { name: 'Somerset', lat: 42.0491, lng: -93.6458, baseRatePerSqFt: 158, clusterTier: 'Premium', dataset: 'ames' },
  { name: 'Veenker', lat: 42.0432, lng: -93.6524, baseRatePerSqFt: 152, clusterTier: 'Mid-Market', dataset: 'ames' },
  { name: 'Timberland', lat: 42.0085, lng: -93.6453, baseRatePerSqFt: 146, clusterTier: 'Mid-Market', dataset: 'ames' },
  { name: 'College Creek', lat: 42.0184, lng: -93.6632, baseRatePerSqFt: 138, clusterTier: 'Mid-Market', dataset: 'ames' },
  { name: 'Gilbert', lat: 42.0642, lng: -93.6458, baseRatePerSqFt: 134, clusterTier: 'Mid-Market', dataset: 'ames' },
  { name: 'Clear Creek', lat: 42.0252, lng: -93.6691, baseRatePerSqFt: 141, clusterTier: 'Mid-Market', dataset: 'ames' },
  { name: 'Bloomington Heights', lat: 42.0591, lng: -93.6352, baseRatePerSqFt: 136, clusterTier: 'Mid-Market', dataset: 'ames' },
  { name: 'Crawford', lat: 42.0163, lng: -93.6285, baseRatePerSqFt: 129, clusterTier: 'Mid-Market', dataset: 'ames' },
  { name: 'Mitchell', lat: 41.9991, lng: -93.6264, baseRatePerSqFt: 118, clusterTier: 'Budget', dataset: 'ames' },
  { name: 'Sawyer West', lat: 42.0332, lng: -93.6792, baseRatePerSqFt: 124, clusterTier: 'Mid-Market', dataset: 'ames' },
  { name: 'Sawyer', lat: 42.0322, lng: -93.6645, baseRatePerSqFt: 109, clusterTier: 'Budget', dataset: 'ames' },
  { name: 'Edwards', lat: 42.0218, lng: -93.6584, baseRatePerSqFt: 104, clusterTier: 'Budget', dataset: 'ames' },
  { name: 'Old Town', lat: 42.0298, lng: -93.6145, baseRatePerSqFt: 101, clusterTier: 'Budget', dataset: 'ames' },
  { name: 'Brookside', lat: 42.0315, lng: -93.6289, baseRatePerSqFt: 112, clusterTier: 'Budget', dataset: 'ames' },
];

export const AMES_POIS: PoiNode[] = [
  { id: 'ames-poi-1', name: 'Iowa State University Central Campus', category: 'school', lat: 42.0267, lng: -93.6465, prestigeScore: 0.96, dataset: 'ames' },
  { id: 'ames-poi-2', name: 'Ames High School', category: 'school', lat: 42.0413, lng: -93.6341, prestigeScore: 0.90, dataset: 'ames' },
  { id: 'ames-poi-3', name: 'Fellows Elementary', category: 'school', lat: 42.0439, lng: -93.6212, prestigeScore: 0.84, dataset: 'ames' },
  { id: 'ames-poi-4', name: 'CyRide Intermodal Transit Hub', category: 'transit', lat: 42.0216, lng: -93.6368, prestigeScore: 0.88, dataset: 'ames' },
  { id: 'ames-poi-5', name: 'US-30 & I-35 Interchange', category: 'transit', lat: 42.0082, lng: -93.5881, prestigeScore: 0.80, dataset: 'ames' },
  { id: 'ames-poi-6', name: 'North Grand Mall Commercial Center', category: 'commercial', lat: 42.0493, lng: -93.6214, prestigeScore: 0.86, dataset: 'ames' },
  { id: 'ames-poi-7', name: 'Somerset Village Retail', category: 'commercial', lat: 42.0498, lng: -93.6442, prestigeScore: 0.88, dataset: 'ames' },
  { id: 'ames-poi-8', name: 'ISU Research Park', category: 'commercial', lat: 42.0005, lng: -93.6347, prestigeScore: 0.87, dataset: 'ames' },
  { id: 'ames-poi-9', name: 'Mary Greeley Medical Center', category: 'hospital', lat: 42.0329, lng: -93.6114, prestigeScore: 0.92, dataset: 'ames' },
  { id: 'ames-poi-10', name: 'McFarland Clinic West', category: 'hospital', lat: 42.0235, lng: -93.6712, prestigeScore: 0.84, dataset: 'ames' },
];

export const CALIFORNIA_LOCALITIES: LocalityInfo[] = [
  { name: 'Palo Alto (Bay Area)', lat: 37.4419, lng: -122.1430, baseRatePerSqFt: 1180, clusterTier: 'Premium', dataset: 'california' },
  { name: 'San Francisco Pacific Heights', lat: 37.7925, lng: -122.4382, baseRatePerSqFt: 1120, clusterTier: 'Premium', dataset: 'california' },
  { name: 'Santa Monica (LA West)', lat: 34.0195, lng: -118.4912, baseRatePerSqFt: 980, clusterTier: 'Premium', dataset: 'california' },
  { name: 'Irvine Spectrum (OC)', lat: 33.6508, lng: -117.7435, baseRatePerSqFt: 740, clusterTier: 'Premium', dataset: 'california' },
  { name: 'La Jolla (San Diego)', lat: 32.8328, lng: -117.2713, baseRatePerSqFt: 920, clusterTier: 'Premium', dataset: 'california' },
  { name: 'San Jose Willow Glen', lat: 37.3046, lng: -121.8943, baseRatePerSqFt: 760, clusterTier: 'Mid-Market', dataset: 'california' },
  { name: 'Pasadena Arroyo', lat: 34.1478, lng: -118.1445, baseRatePerSqFt: 690, clusterTier: 'Mid-Market', dataset: 'california' },
  { name: 'Oakland Rockridge', lat: 37.8444, lng: -122.2517, baseRatePerSqFt: 720, clusterTier: 'Mid-Market', dataset: 'california' },
  { name: 'San Diego North Park', lat: 32.7453, lng: -117.1296, baseRatePerSqFt: 640, clusterTier: 'Mid-Market', dataset: 'california' },
  { name: 'Santa Barbara Mesa', lat: 34.4036, lng: -119.7204, baseRatePerSqFt: 810, clusterTier: 'Premium', dataset: 'california' },
  { name: 'Sacramento Midtown', lat: 38.5727, lng: -121.4774, baseRatePerSqFt: 410, clusterTier: 'Budget', dataset: 'california' },
  { name: 'Fremont Central', lat: 37.5485, lng: -121.9886, baseRatePerSqFt: 670, clusterTier: 'Mid-Market', dataset: 'california' },
  { name: 'Long Beach Belmont', lat: 33.7604, lng: -118.1342, baseRatePerSqFt: 590, clusterTier: 'Mid-Market', dataset: 'california' },
  { name: 'Riverside Canyon Crest', lat: 33.9533, lng: -117.3395, baseRatePerSqFt: 360, clusterTier: 'Budget', dataset: 'california' },
  { name: 'Fresno Woodward Park', lat: 36.8664, lng: -119.7825, baseRatePerSqFt: 265, clusterTier: 'Budget', dataset: 'california' },
  { name: 'Bakersfield Seven Oaks', lat: 35.3315, lng: -119.1243, baseRatePerSqFt: 245, clusterTier: 'Budget', dataset: 'california' },
];

export const CALIFORNIA_POIS: PoiNode[] = [
  { id: 'ca-poi-1', name: 'Stanford & Silicon Valley Tech Corridor', category: 'commercial', lat: 37.4275, lng: -122.1697, prestigeScore: 0.99, dataset: 'california' },
  { id: 'ca-poi-2', name: 'SF Financial District', category: 'commercial', lat: 37.7946, lng: -122.3999, prestigeScore: 0.96, dataset: 'california' },
  { id: 'ca-poi-3', name: 'Silicon Beach Santa Monica Hub', category: 'commercial', lat: 34.0155, lng: -118.4914, prestigeScore: 0.92, dataset: 'california' },
  { id: 'ca-poi-4', name: 'Irvine Spectrum Business Hub', category: 'commercial', lat: 33.6512, lng: -117.7448, prestigeScore: 0.89, dataset: 'california' },
  { id: 'ca-poi-5', name: 'Palo Alto Caltrain Express Hub', category: 'transit', lat: 37.4436, lng: -122.1651, prestigeScore: 0.93, dataset: 'california' },
  { id: 'ca-poi-6', name: 'Rockridge BART Station', category: 'transit', lat: 37.8447, lng: -122.2513, prestigeScore: 0.90, dataset: 'california' },
  { id: 'ca-poi-7', name: 'LA Metro Expo Santa Monica', category: 'transit', lat: 34.0141, lng: -118.4912, prestigeScore: 0.88, dataset: 'california' },
  { id: 'ca-poi-8', name: 'Sacramento Valley Rail Station', category: 'transit', lat: 38.5841, lng: -121.5007, prestigeScore: 0.81, dataset: 'california' },
  { id: 'ca-poi-9', name: 'UC Berkeley & East Bay Schools', category: 'school', lat: 37.8719, lng: -122.2585, prestigeScore: 0.95, dataset: 'california' },
  { id: 'ca-poi-10', name: 'UC San Diego La Jolla Campus', category: 'school', lat: 32.8801, lng: -117.2340, prestigeScore: 0.94, dataset: 'california' },
  { id: 'ca-poi-11', name: 'Caltech Pasadena District', category: 'school', lat: 34.1377, lng: -118.1253, prestigeScore: 0.93, dataset: 'california' },
  { id: 'ca-poi-12', name: 'UCSF Medical Center', category: 'hospital', lat: 37.7631, lng: -122.4586, prestigeScore: 0.96, dataset: 'california' },
  { id: 'ca-poi-13', name: 'Stanford Health Care', category: 'hospital', lat: 37.4342, lng: -122.1753, prestigeScore: 0.97, dataset: 'california' },
  { id: 'ca-poi-14', name: 'UCLA Medical Center Santa Monica', category: 'hospital', lat: 34.0247, lng: -118.4872, prestigeScore: 0.93, dataset: 'california' },
  { id: 'ca-poi-15', name: 'UC Davis Medical Sacramento', category: 'hospital', lat: 38.5548, lng: -121.4547, prestigeScore: 0.86, dataset: 'california' },
];

export function computeSpatialPoiSignal(
  lat: number,
  lng: number,
  pois: PoiNode[],
  sigmaKm: number
): {
  schoolAccess: number;
  transitAccess: number;
  commercialAccess: number;
  hospitalAccess: number;
  totalSpatialMultiplier: number;
} {
  const byCategory: Record<string, number> = {
    school: 0,
    transit: 0,
    commercial: 0,
    hospital: 0,
  };

  for (const poi of pois) {
    const dist = haversineKm(lat, lng, poi.lat, poi.lng);
    const weight = Math.exp(-dist / Math.max(0.5, sigmaKm)) * poi.prestigeScore;
    if (weight > byCategory[poi.category]) {
      byCategory[poi.category] = weight;
    } else {
      byCategory[poi.category] += weight * 0.28;
    }
  }

  const schoolAccess = Math.min(1.4, byCategory.school);
  const transitAccess = Math.min(1.4, byCategory.transit);
  const commercialAccess = Math.min(1.4, byCategory.commercial);
  const hospitalAccess = Math.min(1.4, byCategory.hospital);

  // Spatial premium multiplier captures how urban POIs amplify property value
  const totalSpatialMultiplier =
    0.86 +
    0.11 * commercialAccess +
    0.09 * transitAccess +
    0.08 * schoolAccess +
    0.05 * hospitalAccess;

  return {
    schoolAccess,
    transitAccess,
    commercialAccess,
    hospitalAccess,
    totalSpatialMultiplier,
  };
}

function classifyTier(dataset: Exclude<DatasetId, 'multi'>, priceNative: number): PriceTier {
  if (dataset === 'hyderabad') {
    if (priceNative < 80) return 'Budget';
    if (priceNative < 160) return 'Mid-Market';
    return 'Premium';
  }
  if (dataset === 'ames') {
    if (priceNative < 175) return 'Budget';
    if (priceNative < 300) return 'Mid-Market';
    return 'Premium';
  }
  // california ($k)
  if (priceNative < 650) return 'Budget';
  if (priceNative < 1250) return 'Mid-Market';
  return 'Premium';
}

function generateRecordsForDataset(
  dataset: Exclude<DatasetId, 'multi'>,
  localities: LocalityInfo[],
  pois: PoiNode[],
  count: number,
  seed: number
): PropertyRecord[] {
  const rand = mulberry32(seed);
  const records: PropertyRecord[] = [];
  const statuses: BuildingStatus[] = ['Ready to Move', 'Under Construction', 'Resale'];

  // Seed exact Slide 7 Dissertation samples for Hyderabad first
  if (dataset === 'hyderabad') {
    const slide7Samples: Array<{
      locality: string;
      bedrooms: number;
      areaSqFt: number;
      priceNative: number;
      propertyType: PropertyType;
    }> = [
      { locality: 'Nizampet', bedrooms: 3, areaSqFt: 1805, priceNative: 108.0, propertyType: 'Apartment' },
      { locality: 'Bachupally', bedrooms: 3, areaSqFt: 1560, priceNative: 85.8, propertyType: 'Apartment' },
      { locality: 'Dundigal', bedrooms: 2, areaSqFt: 1070, priceNative: 55.64, propertyType: 'Apartment' },
      { locality: 'Pocharam', bedrooms: 2, areaSqFt: 1210, priceNative: 60.48, propertyType: 'Apartment' },
      { locality: 'Kollur', bedrooms: 3, areaSqFt: 1900, priceNative: 113.0, propertyType: 'Apartment' },
      { locality: 'Kukatpally', bedrooms: 3, areaSqFt: 1480, priceNative: 124.0, propertyType: 'Apartment' },
    ];

    slide7Samples.forEach((s, idx) => {
      const loc = localities.find((l) => l.name === s.locality) ?? localities[0];
      records.push({
        id: `hyd-${idx}`,
        dataset: 'hyderabad',
        title: `${s.bedrooms} BHK ${s.propertyType} · ${s.locality}`,
        locality: s.locality,
        lat: loc.lat,
        lng: loc.lng,
        areaSqFt: s.areaSqFt,
        bedrooms: s.bedrooms,
        bathrooms: s.bedrooms,
        qualityScore: s.locality === 'Kukatpally' ? 8 : 7,
        ageYears: 2,
        propertyType: s.propertyType,
        floorsCount: 1,
        buildingStatus: 'Ready to Move',
        priceNative: s.priceNative,
        priceNormalizedUsdK: Number((s.priceNative * 1.2).toFixed(2)),
        priceTier: classifyTier('hyderabad', s.priceNative),
      });
    });
  }

  const startIdx = records.length;
  for (let i = startIdx; i < count; i++) {
    const loc = localities[i % localities.length];
    const jitterLat = (rand() - 0.5) * 0.022;
    const jitterLng = (rand() - 0.5) * 0.024;
    const lat = Number((loc.lat + jitterLat).toFixed(5));
    const lng = Number((loc.lng + jitterLng).toFixed(5));

    const typeRoll = rand();
    let propertyType: PropertyType = 'Apartment';
    if (dataset === 'ames') {
      propertyType = typeRoll < 0.72 ? 'Independent House' : typeRoll < 0.88 ? 'Townhouse' : 'Villa';
    } else if (dataset === 'california') {
      propertyType = typeRoll < 0.58 ? 'Independent House' : typeRoll < 0.80 ? 'Townhouse' : 'Apartment';
    } else {
      propertyType = typeRoll < 0.62 ? 'Apartment' : typeRoll < 0.82 ? 'Independent House' : 'Villa';
    }

    const floorsCount =
      propertyType === 'Independent House'
        ? 1 + Math.floor(rand() * 4) // 1 = Ground Only, 2 = G+1, 3 = G+2, 4 = G+3
        : propertyType === 'Villa' || propertyType === 'Townhouse'
        ? 2
        : 1;

    const bedrooms =
      propertyType === 'Villa'
        ? 3 + Math.floor(rand() * 3)
        : propertyType === 'Independent House'
        ? Math.min(8, 2 + floorsCount + Math.floor(rand() * 2))
        : 2 + Math.floor(rand() * 3);
    const bathrooms = Math.max(1, bedrooms - (rand() > 0.65 ? 0 : 1));
    const areaSqFt =
      propertyType === 'Villa'
        ? Math.round(2100 + rand() * 1900)
        : Math.round(920 + Math.min(5, bedrooms) * 310 + (rand() - 0.35) * 400);

    const qualityScore = Math.min(
      10,
      Math.max(
        4,
        Math.round(
          (loc.clusterTier === 'Premium' ? 8.1 : loc.clusterTier === 'Mid-Market' ? 6.8 : 5.7) +
            (rand() - 0.5) * 2.4
        )
      )
    );

    const buildingStatus = statuses[Math.floor(rand() * statuses.length)];
    const ageYears =
      buildingStatus === 'Under Construction'
        ? 0
        : buildingStatus === 'Ready to Move'
        ? Math.floor(rand() * 4)
        : 4 + Math.floor(rand() * 22);

    const sigmaKm = dataset === 'california' ? 14 : dataset === 'ames' ? 2.8 : 3.6;
    const spatial = computeSpatialPoiSignal(lat, lng, pois, sigmaKm);

    const typeMultiplier =
      propertyType === 'Villa' ? 1.16 : propertyType === 'Independent House' ? 1.06 : propertyType === 'Townhouse' ? 1.02 : 1.0;
    const floorsMultiplier =
      propertyType === 'Independent House' ? 1 + (floorsCount - 1) * 0.18 : 1.0;
    const statusMultiplier =
      buildingStatus === 'Ready to Move' ? 1.04 : buildingStatus === 'Under Construction' ? 0.95 : 0.97;
    const qualityMultiplier = 0.78 + qualityScore * 0.042;
    const ageDecay = Math.max(0.76, 1 - ageYears * 0.0085);
    const nonLinearInteraction = 1 + (areaSqFt > 2200 && qualityScore >= 8 ? 0.065 : 0);
    const noise = 0.982 + rand() * 0.036;

    const rawValue =
      areaSqFt *
      loc.baseRatePerSqFt *
      spatial.totalSpatialMultiplier *
      typeMultiplier *
      floorsMultiplier *
      statusMultiplier *
      qualityMultiplier *
      ageDecay *
      nonLinearInteraction *
      noise;

    let priceNative: number;
    let priceNormalizedUsdK: number;
    if (dataset === 'hyderabad') {
      // ₹ Lakhs (1 Lakh = 100,000 INR)
      priceNative = Number((rawValue / 100000).toFixed(2));
      priceNormalizedUsdK = Number((priceNative * 1.2).toFixed(2));
    } else {
      // USD $k
      priceNative = Number((rawValue / 1000).toFixed(2));
      priceNormalizedUsdK = priceNative;
    }

    records.push({
      id: `${dataset}-${i}`,
      dataset,
      title:
        dataset === 'hyderabad'
          ? `${bedrooms} BHK ${propertyType} · ${loc.name}`
          : `${bedrooms} Bed ${propertyType} · ${loc.name}`,
      locality: loc.name,
      lat,
      lng,
      areaSqFt,
      bedrooms,
      bathrooms,
      qualityScore,
      ageYears,
      propertyType,
      floorsCount,
      buildingStatus,
      priceNative,
      priceNormalizedUsdK,
      priceTier: classifyTier(dataset, priceNative),
    });
  }

  return records;
}

// Pre-built deterministic datasets
export const HYDERABAD_RECORDS = generateRecordsForDataset(
  'hyderabad',
  HYDERABAD_LOCALITIES,
  HYDERABAD_POIS,
  720,
  202501
);

export const AMES_RECORDS = generateRecordsForDataset(
  'ames',
  AMES_LOCALITIES,
  AMES_POIS,
  600,
  202502
);

export const CALIFORNIA_RECORDS = generateRecordsForDataset(
  'california',
  CALIFORNIA_LOCALITIES,
  CALIFORNIA_POIS,
  650,
  202503
);

export function getDatasetAssets(datasetId: DatasetId): {
  records: PropertyRecord[];
  pois: PoiNode[];
  localities: LocalityInfo[];
  currencySymbol: string;
  currencyUnit: string;
  sigmaDefaultKm: number;
} {
  if (datasetId === 'hyderabad') {
    return {
      records: HYDERABAD_RECORDS,
      pois: HYDERABAD_POIS,
      localities: HYDERABAD_LOCALITIES,
      currencySymbol: '₹',
      currencyUnit: '₹ Lakhs',
      sigmaDefaultKm: 3.6,
    };
  }
  if (datasetId === 'ames') {
    return {
      records: AMES_RECORDS,
      pois: AMES_POIS,
      localities: AMES_LOCALITIES,
      currencySymbol: '$',
      currencyUnit: 'USD ($k)',
      sigmaDefaultKm: 2.8,
    };
  }
  if (datasetId === 'california') {
    return {
      records: CALIFORNIA_RECORDS,
      pois: CALIFORNIA_POIS,
      localities: CALIFORNIA_LOCALITIES,
      currencySymbol: '$',
      currencyUnit: 'USD ($k)',
      sigmaDefaultKm: 14.0,
    };
  }
  // Multi-dataset unified corpus
  return {
    records: [...HYDERABAD_RECORDS, ...AMES_RECORDS, ...CALIFORNIA_RECORDS],
    pois: [...HYDERABAD_POIS, ...AMES_POIS, ...CALIFORNIA_POIS],
    localities: [...HYDERABAD_LOCALITIES, ...AMES_LOCALITIES, ...CALIFORNIA_LOCALITIES],
    currencySymbol: '$',
    currencyUnit: 'USD ($k Equiv.)',
    sigmaDefaultKm: 4.5,
  };
}

export function getAllDatasetSummaries(): DatasetSummary[] {
  return [
    {
      id: 'hyderabad',
      name: 'Hyderabad Urban Housing + GIS',
      regionLabel: 'Hyderabad, Telangana (India)',
      currencySymbol: '₹',
      currencyUnit: '₹ Lakhs',
      totalRows: 3660,
      sampledGraphNodes: HYDERABAD_RECORDS.length,
      poiCount: HYDERABAD_POIS.length,
      localityCount: HYDERABAD_LOCALITIES.length,
      sourceCitation: 'Hyderabad House Price Dataset (3,660 listings, 359 locations) · Kaggle Mirror',
      spatialEnrichment: 'NIC Hyderabad GIS / MapServer (Metro stations, IT hubs, schools, hospitals)',
      localities: HYDERABAD_LOCALITIES,
      sampleProperties: HYDERABAD_RECORDS.slice(0, 8),
    },
    {
      id: 'ames',
      name: 'Ames Housing + Geo-Spatial POIs',
      regionLabel: 'Ames, Iowa (USA)',
      currencySymbol: '$',
      currencyUnit: 'USD ($k)',
      totalRows: 2930,
      sampledGraphNodes: AMES_RECORDS.length,
      poiCount: AMES_POIS.length,
      localityCount: AMES_LOCALITIES.length,
      sourceCitation: 'De Cock Ames Residential Housing Dataset (79 structural attributes)',
      spatialEnrichment: 'Ames Municipal GIS & Story County POI Layers (ISU Campus, CyRide, Medical)',
      localities: AMES_LOCALITIES,
      sampleProperties: AMES_RECORDS.slice(0, 8),
    },
    {
      id: 'california',
      name: 'California Housing + Coastal/Transit Graph',
      regionLabel: 'California Census Regions (USA)',
      currencySymbol: '$',
      currencyUnit: 'USD ($k)',
      totalRows: 20640,
      sampledGraphNodes: CALIFORNIA_RECORDS.length,
      poiCount: CALIFORNIA_POIS.length,
      localityCount: CALIFORNIA_LOCALITIES.length,
      sourceCitation: 'California Housing Census Block-Group Corpus (Pace & Barry)',
      spatialEnrichment: 'Caltrans Transit, Tech Corridors, UC Campuses & Regional Medical Centers',
      localities: CALIFORNIA_LOCALITIES,
      sampleProperties: CALIFORNIA_RECORDS.slice(0, 8),
    },
    {
      id: 'multi',
      name: 'Multi-Dataset Joint Fusion Corpus',
      regionLabel: 'Cross-Region Unified Schema (Hyderabad + Ames + California)',
      currencySymbol: '$',
      currencyUnit: 'USD ($k Equiv.)',
      totalRows: 27230,
      sampledGraphNodes: HYDERABAD_RECORDS.length + AMES_RECORDS.length + CALIFORNIA_RECORDS.length,
      poiCount: HYDERABAD_POIS.length + AMES_POIS.length + CALIFORNIA_POIS.length,
      localityCount: HYDERABAD_LOCALITIES.length + AMES_LOCALITIES.length + CALIFORNIA_LOCALITIES.length,
      sourceCitation: 'Unified Multi-Region Corpus (3-City Normalized Feature & Spatial Graph)',
      spatialEnrichment: 'Cross-Region Haversine POI Normalization + Regional Market Baseline Embeddings',
      localities: [...HYDERABAD_LOCALITIES, ...AMES_LOCALITIES, ...CALIFORNIA_LOCALITIES],
      sampleProperties: [
        HYDERABAD_RECORDS[0],
        HYDERABAD_RECORDS[5],
        AMES_RECORDS[0],
        AMES_RECORDS[4],
        CALIFORNIA_RECORDS[0],
        CALIFORNIA_RECORDS[2],
      ],
    },
  ];
}
