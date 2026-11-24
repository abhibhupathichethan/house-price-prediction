import React from 'react';

const PIPELINE_STAGES = [
  {
    step: '01. Data Collection',
    process: 'Hyderabad listings (3,660 rows), Ames Housing, California Census + Urban GIS / POI layers',
    output: 'Unified raw property + spatial corpus',
  },
  {
    step: '02. Pre-processing',
    process: 'Unit normalization (INR Lakhs / USD $k), categorical encoding, coordinate alignment',
    output: 'Clean structural feature vectors',
  },
  {
    step: '03. Spatial Enrichment',
    process: 'Haversine proximity calculation to schools, metro/transit, hospitals, and IT/commercial hubs',
    output: 'Property–POI & peer distance matrix',
  },
  {
    step: '04. Graph Construction',
    process: 'Heterogeneous graph G = (V, E, W) with property + POI nodes and Gaussian kernel edges exp(-d/σ)',
    output: 'Weighted geo-spatial proximity graph',
  },
  {
    step: '05. GNN Learning',
    process: 'GraphSAGE neighborhood aggregation & ChebNet spectral filtering over 1-hop and 2-hop neighbors',
    output: '6-D spatial context embeddings',
  },
  {
    step: '06. Feature Fusion',
    process: 'Concatenate learned GNN spatial node embeddings with raw tabular property attributes',
    output: '15-D fused representation vector',
  },
  {
    step: '07. Gradient Boosting',
    process: 'L2-regularized Gradient Boosted Decision Trees trained on fused tabular + spatial vectors',
    output: 'High-accuracy property valuation',
  },
  {
    step: '08. XAI & Evaluation',
    process: 'Tree-path marginal attribution, RMSE/MAE/MAPE/R², and k-NN cluster attribution stability',
    output: 'Transparent explanation & validation',
  },
];

const TECH_STACK = [
  {
    layer: 'Frontend Interface',
    stack: 'React 19, TypeScript, Tailwind CSS v4, Interactive SVG Spatial Graph & Waterfall Charts',
  },
  {
    layer: 'Backend API Server',
    stack: 'Node.js v22 + Express REST API (/api/train, /api/predict, /api/benchmarks, /api/graph, /api/datasets)',
  },
  {
    layer: 'Geo-Spatial GNN Engine',
    stack: 'Custom TypeScript GraphSAGE (inductive mean/weighted aggregation) & ChebNet (spectral Laplacian propagation)',
  },
  {
    layer: 'Gradient Boosting & XAI',
    stack: 'Greedy L2-regularized GBDT regression ensemble + Exact Tree-Path Marginal Attribution (TreeSHAP-style) + Cosine Cluster Stability',
  },
];

const REFERENCES = [
  'Geerts, M., vanden Broucke, S., & De Weerdt, J. (2025). Graph neural networks for house price prediction: do or don’t? International Journal of Data Science and Analytics, 20(4), 3563–3593.',
  'Karamanou, A., et al. (2024). Explainable Graph Neural Networks: An Application to Open Statistics Knowledge Graphs for Estimating House Prices. Information, 12(8), 128.',
  'Riveros, J., et al. (2024). Scalable Property Valuation Models via Graph-based Deep Learning.',
  'Hyderabad House Price Dataset (3,660 listings across 359 location categories) & NIC Hyderabad GIS / MapServer Urban Layers.',
  'De Cock, D. (Ames Housing Dataset) & Pace, R. K. / Barry, R. (California Housing Spatial Corpus).',
];

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Architecture Summary */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Explainable Geo-Spatial GNN & Gradient Boosting Architecture
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Standalone Gradient Boosted Decision Trees excel on tabular feature interactions but lack explicit geographic topology, while standalone GNNs capture spatial proximity but underperform trees on heterogeneous property attributes. Fusing GNN spatial embeddings with raw tabular features inside an L2-regularized GBDT regressor—paired with exact tree-path XAI attribution—delivers both accuracy and appraisal transparency.
        </p>

        {/* System Flow Diagram */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.step}
              className="border border-slate-200 rounded-md p-4 bg-slate-50/70 flex flex-col justify-between"
            >
              <div>
                <div className="font-semibold text-slate-900">{stage.step}</div>
                <p className="text-slate-600 mt-1.5 leading-relaxed">{stage.process}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200 font-medium text-blue-700">
                {stage.output}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack & Datasets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Implemented Technology Stack
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {TECH_STACK.map((item) => (
              <div key={item.layer} className="py-3 first:pt-0 last:pb-0">
                <div className="font-medium text-slate-900">{item.layer}</div>
                <div className="text-slate-600 mt-1">{item.stack}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Dissertation Context & Literature References
          </h3>
          <ol className="space-y-2.5 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
            {REFERENCES.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};
