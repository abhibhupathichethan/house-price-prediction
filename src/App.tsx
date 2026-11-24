import { useCallback, useEffect, useRef, useState } from 'react';
import { SpatialGraphView } from './components/SpatialGraphView.tsx';
import { ValuationView } from './components/ValuationView.tsx';
import type {
  AreaUnit,
  DatasetId,
  DatasetSummary,
  GnnBackbone,
  ValuationRequest,
  ValuationResponse,
} from './types.ts';
import { fetchJsonWithRetry } from './utils/api.ts';

type ActiveTab = 'valuation' | 'graph';

const NAV_ITEMS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'valuation', label: 'Valuation' },
  { id: 'graph', label: 'Spatial Graph' },
];

const DATASET_TABS: Array<{ id: DatasetId; label: string }> = [
  { id: 'hyderabad', label: 'Hyderabad GIS' },
  { id: 'ames', label: 'Ames Housing' },
  { id: 'california', label: 'California Housing' },
  { id: 'multi', label: 'Multi-Dataset Joint' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('valuation');
  const [datasetId, setDatasetId] = useState<DatasetId>('hyderabad');
  const backbone: GnnBackbone = 'graphsage';
  const [summaries, setSummaries] = useState<DatasetSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [areaUnit, setAreaUnit] = useState<AreaUnit>('sqft');
  const [valuationForm, setValuationForm] = useState<ValuationRequest>({
    datasetId: 'hyderabad',
    backbone: 'graphsage',
    locality: 'Nizampet',
    lat: 17.5165,
    lng: 78.3802,
    areaSqFt: 1805,
    bedrooms: 3,
    bathrooms: 3,
    qualityScore: 7,
    ageYears: 2,
    propertyType: 'Apartment',
    floorsCount: 1,
    buildingStatus: 'Ready to Move',
  });
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationError, setValuationError] = useState<string | null>(null);

  const initializedDatasetRef = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDatasets() {
      try {
        const json = await fetchJsonWithRetry<{ datasets: DatasetSummary[] }>(
          '/api/datasets',
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          setSummaries(json.datasets);
          setLoadError(null);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setLoadError(err instanceof Error ? err.message : 'Backend connection failed.');
        }
      }
    }
    void loadDatasets();
    return () => {
      controller.abort();
    };
  }, []);

  const executePrediction = useCallback(async (payload: ValuationRequest) => {
    setValuationLoading(true);
    setValuationError(null);
    try {
      const data = await fetchJsonWithRetry<ValuationResponse>('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setValuationResult(data);
    } catch (err) {
      setValuationError(
        err instanceof Error ? err.message : 'Unable to reach valuation engine.'
      );
    } finally {
      setValuationLoading(false);
    }
  }, []);

  const activeSummary = summaries.find((s) => s.id === datasetId);

  // Initialize form defaults ONLY when datasetId changes (never when switching tabs!)
  useEffect(() => {
    if (!activeSummary || activeSummary.localities.length === 0) return;
    if (initializedDatasetRef.current === activeSummary.id) return;
    initializedDatasetRef.current = activeSummary.id;

    const firstSample = activeSummary.sampleProperties[0];
    const defaultLoc =
      activeSummary.localities.find((l) => l.name === firstSample?.locality) ??
      activeSummary.localities[0];

    const nextForm: ValuationRequest = {
      datasetId,
      backbone,
      locality: defaultLoc.name,
      lat: firstSample?.lat ?? defaultLoc.lat,
      lng: firstSample?.lng ?? defaultLoc.lng,
      areaSqFt: firstSample?.areaSqFt ?? 1650,
      bedrooms: firstSample?.bedrooms ?? 3,
      bathrooms: firstSample?.bathrooms ?? 2,
      qualityScore: firstSample?.qualityScore ?? 7,
      ageYears: firstSample?.ageYears ?? 3,
      propertyType: firstSample?.propertyType ?? 'Apartment',
      floorsCount: firstSample?.floorsCount ?? 1,
      buildingStatus: firstSample?.buildingStatus ?? 'Ready to Move',
    };
    setValuationForm(nextForm);
    void executePrediction(nextForm);
  }, [activeSummary, datasetId, backbone, executePrediction]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#valuation"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('valuation');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            GeoValuate
          </a>

          <nav className="flex items-center gap-7 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-blue-700 text-slate-900'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Workspace Title & Dataset Selector */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight text-balance">
              Explainable Geo-Spatial GNN & Gradient Boosting Valuation
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md overflow-x-auto">
              {DATASET_TABS.map((ds) => {
                const active = datasetId === ds.id;
                return (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => setDatasetId(ds.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ds.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-800">
            {loadError}
          </div>
        )}

        {activeTab === 'valuation' && (
          <ValuationView
            datasetId={datasetId}
            backbone={backbone}
            datasetSummary={activeSummary}
            form={valuationForm}
            setForm={setValuationForm}
            areaUnit={areaUnit}
            setAreaUnit={setAreaUnit}
            result={valuationResult}
            loading={valuationLoading}
            error={valuationError}
            onPredict={executePrediction}
            onInspectGraph={() => setActiveTab('graph')}
          />
        )}

        {activeTab === 'graph' && (
          <SpatialGraphView
            datasetId={datasetId}
            backbone={backbone}
            activeValuation={{
              form: valuationForm,
              result: valuationResult,
              areaUnit,
            }}
          />
        )}
      </main>
    </div>
  );
}
