import React from 'react';
import { Compass, MapPin, SlidersHorizontal } from 'lucide-react';
import type {
  AreaUnit,
  BuildingStatus,
  DatasetId,
  DatasetSummary,
  GnnBackbone,
  PropertyType,
  ValuationRequest,
  ValuationResponse,
} from '../types.ts';
import {
  formatDeltaPrice,
  formatPropertyPrice,
  formatRatePerSqFt,
  formatShortPrice,
} from '../utils/format.ts';

interface ValuationViewProps {
  datasetId: DatasetId;
  backbone: GnnBackbone;
  datasetSummary: DatasetSummary | undefined;
  form: ValuationRequest;
  setForm: React.Dispatch<React.SetStateAction<ValuationRequest>>;
  areaUnit: AreaUnit;
  setAreaUnit: React.Dispatch<React.SetStateAction<AreaUnit>>;
  result: ValuationResponse | null;
  loading: boolean;
  error: string | null;
  onPredict: (payload: ValuationRequest) => Promise<void>;
  onInspectGraph: () => void;
}

const PROPERTY_TYPES: PropertyType[] = [
  'Apartment',
  'Villa',
  'Independent House',
  'Townhouse',
];

const BUILDING_STATUSES: BuildingStatus[] = [
  'Ready to Move',
  'Under Construction',
  'Resale',
];

const INDEPENDENT_FLOOR_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Ground Floor Only' },
  { value: 2, label: 'Ground + 1st Floor (G+1)' },
  { value: 3, label: 'Ground + 2nd Floor (G+2)' },
  { value: 4, label: 'Ground + 3rd Floor (G+3)' },
];

export const ValuationView: React.FC<ValuationViewProps> = ({
  datasetId,
  backbone,
  datasetSummary,
  form,
  setForm,
  areaUnit,
  setAreaUnit,
  result,
  loading,
  error,
  onPredict,
  onInspectGraph,
}) => {
  const localities = datasetSummary?.localities ?? [];

  function handleLocalityChange(locName: string) {
    const loc = localities.find((l) => l.name === locName);
    if (!loc) return;
    const updated: ValuationRequest = {
      ...form,
      datasetId,
      backbone,
      locality: loc.name,
      lat: loc.lat,
      lng: loc.lng,
    };
    setForm(updated);
    void onPredict(updated);
  }

  function handlePropertyTypeChange(nextType: PropertyType) {
    const nextFloors =
      nextType === 'Independent House'
        ? Math.max(1, form.floorsCount ?? 1)
        : nextType === 'Villa' || nextType === 'Townhouse'
        ? 2
        : 1;
    const updated: ValuationRequest = {
      ...form,
      datasetId,
      backbone,
      propertyType: nextType,
      floorsCount: nextFloors,
    };
    setForm(updated);
    void onPredict(updated);
  }

  function handleFloorsChange(nextFloors: number) {
    const updated: ValuationRequest = {
      ...form,
      datasetId,
      backbone,
      floorsCount: nextFloors,
    };
    setForm(updated);
    void onPredict(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void onPredict({ ...form, datasetId, backbone });
  }

  const maxAbsDelta = result
    ? Math.max(1, ...result.xaiContributions.map((c) => Math.abs(c.deltaValue)))
    : 1;

  const hybridDeltaVsGbdt =
    result && result.predictedGbdtBaseline > 0
      ? result.predictedHybrid - result.predictedGbdtBaseline
      : 0;

  return (
    <div className="space-y-6">
      {/* Main Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Property & Spatial Coordinate Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Property & Location Parameters
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tabular attributes paired with geographic coordinates for graph message passing
                </p>
              </div>
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Locality / Neighborhood
                </label>
                <select
                  value={form.locality}
                  onChange={(e) => handleLocalityChange(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                >
                  {localities.map((loc) => (
                    <option key={`${loc.dataset}-${loc.name}`} value={loc.name}>
                      {loc.name} ({loc.clusterTier})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.lat}
                    onChange={(e) =>
                      setForm({ ...form, lat: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.lng}
                    onChange={(e) =>
                      setForm({ ...form, lng: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="block text-xs font-medium text-slate-700">
                      Area ({areaUnit === 'sqft' ? 'sq.ft.' : 'sq.yds.'})
                    </label>
                    <div className="inline-flex items-center p-0.5 bg-slate-100 rounded border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setAreaUnit('sqft')}
                        className={`px-1.5 py-0.5 text-[11px] font-medium rounded-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          areaUnit === 'sqft'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        sq.ft.
                      </button>
                      <button
                        type="button"
                        onClick={() => setAreaUnit('sqyd')}
                        className={`px-1.5 py-0.5 text-[11px] font-medium rounded-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          areaUnit === 'sqyd'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        sq.yds.
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={areaUnit === 'sqft' ? 300 : 35}
                    max={areaUnit === 'sqft' ? 25000 : 2750}
                    step={areaUnit === 'sqft' ? 25 : 5}
                    value={
                      areaUnit === 'sqft'
                        ? form.areaSqFt
                        : Math.round(form.areaSqFt / 9)
                    }
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (!Number.isFinite(raw)) return;
                      const sqFtValue =
                        areaUnit === 'sqft' ? raw : Math.round(raw * 9);
                      setForm({ ...form, areaSqFt: sqFtValue });
                    }}
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                    {areaUnit === 'sqft'
                      ? `≈ ${Math.round(form.areaSqFt / 9).toLocaleString()} sq.yds.`
                      : `= ${form.areaSqFt.toLocaleString()} sq.ft.`}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Building Age (years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={form.ageYears}
                    onChange={(e) =>
                      setForm({ ...form, ageYears: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={form.bedrooms}
                    onChange={(e) =>
                      setForm({ ...form, bedrooms: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={form.bathrooms}
                    onChange={(e) =>
                      setForm({ ...form, bathrooms: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Quality (1–10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.qualityScore}
                    onChange={(e) =>
                      setForm({ ...form, qualityScore: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Property Type
                  </label>
                  <select
                    value={form.propertyType}
                    onChange={(e) =>
                      handlePropertyTypeChange(e.target.value as PropertyType)
                    }
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Building Status
                  </label>
                  <select
                    value={form.buildingStatus}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        buildingStatus: e.target.value as BuildingStatus,
                      })
                    }
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {BUILDING_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.propertyType === 'Independent House' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Independent House Floors
                  </label>
                  <select
                    value={form.floorsCount ?? 1}
                    onChange={(e) => handleFloorsChange(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {INDEPENDENT_FLOOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onInspectGraph}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Inspect Spatial Subgraph
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {loading ? 'Running GNN + GBDT...' : 'Predict & Explain'}
            </button>
          </div>
        </form>

        {/* Right: Valuation Output & XAI Attribution */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          {error ? (
            <div className="p-4 border border-red-200 bg-red-50 rounded-md text-sm text-red-800">
              {error}
            </div>
          ) : loading && !result ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-slate-100 rounded w-1/2" />
              <div className="h-24 bg-slate-100 rounded" />
              <div className="h-56 bg-slate-100 rounded" />
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Primary Valuation Header */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    Estimated Property Valuation
                  </div>
                  <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {formatPropertyPrice(datasetId, result.predictedHybrid)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-2 tabular-nums">
                    <span>
                      90% Range: {formatShortPrice(datasetId, result.confidenceLow)} –{' '}
                      {formatShortPrice(datasetId, result.confidenceHigh)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatRatePerSqFt(datasetId, result.pricePerSqFt, areaUnit)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Tier: {result.priceTier}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-500">Local Cluster XAI Stability</div>
                  <div className="text-lg font-semibold font-mono tabular-nums text-emerald-700">
                    {(result.clusterStabilityScore * 100).toFixed(1)}% Cosine Match
                  </div>
                  <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                    vs Tabular GBDT: {formatDeltaPrice(datasetId, hybridDeltaVsGbdt)}
                  </div>
                </div>
              </div>

              {/* Baseline Model Comparison Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-slate-500">Proposed Hybrid (GNN + GBDT)</div>
                  <div className="text-lg font-semibold font-mono tabular-nums text-blue-700 mt-0.5">
                    {formatShortPrice(datasetId, result.predictedHybrid)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Standalone GBDT Baseline</div>
                  <div className="text-lg font-semibold font-mono tabular-nums text-slate-800 mt-0.5">
                    {formatShortPrice(datasetId, result.predictedGbdtBaseline)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Standalone GNN Baseline</div>
                  <div className="text-lg font-semibold font-mono tabular-nums text-slate-800 mt-0.5">
                    {formatShortPrice(datasetId, result.predictedGnnBaseline)}
                  </div>
                </div>
              </div>

              {/* XAI Waterfall Feature + Spatial Attribution */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Explainable AI (XAI) Local Value Attribution
                    </h3>
                    <p className="text-xs text-slate-500">
                      Exact tree-path & spatial edge decomposition from base expectation ({formatShortPrice(datasetId, result.baseExpectedValue)})
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-600 inline-block rounded-xs" />
                      Property Factor
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-600 inline-block rounded-xs" />
                      Spatial Graph Factor
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {result.xaiContributions.map((item) => {
                    const widthPct = Math.min(
                      100,
                      Math.max(4, (Math.abs(item.deltaValue) / maxAbsDelta) * 100)
                    );
                    const isPositive = item.deltaValue >= 0;
                    const barColor = !isPositive
                      ? 'bg-rose-600'
                      : item.category === 'Spatial'
                      ? 'bg-emerald-600'
                      : 'bg-blue-600';

                    return (
                      <div key={item.factor} className="grid grid-cols-12 items-center gap-3 text-xs">
                        <div className="col-span-5 sm:col-span-4 truncate">
                          <div className="font-medium text-slate-800 truncate">
                            {item.factor}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {item.category} · {item.description}
                          </div>
                        </div>
                        <div className="col-span-5 sm:col-span-6">
                          <div className="h-2.5 bg-slate-100 rounded-sm overflow-hidden flex items-center">
                            <div
                              className={`h-full ${barColor} rounded-sm transition-transform duration-200`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                        <div
                          className={`col-span-2 text-right font-mono tabular-nums font-medium ${
                            isPositive ? 'text-slate-900' : 'text-rose-700'
                          }`}
                        >
                          {formatDeltaPrice(datasetId, item.deltaValue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spatial Context Signals */}
              <div className="border-t border-slate-200 pt-4">
                <div className="text-xs font-medium text-slate-700 mb-2">
                  Spatial Context Signals
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs font-mono tabular-nums">
                  {[
                    'School',
                    'Transit',
                    'Commercial',
                    'Hospital',
                    'PeerVal',
                    'Spectral',
                  ].map((label, idx) => (
                    <div
                      key={label}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
                    >
                      <div className="text-[10px] text-slate-500 font-sans">{label}</div>
                      <div className="text-slate-900 font-medium">
                        {result.spatialEmbedding[idx]?.toFixed(3) ?? '0.000'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Connected Urban POI Nodes */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Connected Urban POI Nodes
              </h3>
              <p className="text-xs text-slate-500">
                Nearby schools, transit stations, commercial hubs, and hospitals influencing property value
              </p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-left">
                  <th className="py-2 font-medium">Point of Interest</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium text-right">Dist (km)</th>
                  <th className="py-2 font-medium text-right">Proximity Weight</th>
                  <th className="py-2 font-medium text-right">Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.nearbyPois.map((poi) => (
                  <tr key={poi.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-2 font-medium text-slate-800">{poi.name}</td>
                    <td className="py-2.5 pr-2 text-slate-500 capitalize">{poi.category}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                      {poi.distanceKm.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                      {poi.edgeWeight.toFixed(3)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {formatDeltaPrice(datasetId, poi.estimatedImpact)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
