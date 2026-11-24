import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type {
  DatasetId,
  DatasetSummary,
  PriceTier,
  PropertyRecord,
} from '../types.ts';
import { fetchJsonWithRetry } from '../utils/api.ts';
import { formatShortPrice } from '../utils/format.ts';

interface DatasetsViewProps {
  datasetId: DatasetId;
  summaries: DatasetSummary[];
  onSelectDataset: (id: DatasetId) => void;
}

interface PaginatedRecordsResponse {
  datasetId: DatasetId;
  currencySymbol: string;
  currencyUnit: string;
  total: number;
  page: number;
  totalPages: number;
  records: PropertyRecord[];
}

const TIER_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All Tiers', value: '' },
  { label: 'Budget', value: 'Budget' },
  { label: 'Mid-Market', value: 'Mid-Market' },
  { label: 'Premium', value: 'Premium' },
];

export const DatasetsView: React.FC<DatasetsViewProps> = ({
  datasetId,
  summaries,
  onSelectDataset,
}) => {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedRecordsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [datasetId, search, tier]);

  const handleRetry = useCallback(() => {
    setReloadTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '14',
        });
        if (search.trim()) params.set('search', search.trim());
        if (tier) params.set('tier', tier);
        const json = await fetchJsonWithRetry<PaginatedRecordsResponse>(
          `/api/datasets/${encodeURIComponent(datasetId)}/records?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          setData(json);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : 'Unable to load dataset records.'
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => {
      controller.abort();
    };
  }, [datasetId, page, search, tier, reloadTick]);

  return (
    <div className="space-y-6">
      {/* Multi-Dataset Corpus Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map((ds) => {
          const active = ds.id === datasetId;
          return (
            <button
              key={ds.id}
              type="button"
              onClick={() => onSelectDataset(ds.id)}
              className={`text-left p-5 rounded-lg border transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-semibold">{ds.name}</div>
              <div
                className={`text-xs mt-1 ${
                  active ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {ds.regionLabel}
              </div>
              <div
                className={`mt-4 pt-3 border-t text-xs font-mono tabular-nums flex items-center justify-between ${
                  active ? 'border-slate-700 text-slate-200' : 'border-slate-100 text-slate-700'
                }`}
              >
                <span>{ds.totalRows.toLocaleString()} corpus rows</span>
                <span>{ds.poiCount} POIs</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Dataset Metadata Strip */}
      {summaries
        .filter((s) => s.id === datasetId)
        .map((activeSum) => (
          <div
            key={activeSum.id}
            className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
          >
            <div>
              <div className="text-slate-500 font-medium">Primary Tabular Source</div>
              <div className="text-slate-900 mt-1">{activeSum.sourceCitation}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Geo-Spatial POI Enrichment</div>
              <div className="text-slate-900 mt-1">{activeSum.spatialEnrichment}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Graph Topology Coverage</div>
              <div className="text-slate-900 mt-1 tabular-nums">
                {activeSum.sampledGraphNodes} property nodes · {activeSum.localityCount} localities ·{' '}
                {activeSum.poiCount} urban POI nodes
              </div>
            </div>
          </div>
        ))}

      {/* Search, Tier Filter & Data Table */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by locality or property type..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start md:self-auto">
            {TIER_FILTERS.map((tf) => (
              <button
                key={tf.label}
                type="button"
                onClick={() => setTier(tf.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tier === tf.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-md flex items-center justify-between gap-3 text-xs text-red-800">
            <span>{error}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="px-2.5 py-1 bg-white border border-red-300 rounded text-red-900 font-medium hover:bg-red-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-left">
                <th className="py-2.5 font-medium">Property ID</th>
                <th className="py-2.5 font-medium">Region</th>
                <th className="py-2.5 font-medium">Locality</th>
                <th className="py-2.5 font-medium">Type & Config</th>
                <th className="py-2.5 font-medium text-right">Area (sq.ft.)</th>
                <th className="py-2.5 font-medium text-right">Quality</th>
                <th className="py-2.5 font-medium text-right">Coordinates</th>
                <th className="py-2.5 font-medium">Tier</th>
                <th className="py-2.5 font-medium text-right">
                  Value ({data?.currencyUnit ?? 'Native'})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !data ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={9} className="py-3">
                      <div className="h-4 bg-slate-100 rounded" />
                    </td>
                  </tr>
                ))
              ) : data && data.records.length > 0 ? (
                data.records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-slate-500">{r.id}</td>
                    <td className="py-2.5 capitalize text-slate-700">{r.dataset}</td>
                    <td className="py-2.5 font-medium text-slate-900">{r.locality}</td>
                    <td className="py-2.5 text-slate-600">
                      {r.bedrooms} Bed {r.propertyType} · {r.buildingStatus}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-800">
                      {r.areaSqFt.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                      {r.qualityScore}/10
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-500">
                      {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
                    </td>
                    <td className="py-2.5 text-slate-700">{r.priceTier as PriceTier}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatShortPrice(
                        datasetId,
                        datasetId === 'multi' ? r.priceNormalizedUsdK : r.priceNative
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No matching records found. Try clearing your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 text-xs text-slate-600">
            <span className="tabular-nums">
              Showing page {data.page} of {data.totalPages} ({data.total.toLocaleString()} graph nodes)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="px-2.5 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
