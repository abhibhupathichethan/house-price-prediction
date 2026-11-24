import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getAllDatasetSummaries, getDatasetAssets } from './server/datasets.ts';
import {
  getGraphExplorerData,
  runPropertyValuation,
  trainOrGetPipeline,
} from './server/mlEngine.ts';
import type {
  BuildingStatus,
  DatasetId,
  GnnBackbone,
  PriceTier,
  PropertyType,
  ValuationRequest,
} from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_DATASETS: DatasetId[] = ['hyderabad', 'ames', 'california', 'multi'];
const VALID_BACKBONES: GnnBackbone[] = ['graphsage', 'chebnet'];
const VALID_PROPERTY_TYPES: PropertyType[] = [
  'Apartment',
  'Villa',
  'Independent House',
  'Townhouse',
];
const VALID_BUILDING_STATUSES: BuildingStatus[] = [
  'Ready to Move',
  'Under Construction',
  'Resale',
];
const VALID_TIERS: PriceTier[] = ['Budget', 'Mid-Market', 'Premium'];

function parseDatasetId(raw: unknown): DatasetId | null {
  return typeof raw === 'string' && VALID_DATASETS.includes(raw as DatasetId)
    ? (raw as DatasetId)
    : null;
}

function parseBackbone(raw: unknown): GnnBackbone | null {
  return typeof raw === 'string' && VALID_BACKBONES.includes(raw as GnnBackbone)
    ? (raw as GnnBackbone)
    : null;
}

function isFiniteInRange(val: unknown, min: number, max: number): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'geovaluate-ml-backend' });
  });

  app.get('/api/datasets', (_req, res) => {
    res.json({ datasets: getAllDatasetSummaries() });
  });

  app.get('/api/datasets/:id/records', (req, res) => {
    const datasetId = parseDatasetId(req.params.id);
    if (!datasetId) {
      res.status(400).json({ error: 'Invalid dataset identifier.' });
      return;
    }

    const assets = getDatasetAssets(datasetId);
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase().slice(0, 64) : '';
    const tierParam = typeof req.query.tier === 'string' ? req.query.tier : '';
    const tierFilter = VALID_TIERS.includes(tierParam as PriceTier) ? (tierParam as PriceTier) : null;
    const pageRaw = Number(req.query.page ?? 1);
    const limitRaw = Number(req.query.limit ?? 15);
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw >= 1 && limitRaw <= 50 ? Math.floor(limitRaw) : 15;

    let filtered = assets.records;
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.locality.toLowerCase().includes(search) ||
          r.propertyType.toLowerCase().includes(search) ||
          r.title.toLowerCase().includes(search) ||
          r.dataset.toLowerCase().includes(search)
      );
    }
    if (tierFilter) {
      filtered = filtered.filter((r) => r.priceTier === tierFilter);
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;

    res.json({
      datasetId,
      currencySymbol: assets.currencySymbol,
      currencyUnit: assets.currencyUnit,
      total,
      page: safePage,
      totalPages,
      records: filtered.slice(offset, offset + limit),
    });
  });

  app.post('/api/train', (req, res) => {
    const body = req.body ?? {};
    const datasetId = parseDatasetId(body.datasetId) ?? 'hyderabad';
    const backbone = parseBackbone(body.backbone) ?? 'graphsage';
    const forceRetrain = Boolean(body.forceRetrain);

    const hp = body.hyperparams ?? {};
    const customParams = {
      trees: isFiniteInRange(hp.trees, 20, 90) ? hp.trees : undefined,
      learningRate: isFiniteInRange(hp.learningRate, 0.03, 0.3) ? hp.learningRate : undefined,
      maxDepth: isFiniteInRange(hp.maxDepth, 2, 5) ? hp.maxDepth : undefined,
      sigmaKm: isFiniteInRange(hp.sigmaKm, 0.8, 25) ? hp.sigmaKm : undefined,
    };

    try {
      const pipeline = trainOrGetPipeline(datasetId, backbone, customParams, forceRetrain);
      res.json(pipeline.benchmark);
    } catch {
      res.status(500).json({ error: 'Model training pipeline failed.' });
    }
  });

  app.get('/api/benchmarks', async (req, res) => {
    const backbone = parseBackbone(req.query.backbone) ?? 'graphsage';
    try {
      const results = [];
      for (const ds of VALID_DATASETS) {
        results.push(trainOrGetPipeline(ds, backbone).benchmark);
        await new Promise((resolve) => setImmediate(resolve));
      }
      res.json({ backbone, results });
    } catch {
      res.status(500).json({ error: 'Unable to compute cross-dataset benchmarks.' });
    }
  });

  app.post('/api/predict', (req, res) => {
    const body = req.body ?? {};
    const datasetId = parseDatasetId(body.datasetId);
    const backbone = parseBackbone(body.backbone);
    if (!datasetId || !backbone) {
      res.status(400).json({ error: 'Invalid datasetId or GNN backbone.' });
      return;
    }

    const locality =
      typeof body.locality === 'string' && body.locality.trim().length > 0 && body.locality.length <= 80
        ? body.locality.trim()
        : null;
    if (!locality) {
      res.status(400).json({ error: 'Valid locality name is required.' });
      return;
    }

    if (
      !isFiniteInRange(body.lat, -90, 90) ||
      !isFiniteInRange(body.lng, -180, 180) ||
      !isFiniteInRange(body.areaSqFt, 250, 25000) ||
      !isFiniteInRange(body.bedrooms, 1, 12) ||
      !isFiniteInRange(body.bathrooms, 1, 12) ||
      !isFiniteInRange(body.qualityScore, 1, 10) ||
      !isFiniteInRange(body.ageYears, 0, 120)
    ) {
      res.status(400).json({ error: 'Numeric property attributes are out of valid bounds.' });
      return;
    }

    const propertyType = VALID_PROPERTY_TYPES.includes(body.propertyType)
      ? (body.propertyType as PropertyType)
      : null;
    const buildingStatus = VALID_BUILDING_STATUSES.includes(body.buildingStatus)
      ? (body.buildingStatus as BuildingStatus)
      : null;

    if (!propertyType || !buildingStatus) {
      res.status(400).json({ error: 'Invalid propertyType or buildingStatus.' });
      return;
    }

    const floorsCount =
      body.floorsCount === undefined
        ? 1
        : isFiniteInRange(body.floorsCount, 1, 6)
        ? Math.round(body.floorsCount)
        : null;

    if (floorsCount === null) {
      res.status(400).json({ error: 'floorsCount must be between 1 and 6.' });
      return;
    }

    const valuationReq: ValuationRequest = {
      datasetId,
      backbone,
      locality,
      lat: body.lat,
      lng: body.lng,
      areaSqFt: body.areaSqFt,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      qualityScore: body.qualityScore,
      ageYears: body.ageYears,
      propertyType,
      floorsCount,
      buildingStatus,
    };

    try {
      const result = runPropertyValuation(valuationReq);
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Valuation inference failed.' });
    }
  });

  app.get('/api/graph', (req, res) => {
    const datasetId = parseDatasetId(req.query.datasetId) ?? 'hyderabad';
    const backbone = parseBackbone(req.query.backbone) ?? 'graphsage';

    const latNum = Number(req.query.lat);
    const lngNum = Number(req.query.lng);
    const areaNum = Number(req.query.areaSqFt);
    const bedsNum = Number(req.query.bedrooms);
    const bathsNum = Number(req.query.bathrooms);
    const qualNum = Number(req.query.qualityScore);
    const ageNum = Number(req.query.ageYears);
    const floorsNum = Number(req.query.floorsCount);
    const priceNum = Number(req.query.predictedPrice);
    const locality =
      typeof req.query.locality === 'string' && req.query.locality.trim().length > 0
        ? req.query.locality.trim().slice(0, 80)
        : undefined;
    const scope = req.query.scope === 'region' ? 'region' : 'local';

    const focus =
      isFiniteInRange(latNum, -90, 90) && isFiniteInRange(lngNum, -180, 180)
        ? {
            locality,
            lat: latNum,
            lng: lngNum,
            areaSqFt: isFiniteInRange(areaNum, 250, 25000) ? areaNum : undefined,
            bedrooms: isFiniteInRange(bedsNum, 1, 12) ? Math.round(bedsNum) : undefined,
            bathrooms: isFiniteInRange(bathsNum, 1, 12) ? Math.round(bathsNum) : undefined,
            qualityScore: isFiniteInRange(qualNum, 1, 10) ? Math.round(qualNum) : undefined,
            ageYears: isFiniteInRange(ageNum, 0, 120) ? Math.round(ageNum) : undefined,
            floorsCount: isFiniteInRange(floorsNum, 1, 6) ? Math.round(floorsNum) : undefined,
            propertyType: VALID_PROPERTY_TYPES.includes(req.query.propertyType as PropertyType)
              ? (req.query.propertyType as PropertyType)
              : undefined,
            buildingStatus: VALID_BUILDING_STATUSES.includes(
              req.query.buildingStatus as BuildingStatus
            )
              ? (req.query.buildingStatus as BuildingStatus)
              : undefined,
            predictedPrice: isFiniteInRange(priceNum, 1, 100000) ? priceNum : undefined,
            scope: scope as 'local' | 'region',
          }
        : undefined;

    try {
      const payload = getGraphExplorerData(datasetId, backbone, focus);
      res.json(payload);
    } catch {
      res.status(500).json({ error: 'Failed to construct geo-spatial graph.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`GeoValuate server listening on http://0.0.0.0:${port}`);
    // Warm default Hyderabad pipeline asynchronously after port is open
    setTimeout(() => {
      try {
        trainOrGetPipeline('hyderabad', 'graphsage');
      } catch {
        // Ignore background warmup errors; on-demand requests handle training cleanly
      }
    }, 50);
  });
}

startServer();
