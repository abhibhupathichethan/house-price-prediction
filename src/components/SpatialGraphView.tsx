import React, { useEffect, useMemo, useState } from 'react';
import { Layers, LocateFixed } from 'lucide-react';
import type {
  AreaUnit,
  DatasetId,
  GnnBackbone,
  GraphExplorerPayload,
  PoiCategory,
  PoiNode,
  PropertyRecord,
  ValuationRequest,
  ValuationResponse,
} from '../types.ts';
import { fetchJsonWithRetry } from '../utils/api.ts';
import { formatAreaValue, formatShortPrice } from '../utils/format.ts';

interface SpatialGraphViewProps {
  datasetId: DatasetId;
  backbone: GnnBackbone;
  activeValuation: {
    form: ValuationRequest;
    result: ValuationResponse | null;
    areaUnit: AreaUnit;
  };
}

type SelectedNode =
  | { kind: 'property'; node: PropertyRecord & { embedding: number[]; clusterStability: number } }
  | { kind: 'poi'; node: PoiNode };

const POI_COLORS: Record<PoiCategory, string> = {
  commercial: '#1D4ED8',
  transit: '#059669',
  school: '#D97706',
  hospital: '#DC2626',
};

const TIER_COLORS: Record<string, string> = {
  Budget: '#64748B',
  'Mid-Market': '#0284C7',
  Premium: '#0F172A',
};

export const SpatialGraphView: React.FC<SpatialGraphViewProps> = ({
  datasetId,
  backbone,
  activeValuation,
}) => {
  const [graph, setGraph] = useState<GraphExplorerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPoiEdges, setShowPoiEdges] = useState(true);
  const [showPeerEdges, setShowPeerEdges] = useState(true);
  const [scope, setScope] = useState<'local' | 'region'>('local');
  const [selected, setSelected] = useState<SelectedNode | null>(null);

  const { form, result, areaUnit } = activeValuation;

  useEffect(() => {
    const controller = new AbortController();
    async function loadGraph() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          datasetId,
          backbone,
          scope,
          locality: form.locality,
          lat: String(form.lat),
          lng: String(form.lng),
          areaSqFt: String(form.areaSqFt),
          bedrooms: String(form.bedrooms),
          bathrooms: String(form.bathrooms),
          qualityScore: String(form.qualityScore),
          ageYears: String(form.ageYears),
          propertyType: form.propertyType,
          floorsCount: String(form.floorsCount ?? 1),
          buildingStatus: form.buildingStatus,
        });
        if (result && Number.isFinite(result.predictedHybrid)) {
          params.set('predictedPrice', String(result.predictedHybrid));
        }

        const data = await fetchJsonWithRetry<GraphExplorerPayload>(
          `/api/graph?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          setGraph(data);
          const activeProp =
            (data.activeNodeId &&
              data.properties.find((p) => p.id === data.activeNodeId)) ||
            data.properties[0];
          if (activeProp) {
            setSelected({ kind: 'property', node: activeProp });
          } else {
            setSelected(null);
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unable to load graph.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadGraph();
    return () => {
      controller.abort();
    };
  }, [
    datasetId,
    backbone,
    scope,
    form.locality,
    form.lat,
    form.lng,
    form.areaSqFt,
    form.bedrooms,
    form.bathrooms,
    form.qualityScore,
    form.ageYears,
    form.propertyType,
    form.floorsCount,
    form.buildingStatus,
    result?.predictedHybrid,
  ]);

  const width = 860;
  const height = 520;
  const pad = 44;

  const coordMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    if (!graph) return map;
    const { minLat, maxLat, minLng, maxLng } = graph.bounds;
    const latSpan = Math.max(0.01, maxLat - minLat);
    const lngSpan = Math.max(0.01, maxLng - minLng);

    const project = (lat: number, lng: number) => ({
      x: pad + ((lng - minLng) / lngSpan) * (width - 2 * pad),
      y: height - pad - ((lat - minLat) / latSpan) * (height - 2 * pad),
    });

    for (const p of graph.properties) {
      map.set(p.id, project(p.lat, p.lng));
    }
    for (const poi of graph.pois) {
      map.set(poi.id, project(poi.lat, poi.lng));
    }
    return map;
  }, [graph]);

  const selectedId = selected?.node.id ?? null;

  const connectedEdges = useMemo(() => {
    if (!graph || !selectedId) return [];
    return graph.edges.filter(
      (e) => e.source === selectedId || e.target === selectedId
    );
  }, [graph, selectedId]);

  if (loading && !graph) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 h-[560px] animate-pulse" />
    );
  }

  if (error || !graph) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700">
        {error ?? 'Spatial graph unavailable.'}
      </div>
    );
  }

  const regionTitle =
    graph.datasetId === 'hyderabad'
      ? 'Hyderabad GIS'
      : graph.datasetId === 'ames'
      ? 'Ames Housing'
      : 'California Regions';

  return (
    <div className="space-y-6">
      {/* Graph Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Geo-Spatial Knowledge Graph · {form.locality} ({regionTitle})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {graph.scope === 'local' ? 'Focused neighborhood subgraph' : 'Regional overview'} ·{' '}
            {graph.properties.length} property nodes · {graph.pois.length} urban POI nodes ·{' '}
            {graph.edges.length} edges
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setScope('local')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scope === 'local'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Local Neighborhood
            </button>
            <button
              type="button"
              onClick={() => setScope('region')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scope === 'region'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Region
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPoiEdges((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showPoiEdges
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            POI Proximity Edges
          </button>
          <button
            type="button"
            onClick={() => setShowPeerEdges((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showPeerEdges
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Peer Cluster Edges
          </button>
        </div>
      </div>

      {/* Main Split: Spatial Canvas + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="w-full overflow-hidden rounded border border-slate-100 bg-slate-50">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto block select-none"
              role="img"
              aria-label="Geo-Spatial Property and POI Knowledge Graph"
            >
              {/* Subtle Coordinate Grid */}
              {[0.2, 0.4, 0.6, 0.8].map((frac) => (
                <g key={frac}>
                  <line
                    x1={pad}
                    y1={pad + frac * (height - 2 * pad)}
                    x2={width - pad}
                    y2={pad + frac * (height - 2 * pad)}
                    stroke="#E2E8F0"
                    strokeDasharray="3 4"
                    strokeWidth={1}
                  />
                  <line
                    x1={pad + frac * (width - 2 * pad)}
                    y1={pad}
                    x2={pad + frac * (width - 2 * pad)}
                    y2={height - pad}
                    stroke="#E2E8F0"
                    strokeDasharray="3 4"
                    strokeWidth={1}
                  />
                </g>
              ))}

              {/* Graph Edges */}
              {graph.edges.map((edge, idx) => {
                if (edge.kind === 'poi' && !showPoiEdges) return null;
                if (edge.kind === 'peer' && !showPeerEdges) return null;
                const s = coordMap.get(edge.source);
                const t = coordMap.get(edge.target);
                if (!s || !t) return null;
                const isHighlighted =
                  selectedId !== null &&
                  (edge.source === selectedId || edge.target === selectedId);

                return (
                  <line
                    key={`${edge.source}-${edge.target}-${idx}`}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={
                      isHighlighted
                        ? edge.kind === 'poi'
                          ? '#1D4ED8'
                          : '#0F172A'
                        : edge.kind === 'poi'
                        ? '#94A3B8'
                        : '#CBD5E1'
                    }
                    strokeOpacity={isHighlighted ? 0.9 : selectedId ? 0.16 : 0.35}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={edge.kind === 'peer' ? '3 3' : undefined}
                  />
                );
              })}

              {/* Property Nodes */}
              {graph.properties.map((prop) => {
                const pos = coordMap.get(prop.id);
                if (!pos) return null;
                const isSelected = selectedId === prop.id;
                const isActiveTarget = prop.id === graph.activeNodeId;
                const isConnected = connectedEdges.some(
                  (e) => e.source === prop.id || e.target === prop.id
                );

                return (
                  <g
                    key={prop.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelected({ kind: 'property', node: prop })}
                    className="cursor-pointer"
                  >
                    {isActiveTarget && (
                      <circle
                        r={13}
                        fill="#1D4ED8"
                        fillOpacity={0.14}
                        stroke="#1D4ED8"
                        strokeWidth={1.75}
                      />
                    )}
                    {isSelected && !isActiveTarget && (
                      <circle
                        r={11}
                        fill="none"
                        stroke="#1D4ED8"
                        strokeWidth={2}
                      />
                    )}
                    <circle
                      r={isActiveTarget ? 7.5 : isSelected ? 6.5 : isConnected ? 5 : 4}
                      fill={
                        isActiveTarget
                          ? '#1D4ED8'
                          : TIER_COLORS[prop.priceTier] ?? '#0284C7'
                      }
                      stroke="#FFFFFF"
                      strokeWidth={isActiveTarget ? 2 : 1.5}
                      opacity={
                        isActiveTarget || !selectedId || isSelected || isConnected
                          ? 0.98
                          : 0.4
                      }
                    />
                    {isActiveTarget && (
                      <text
                        y={-17}
                        textAnchor="middle"
                        className="text-[11px] font-semibold fill-blue-800"
                      >
                        Valuated: {prop.locality}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Urban POI Nodes (Diamonds) */}
              {graph.pois.map((poi) => {
                const pos = coordMap.get(poi.id);
                if (!pos) return null;
                const isSelected = selectedId === poi.id;
                const isConnected = connectedEdges.some(
                  (e) => e.source === poi.id || e.target === poi.id
                );
                const color = POI_COLORS[poi.category];

                return (
                  <g
                    key={poi.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelected({ kind: 'poi', node: poi })}
                    className="cursor-pointer"
                  >
                    <rect
                      x={isSelected ? -7 : -5.5}
                      y={isSelected ? -7 : -5.5}
                      width={isSelected ? 14 : 11}
                      height={isSelected ? 14 : 11}
                      transform="rotate(45)"
                      fill={color}
                      stroke="#FFFFFF"
                      strokeWidth={1.75}
                    />
                    {(isSelected || isConnected) && (
                      <text
                        y={-12}
                        textAnchor="middle"
                        className="text-[10px] font-medium fill-slate-900"
                      >
                        {poi.name.length > 26 ? `${poi.name.slice(0, 24)}…` : poi.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Graph Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block" />
                Active Valuation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />
                Premium
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
                Mid-Market
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                Budget
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-700 rotate-45 inline-block" />
                Commercial
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-600 rotate-45 inline-block" />
                Transit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-600 rotate-45 inline-block" />
                School
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-600 rotate-45 inline-block" />
                Hospital
              </span>
            </div>
          </div>
        </div>

        {/* Right: Node Inspector */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    {selected.node.id === graph.activeNodeId
                      ? 'Active Valuated Property'
                      : selected.kind === 'property'
                      ? 'Peer Property Node'
                      : 'Urban POI Node'}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                    {selected.kind === 'property' ? selected.node.title : selected.node.name}
                  </h3>
                  <div className="text-xs font-mono tabular-nums text-slate-500 mt-1">
                    {selected.node.lat.toFixed(4)}° N, {selected.node.lng.toFixed(4)}° E
                  </div>
                </div>
                <LocateFixed className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
              </div>

              {selected.kind === 'property' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">
                        {selected.node.id === graph.activeNodeId ? 'Estimated Value' : 'Recorded Value'}
                      </div>
                      <div className="text-base font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                        {formatShortPrice(graph.datasetId, selected.node.priceNative)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Cluster Stability</div>
                      <div className="text-base font-semibold font-mono tabular-nums text-emerald-700 mt-0.5">
                        {(selected.node.clusterStability * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Area</div>
                      <div className="font-mono tabular-nums text-slate-800 mt-0.5">
                        {formatAreaValue(selected.node.areaSqFt, areaUnit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Type & Tier</div>
                      <div className="text-slate-800 mt-0.5">
                        {selected.node.propertyType} · {selected.node.priceTier}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="text-xs font-medium text-slate-700 mb-2">
                      Spatial Context Signals
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                      {['School', 'Transit', 'Comm.', 'Hospital', 'PeerVal', 'Spectral'].map(
                        (lbl, idx) => (
                          <div
                            key={lbl}
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-1"
                          >
                            <div className="text-[10px] text-slate-500 font-sans">{lbl}</div>
                            <div className="text-slate-900">
                              {selected.node.embedding[idx]?.toFixed(3)}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-slate-500">POI Category</div>
                      <div className="text-sm font-medium text-slate-900 capitalize mt-0.5">
                        {selected.node.category}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Prestige Weight</div>
                      <div className="text-sm font-mono tabular-nums font-medium text-slate-900 mt-0.5">
                        {selected.node.prestigeScore.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  1-Hop Incident Graph Edges ({connectedEdges.length})
                </div>
                <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {connectedEdges.slice(0, 8).map((edge, idx) => {
                    const otherId =
                      edge.source === selected.node.id ? edge.target : edge.source;
                    const otherPoi = graph.pois.find((p) => p.id === otherId);
                    const otherProp = graph.properties.find((p) => p.id === otherId);
                    const label = otherPoi?.name ?? otherProp?.title ?? otherId;
                    return (
                      <div
                        key={`${otherId}-${idx}`}
                        className="py-2 flex items-center justify-between gap-2"
                      >
                        <span className="text-slate-700 truncate">{label}</span>
                        <span className="font-mono tabular-nums text-slate-500 whitespace-nowrap shrink-0">
                          {edge.distanceKm.toFixed(2)} km · w={edge.weight.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Select any property circle or POI diamond on the spatial graph to inspect its 1-hop neighborhood edges.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
