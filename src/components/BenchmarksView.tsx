import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type {
  DatasetId,
  GnnBackbone,
  PriceTier,
  TrainingBenchmarkResult,
} from '../types.ts';
import { fetchJsonWithRetry } from '../utils/api.ts';

interface BenchmarksViewProps {
  datasetId: DatasetId;
  backbone: GnnBackbone;
  retrainSignal: number;
}

const DATASET_LABELS: Record<DatasetId, string> = {
  hyderabad: 'Hyderabad Urban GIS',
  ames: 'Ames Housing',
  california: 'California Housing',
  multi: 'Multi-Dataset Joint',
};

export const BenchmarksView: React.FC<BenchmarksViewProps> = ({
  datasetId,
  backbone,
  retrainSignal,
}) => {
  const [benchmark, setBenchmark] = useState<TrainingBenchmarkResult | null>(null);
  const [crossBenchmarks, setCrossBenchmarks] = useState<TrainingBenchmarkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trees, setTrees] = useState(64);
  const [learningRate, setLearningRate] = useState(0.14);
  const [maxDepth, setMaxDepth] = useState(5);
  const [sigmaKm, setSigmaKm] = useState(3.6);

  useEffect(() => {
    setSigmaKm(
      datasetId === 'california'
        ? 14
        : datasetId === 'ames'
        ? 2.8
        : datasetId === 'multi'
        ? 4.5
        : 3.6
    );
  }, [datasetId]);

  async function runTraining(forceRetrain: boolean) {
    setLoading(true);
    setError(null);
    try {
      const [trainData, crossData] = await Promise.all([
        fetchJsonWithRetry<TrainingBenchmarkResult>('/api/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datasetId,
            backbone,
            forceRetrain,
            hyperparams: { trees, learningRate, maxDepth, sigmaKm },
          }),
        }),
        fetchJsonWithRetry<{ results: TrainingBenchmarkResult[] }>(
          `/api/benchmarks?backbone=${encodeURIComponent(backbone)}`
        ),
      ]);

      setBenchmark(trainData);
      setCrossBenchmarks(crossData.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to execute training.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runTraining(retrainSignal > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, backbone, retrainSignal]);

  const scatterMax = benchmark
    ? Math.max(
        10,
        ...benchmark.scatterPoints.flatMap((p) => [p.actual, p.predictedHybrid, p.predictedGbdt])
      ) * 1.05
    : 100;

  const hybridModel = benchmark?.models.find((m) => m.modelKey === 'hybrid');
  const gbdtModel = benchmark?.models.find((m) => m.modelKey === 'gbdt');

  return (
    <div className="space-y-6">
      {/* Hyperparameter Training Console */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Training Pipeline & Hyperparameter Tuning
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              80/20 held-out split · Strict training-only peer graph construction (zero test leakage) ·{' '}
              {backbone === 'graphsage' ? 'GraphSAGE' : 'ChebNet'} + GBDT
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                GBDT Trees
              </label>
              <input
                type="number"
                min={20}
                max={90}
                step={4}
                value={trees}
                onChange={(e) => setTrees(Number(e.target.value))}
                className="w-full h-9 px-2.5 text-xs font-mono tabular-nums border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Learning Rate (η)
              </label>
              <input
                type="number"
                min={0.03}
                max={0.3}
                step={0.01}
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                className="w-full h-9 px-2.5 text-xs font-mono tabular-nums border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Max Depth
              </label>
              <input
                type="number"
                min={2}
                max={5}
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-full h-9 px-2.5 text-xs font-mono tabular-nums border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Radius σ (km)
              </label>
              <input
                type="number"
                min={0.8}
                max={25}
                step={0.4}
                value={sigmaKm}
                onChange={(e) => setSigmaKm(Number(e.target.value))}
                className="w-full h-9 px-2.5 text-xs font-mono tabular-nums border border-slate-300 rounded-md"
              />
            </div>
            <button
              type="button"
              onClick={() => void runTraining(true)}
              disabled={loading}
              className="h-9 px-4 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Training...' : 'Retrain All'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-800">
          {error}
        </div>
      )}

      {benchmark && (
        <>
          {/* Headline KPI Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs text-slate-500">Hybrid Model R² Score</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {hybridModel?.r2.toFixed(4)}
              </div>
              <div className="text-xs text-emerald-700 mt-1 tabular-nums">
                +
                {(((hybridModel?.r2 ?? 0) - (gbdtModel?.r2 ?? 0)) * 100).toFixed(2)}% vs Tabular GBDT
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs text-slate-500">Hybrid Test RMSE ({benchmark.currencyUnit})</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {hybridModel?.rmse.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1 tabular-nums">
                GBDT Baseline: {gbdtModel?.rmse.toFixed(2)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs text-slate-500">Mean Absolute % Error (MAPE)</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {hybridModel?.mape.toFixed(2)}%
              </div>
              <div className="text-xs text-slate-500 mt-1 tabular-nums">
                MAE: {hybridModel?.mae.toFixed(2)} {benchmark.currencyUnit}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs text-slate-500">XAI Spatial Cluster Stability</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                {(benchmark.clusterStabilityMean * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1 tabular-nums">
                {benchmark.trainSamples} train · {benchmark.testSamples} test nodes
              </div>
            </div>
          </div>

          {/* Model Comparison Table */}
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Baseline vs Proposed Hybrid Evaluation ({DATASET_LABELS[datasetId]})
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluated on held-out test set using identical train/test partitions
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-left">
                    <th className="py-2.5 font-medium">Model Architecture</th>
                    <th className="py-2.5 font-medium text-right">RMSE ({benchmark.currencyUnit})</th>
                    <th className="py-2.5 font-medium text-right">MAE ({benchmark.currencyUnit})</th>
                    <th className="py-2.5 font-medium text-right">MAPE (%)</th>
                    <th className="py-2.5 font-medium text-right">R²</th>
                    <th className="py-2.5 font-medium text-right">Fit Time (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {benchmark.models.map((m) => {
                    const isHybrid = m.modelKey === 'hybrid';
                    return (
                      <tr
                        key={m.modelKey}
                        className={isHybrid ? 'bg-blue-50/50 font-medium' : 'hover:bg-slate-50'}
                      >
                        <td className="py-3 pr-4 text-slate-900">{m.modelName}</td>
                        <td className="py-3 text-right font-mono tabular-nums text-slate-900">
                          {m.rmse.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums text-slate-800">
                          {m.mae.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums text-slate-800">
                          {m.mape.toFixed(2)}%
                        </td>
                        <td
                          className={`py-3 text-right font-mono tabular-nums ${
                            isHybrid ? 'text-blue-700 font-semibold' : 'text-slate-900'
                          }`}
                        >
                          {m.r2.toFixed(4)}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums text-slate-500">
                          {m.trainTimeMs}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scatter Plot + Global XAI Feature Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Predicted vs Actual Property Values (Held-out Test Split)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Closer alignment to the y = x reference line indicates lower residual error
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block" />
                    Hybrid GNN+GBDT
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                    Tabular GBDT
                  </span>
                </div>
              </div>

              <svg viewBox="0 0 480 320" className="w-full h-auto">
                {/* Axes */}
                <line x1={48} y1={276} x2={456} y2={276} stroke="#CBD5E1" strokeWidth={1} />
                <line x1={48} y1={20} x2={48} y2={276} stroke="#CBD5E1" strokeWidth={1} />
                {/* Ideal diagonal y = x */}
                <line
                  x1={48}
                  y1={276}
                  x2={456}
                  y2={20}
                  stroke="#0F172A"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                />
                {benchmark.scatterPoints.map((pt) => {
                  const x = 48 + (pt.actual / scatterMax) * 408;
                  const yHybrid = 276 - (pt.predictedHybrid / scatterMax) * 256;
                  const yGbdt = 276 - (pt.predictedGbdt / scatterMax) * 256;
                  return (
                    <g key={pt.id}>
                      <circle cx={x} cy={yGbdt} r={2.8} fill="#94A3B8" opacity={0.55} />
                      <circle cx={x} cy={yHybrid} r={3.5} fill="#1D4ED8" opacity={0.85} />
                    </g>
                  );
                })}
                <text x={252} y={306} textAnchor="middle" className="text-[11px] fill-slate-500">
                  Actual Value ({benchmark.currencyUnit})
                </text>
                <text
                  x={16}
                  y={148}
                  textAnchor="middle"
                  transform="rotate(-90 16 148)"
                  className="text-[11px] fill-slate-500"
                >
                  Predicted Value ({benchmark.currencyUnit})
                </text>
              </svg>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Global XAI Feature & Spatial Attribution
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Normalized split gain share across hybrid tree ensemble
                </p>

                <div className="space-y-3">
                  {benchmark.globalXaiImportance.map((item) => (
                    <div key={item.feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 font-medium">
                          {item.feature}{' '}
                          <span className="text-slate-400 font-normal">· {item.group}</span>
                        </span>
                        <span className="font-mono tabular-nums text-slate-700">
                          {item.importancePct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                        <div
                          className={`h-full rounded-sm ${
                            item.group === 'Spatial' ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(3, item.importancePct * 2.2))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Price Tier Performance Breakdown */}
          {hybridModel && (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Performance Across Property Price Tiers
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Stratified accuracy across Budget, Mid-Market, and Premium segments
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-left">
                      <th className="py-2 font-medium">Price Tier</th>
                      <th className="py-2 font-medium text-right">Test Samples</th>
                      <th className="py-2 font-medium text-right">Hybrid RMSE</th>
                      <th className="py-2 font-medium text-right">Hybrid MAPE</th>
                      <th className="py-2 font-medium text-right">Hybrid R²</th>
                      <th className="py-2 font-medium text-right">GBDT Baseline MAPE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(['Budget', 'Mid-Market', 'Premium'] as PriceTier[]).map((tier) => {
                      const hTier = hybridModel.tierMetrics[tier];
                      const gTier = gbdtModel?.tierMetrics[tier];
                      return (
                        <tr key={tier} className="hover:bg-slate-50">
                          <td className="py-2.5 font-medium text-slate-900">{tier}</td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                            {hTier?.count ?? 0}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                            {hTier?.rmse.toFixed(2) ?? '—'}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-emerald-700 font-medium">
                            {hTier?.mape.toFixed(2) ?? '—'}%
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-blue-700 font-medium">
                            {hTier?.r2.toFixed(4) ?? '—'}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-500">
                            {gTier?.mape.toFixed(2) ?? '—'}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Cross-Dataset Multi-Region Benchmark Matrix */}
          {crossBenchmarks.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Multi-Dataset Generalization Summary
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Live comparison across Hyderabad GIS, Ames Housing, California Housing, and Joint Multi-Dataset training
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-left">
                      <th className="py-2 font-medium">Dataset Corpus</th>
                      <th className="py-2 font-medium text-right">Train / Test</th>
                      <th className="py-2 font-medium text-right">GBDT R²</th>
                      <th className="py-2 font-medium text-right">GNN R²</th>
                      <th className="py-2 font-medium text-right">Hybrid R²</th>
                      <th className="py-2 font-medium text-right">Hybrid MAPE</th>
                      <th className="py-2 font-medium text-right">XAI Stability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {crossBenchmarks.map((cb) => {
                      const g = cb.models.find((m) => m.modelKey === 'gbdt');
                      const n = cb.models.find((m) => m.modelKey === 'gnn');
                      const h = cb.models.find((m) => m.modelKey === 'hybrid');
                      return (
                        <tr
                          key={cb.datasetId}
                          className={
                            cb.datasetId === datasetId ? 'bg-slate-50 font-medium' : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-2.5 text-slate-900">
                            {DATASET_LABELS[cb.datasetId]}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-600">
                            {cb.trainSamples} / {cb.testSamples}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                            {g?.r2.toFixed(4)}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                            {n?.r2.toFixed(4)}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-blue-700 font-semibold">
                            {h?.r2.toFixed(4)}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-emerald-700">
                            {h?.mape.toFixed(2)}%
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-800">
                            {(cb.clusterStabilityMean * 100).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
