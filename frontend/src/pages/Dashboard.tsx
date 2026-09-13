import { useState, useEffect, useCallback } from 'react';
import MapView from '../components/MapView';
import TargetPanel from '../components/TargetPanel';
import PriorityQueue from '../components/PriorityQueue';
import VerifyDialog from '../components/VerifyDialog';
import SonarOverlay from '../components/SonarOverlay';
import { targetApi, detectionApi, statsApi, surveyApi } from '../api/client';
import type {
  GeoJSONCollection,
  GeoJSONFeature,
  TargetRecord,
  PriorityTarget,
  HeatmapPoint,
  DashboardStats,
} from '../types';
import { RISK_COLORS } from '../types';

export default function Dashboard() {
  const [geojson, setGeojson] = useState<GeoJSONCollection | null>(null);
  const [priorityTargets, setPriorityTargets] = useState<PriorityTarget[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TargetRecord | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verifyDetectionId, setVerifyDetectionId] = useState<string | null>(null);
  const [sonarDetection, setSonarDetection] = useState<TargetRecord | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPriority, setShowPriority] = useState(true);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [loading, setLoading] = useState(true);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [geo, priority, heat, s] = await Promise.all([
        targetApi.geojson().catch(() => null),
        targetApi.priority().catch(() => []),
        targetApi.heatmap().catch(() => []),
        statsApi.get().catch(() => null),
      ]);
      setGeojson(geo);
      setPriorityTargets(priority);
      setHeatmapPoints(heat);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFeatureClick = async (feature: GeoJSONFeature) => {
    const id = feature.properties.detection_id;
    setSelectedId(id);
    try {
      const record = await detectionApi.get(id);
      setSelectedTarget(record);
    } catch {
      console.error('Failed to load target', id);
    }
  };

  const handlePrioritySelect = async (detectionId: string) => {
    setSelectedId(detectionId);
    try {
      const record = await detectionApi.get(detectionId);
      setSelectedTarget(record);
    } catch {
      console.error('Failed to load target', detectionId);
    }
  };

  const handleVerify = async (
    detectionId: string,
    data: { expert_label: string; correction?: string; comments?: string }
  ) => {
    try {
      await detectionApi.verify(detectionId, data);
      await loadData();
    } catch {
      console.error('Failed to submit verification');
    }
  };

  const handleViewSonar = (record: TargetRecord) => {
    setSonarDetection(record);
  };

  const handleGenerateDemo = async () => {
    try {
      setIsGeneratingDemo(true);
      await surveyApi.generateDemo();
      await loadData();
    } catch (e) {
      console.error('Failed to generate demo surveys', e);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleExportMissionPlan = async () => {
    try {
      const plan = await targetApi.exportMissionPlan();
      const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AUV_Mission_Plan_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export plan failed', e);
    }
  };

  // Filter features and priority list
  const filteredGeojson: GeoJSONCollection | null = geojson
    ? {
        ...geojson,
        features: geojson.features.filter((f) =>
          riskFilter === 'ALL' ? true : f.properties.risk_level === riskFilter
        ),
      }
    : null;

  const filteredPriorityTargets = priorityTargets.filter((t) =>
    riskFilter === 'ALL' ? true : t.risk_level === riskFilter
  );

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Top Bar */}
      <header
        className="h-16 flex items-center justify-between px-6 pl-10 border-b border-white/10 flex-shrink-0 glass-panel z-30 relative"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-heading font-bold shadow-lg shadow-cyan-500/20 bg-gradient-to-br from-blue-600 to-cyan-500 text-white border border-white/10"
          >
            SA
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider font-heading flex items-center gap-2">
              <span>SONARIS AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                ACTIVE
              </span>
            </h1>
            <p className="text-[10.5px] text-gray-400">Side-Scan Sonar Marine Debris & Risk Prioritization Engine</p>
          </div>
        </div>

        {/* Stats Summary Bar */}
        {stats && (
          <div className="hidden md:flex items-center gap-6 text-xs glass-panel shadow-inner shadow-black/50 px-5 py-2 rounded-xl border border-white/5">
            <div className="text-center">
              <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Surveys</div>
              <div className="text-white font-bold text-base font-heading text-glow">{stats.total_surveys}</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Targets</div>
              <div className="text-white font-bold text-base font-heading text-glow">{stats.total_detections}</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div
              className="text-center cursor-pointer hover:-translate-y-0.5 transition-transform"
              onClick={() => setRiskFilter(riskFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            >
              <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">High Risk</div>
              <div className="font-bold text-base font-heading text-glow" style={{ color: RISK_COLORS.HIGH }}>
                {stats.high_risk_count}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div
              className="text-center cursor-pointer hover:-translate-y-0.5 transition-transform"
              onClick={() => setRiskFilter(riskFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
            >
              <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Medium</div>
              <div className="font-bold text-base font-heading text-glow" style={{ color: RISK_COLORS.MEDIUM }}>
                {stats.medium_risk_count}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div
              className="text-center cursor-pointer hover:-translate-y-0.5 transition-transform"
              onClick={() => setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW')}
            >
              <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Low</div>
              <div className="font-bold text-base font-heading text-glow" style={{ color: RISK_COLORS.LOW }}>
                {stats.low_risk_count}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Actions */}
        <div className="flex items-center gap-3">
          {/* Risk Filter Select */}
          <div className="flex items-center gap-1 glass-panel rounded-lg p-1 border border-white/5 text-xs shadow-inner shadow-black/20">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-300 cursor-pointer tracking-wider ${
                  riskFilter === lvl
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer border ${
              showHeatmap
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-glow'
                : 'glass-panel text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            Anomaly Heatmap
          </button>

          <button
            onClick={() => setShowPriority(!showPriority)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer border ${
              showPriority
                ? 'bg-blue-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.2)] text-glow'
                : 'glass-panel text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            Priority Queue
          </button>

          {/* Export Dropdown / Buttons */}
          <a
            href="/api/export/csv"
            download
            className="px-4 py-2 rounded-lg text-xs font-semibold glass-panel text-gray-300 hover:border-white/20 hover:text-white transition-all cursor-pointer shadow-lg"
          >
            Export CSV
          </a>

          <button
            onClick={handleExportMissionPlan}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all cursor-pointer border border-teal-400/30"
          >
            AUV Mission Plan
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            geojson={filteredGeojson}
            onFeatureClick={handleFeatureClick}
            selectedId={selectedId}
            heatmapPoints={heatmapPoints}
            showHeatmap={showHeatmap}
          />

          {/* Quick empty state prompt if no surveys */}
          {(!geojson || geojson.features.length === 0) && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30">
              <div className="glass-panel border-cyan-500/30 p-8 rounded-2xl max-w-lg text-center shadow-[0_0_40px_rgba(0,240,255,0.15)] animate-float">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-5 text-3xl border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  🌊
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-heading text-glow">No Active Sonar Surveys</h3>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                  Generate realistic side-scan sonar demo surveys (Arabian Sea, Palk Strait, Kochi Harbor) with full AI evidence fusion and risk prioritization.
                </p>
                <button
                  onClick={handleGenerateDemo}
                  disabled={isGeneratingDemo}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] cursor-pointer disabled:opacity-50 disabled:shadow-none font-heading tracking-wide"
                >
                  {isGeneratingDemo ? 'Simulating Acoustic Surveys...' : '⚡ Generate Demo SSS Surveys'}
                </button>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9999]">
              <div className="text-center glass-panel p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-blue-500/30">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
                <div className="text-sm text-cyan-100 font-semibold tracking-wide font-heading">Computing Evidence Fusion...</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar — Priority Queue */}
        {showPriority && (
          <div
            className="w-80 flex-shrink-0 border-l border-white/10 flex flex-col glass-panel z-10 relative"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Inspection Priority
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {filteredPriorityTargets.length} targets ranked by composite risk
                </p>
              </div>
              <button
                onClick={loadData}
                className="text-gray-400 hover:text-white text-xs p-1 cursor-pointer"
                title="Refresh targets"
              >
                ↻
              </button>
            </div>
            <PriorityQueue
              targets={filteredPriorityTargets}
              onSelect={handlePrioritySelect}
              selectedId={selectedId}
            />
          </div>
        )}

        {/* Left Sidebar — Target Detail */}
        {selectedTarget && (
          <div
            className="w-96 flex-shrink-0 border-l border-white/10 overflow-y-auto glass-panel z-20 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
          >
            <TargetPanel
              target={selectedTarget}
              onClose={() => {
                setSelectedTarget(null);
                setSelectedId(null);
              }}
              onVerify={(id) => setVerifyDetectionId(id)}
              onViewSonar={handleViewSonar}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <VerifyDialog
        detectionId={verifyDetectionId}
        onClose={() => setVerifyDetectionId(null)}
        onSubmit={handleVerify}
      />

      <SonarOverlay
        detection={sonarDetection?.detection || null}
        onClose={() => setSonarDetection(null)}
      />
    </div>
  );
}
