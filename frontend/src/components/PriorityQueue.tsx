import type { PriorityTarget } from '../types';
import { RISK_COLORS } from '../types';

interface PriorityQueueProps {
  targets: PriorityTarget[];
  onSelect: (detectionId: string) => void;
  selectedId: string | null;
}

export default function PriorityQueue({ targets, onSelect, selectedId }: PriorityQueueProps) {
  if (targets.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No targets detected yet.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full pb-4">
      <div className="p-4 space-y-3">
        {targets.map((target) => {
          const riskColor = RISK_COLORS[target.risk_level];
          const isActive = target.detection_id === selectedId;

          return (
            <button
              key={target.detection_id}
              onClick={() => onSelect(target.detection_id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 group ${
                isActive
                  ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] scale-[1.02]'
                  : 'glass-panel hover:bg-white/5 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${riskColor}22`,
                    color: riskColor,
                    border: `1px solid ${riskColor}44`,
                  }}
                >
                  {target.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white font-heading tracking-wide truncate group-hover:text-cyan-300 transition-colors">
                      {target.target_id}
                    </span>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                      style={{
                        backgroundColor: `${riskColor}20`,
                        color: riskColor,
                        border: `1px solid ${riskColor}40`
                      }}
                    >
                      {target.risk_level}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {target.object_class}
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                    <span>
                      Conf: <span className="text-gray-300 font-mono">{(target.confidence * 100).toFixed(0)}%</span>
                    </span>
                    <span>
                      Evidence: <span className="text-gray-300 font-mono">{(target.evidence_score * 100).toFixed(0)}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
