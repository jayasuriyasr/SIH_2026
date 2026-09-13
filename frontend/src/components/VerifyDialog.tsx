import { useState } from 'react';
import { createPortal } from 'react-dom';

interface VerifyDialogProps {
  detectionId: string | null;
  onClose: () => void;
  onSubmit: (detectionId: string, data: {
    expert_label: string;
    correction?: string;
    comments?: string;
  }) => void;
}

const LABELS = [
  { value: 'correct', label: 'Correct', color: '#22c55e' },
  { value: 'incorrect', label: 'Incorrect', color: '#ef4444' },
  { value: 'natural_feature', label: 'Natural Feature', color: '#6b7280' },
  { value: 'marine_debris', label: 'Marine Debris', color: '#f59e0b' },
  { value: 'wreckage', label: 'Wreckage', color: '#8b5cf6' },
  { value: 'new_category', label: 'New Category', color: '#06b6d4' },
];

export default function VerifyDialog({ detectionId, onClose, onSubmit }: VerifyDialogProps) {
  const [selectedLabel, setSelectedLabel] = useState('');
  const [correction, setCorrection] = useState('');
  const [comments, setComments] = useState('');

  if (!detectionId) return null;

  const handleSubmit = () => {
    if (!selectedLabel) return;
    onSubmit(detectionId, {
      expert_label: selectedLabel,
      correction: correction || undefined,
      comments: comments || undefined,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md mx-4 overflow-hidden glass-panel border border-cyan-500/20"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-heading text-glow">Verify Detection</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
            >
              &times;
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ID: <span className="font-mono">{detectionId}</span>
          </p>
        </div>

        {/* Target Image Crop */}
        <div className="p-5 border-b border-white/10 bg-black/40 flex justify-center items-center h-48">
          <img 
            src={`/api/detections/${detectionId}/crop`} 
            alt={`Target ${detectionId}`}
            className="max-w-full max-h-full object-contain rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Label Selection */}
        <div className="p-5">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-3">
            Classification
          </label>
          <div className="grid grid-cols-2 gap-3">
            {LABELS.map((label) => (
              <button
                key={label.value}
                onClick={() => setSelectedLabel(label.value)}
                className={`p-3 rounded-xl text-sm font-semibold text-left transition-all duration-300 border ${
                  selectedLabel === label.value
                    ? 'border-opacity-100 shadow-md'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
                style={
                  selectedLabel === label.value
                    ? {
                        borderColor: label.color,
                        backgroundColor: `${label.color}15`,
                        color: label.color,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span>{label.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Correction (if incorrect/new) */}
        {(selectedLabel === 'incorrect' || selectedLabel === 'new_category') && (
          <div className="px-5 pb-3">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Correct Label
            </label>
            <input
              type="text"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="Enter correct classification..."
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none bg-black/30 shadow-inner focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
            />
          </div>
        )}

        {/* Comments */}
        <div className="px-5 pb-4">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none resize-none bg-black/30 shadow-inner focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
          />
        </div>

        {/* Footer */}
        <div className="p-5 flex gap-3 justify-end bg-black/20 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white glass-panel hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedLabel}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 ${
              selectedLabel
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer hover:-translate-y-0.5'
                : 'glass-panel opacity-50 cursor-not-allowed'
            }`}
          >
            Submit Verification
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
