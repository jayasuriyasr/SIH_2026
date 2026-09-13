import type { TargetRecord } from '../types';
import { RISK_COLORS, RISK_LABELS } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface TargetPanelProps {
  target: TargetRecord | null;
  onClose: () => void;
  onVerify: (detectionId: string) => void;
  onViewSonar?: (target: TargetRecord) => void;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5 font-medium">
        <span className="text-gray-400 tracking-wide">{label}</span>
        <span className="font-mono" style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden bg-black/30 shadow-inner border border-white/5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  );
}

export default function TargetPanel({ target, onClose, onVerify, onViewSonar }: TargetPanelProps) {
  if (!target) return null;

  const { detection, anomaly, acoustic_features, risk_assessment } = target;
  const riskLevel = risk_assessment?.risk_level || 'LOW';
  const riskColor = RISK_COLORS[riskLevel];

  const scoreData = [
    { name: 'Confidence', value: Math.round(detection.confidence * 100), color: '#60a5fa' },
    { name: 'Anomaly', value: Math.round((anomaly?.anomaly_score || 0) * 100), color: '#f59e0b' },
    { name: 'Evidence', value: Math.round((risk_assessment?.evidence_score || 0) * 100), color: '#8b5cf6' },
    { name: 'Risk', value: Math.round((risk_assessment?.risk_score || 0) * 100), color: riskColor },
  ];

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-heading text-glow">{detection.target_id}</h2>
            <p className="text-xs text-cyan-400 uppercase tracking-wider font-semibold mt-0.5">
              {detection.object_class.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none p-1 cursor-pointer transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm"
            style={{
              backgroundColor: `${riskColor}20`,
              color: riskColor,
              border: `1px solid ${riskColor}50`,
              boxShadow: `0 0 10px ${riskColor}30`
            }}
          >
            {RISK_LABELS[riskLevel]} (Priority #{risk_assessment?.priority || 1})
          </span>
        </div>
      </div>

      {/* Target Sonar Crop Preview */}
      <div className="p-5 border-b border-white/10">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Acoustic Crop Signature
        </h3>
        <div
          onClick={() => onViewSonar && onViewSonar(target)}
          className="relative rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400 cursor-pointer group bg-black/60 aspect-video flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all duration-300"
        >
          <img
            src={`/api/detections/${detection.detection_id}/crop`}
            alt={`Sonar crop for ${detection.target_id}`}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-xs text-cyan-300 font-semibold tracking-wide">Click to inspect full waterfall sonar</span>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="p-5 border-b border-white/10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Multi-Source Acoustic Scoring
        </h3>
        <ScoreBar label="YOLO Detection Confidence" value={detection.confidence} color="#60a5fa" />
        <ScoreBar
          label="Open-Set Anomaly Score (PatchCore)"
          value={anomaly?.anomaly_score || 0}
          color="#f59e0b"
        />
        <ScoreBar
          label="Acoustic Evidence Fusion"
          value={risk_assessment?.evidence_score || 0}
          color="#8b5cf6"
        />
        <ScoreBar
          label="Composite Risk Score"
          value={risk_assessment?.risk_score || 0}
          color={riskColor}
        />
      </div>

      {/* Acoustic Features */}
      {acoustic_features && (
        <div className="p-5 border-b border-white/10">
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Acoustic Feature Extraction
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5 shadow-inner">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Target Intensity</div>
              <div className="font-mono text-cyan-100 font-semibold">
                {acoustic_features.target_intensity.toFixed(1)} <span className="text-gray-600">/ 255</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5 shadow-inner">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Target Area</div>
              <div className="font-mono text-cyan-100 font-semibold">
                {acoustic_features.target_area.toFixed(0)} <span className="text-gray-600">px²</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5 shadow-inner">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Shadow Length</div>
              <div className="font-mono text-cyan-100 font-semibold">
                {acoustic_features.shadow_length.toFixed(1)} <span className="text-gray-600">px</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5 shadow-inner">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Shadow Area</div>
              <div className="font-mono text-cyan-100 font-semibold">
                {acoustic_features.shadow_area.toFixed(0)} <span className="text-gray-600">px²</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5 shadow-inner">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Target/Shadow</div>
              <div className="font-mono text-cyan-100 font-semibold">
                {acoustic_features.target_shadow_ratio.toFixed(2)}
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 border border-white/5 shadow-inner">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Seabed Texture</div>
              <div className="font-mono text-cyan-100 font-semibold">
                {acoustic_features.seabed_texture.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Chart */}
      <div className="p-5 border-b border-white/10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Evidence Distribution
        </h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={scoreData} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              width={80}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              {scoreData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Location */}
      <div className="p-5 border-b border-white/10">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Geo-Localization & Bathymetry
        </h3>
        <div className="text-sm space-y-2">
          <div className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-gray-400 text-xs">Latitude</span>
            <span className="font-mono text-cyan-100">
              {detection.latitude ? `${detection.latitude.toFixed(6)}° N` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-gray-400 text-xs">Longitude</span>
            <span className="font-mono text-cyan-100">
              {detection.longitude ? `${detection.longitude.toFixed(6)}° E` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-gray-400 text-xs">Seabed Depth</span>
            <span className="font-mono text-cyan-100">
              {detection.depth != null ? `${detection.depth.toFixed(1)} meters` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 mt-auto bg-black/20">
        <div className="flex gap-3">
          <button
            onClick={() => onViewSonar && onViewSonar(target)}
            className="flex-1 px-4 py-3 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:-translate-y-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]"
          >
            Full Sonar View
          </button>
          <button
            onClick={() => onVerify(detection.detection_id)}
            className="flex-1 px-4 py-3 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:-translate-y-0.5 bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
          >
            Verify Target
          </button>
        </div>
      </div>
    </div>
  );
}
