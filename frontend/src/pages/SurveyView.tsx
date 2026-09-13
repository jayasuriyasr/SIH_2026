import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '../api/client';
import type { Survey } from '../types';

interface SurveyViewProps {
  onProcess: (surveyId: string) => void;
}

export default function SurveyView({ onProcess }: SurveyViewProps) {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const data = await surveyApi.list();
      setSurveys(data);
    } catch {
      console.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (surveyId: string) => {
    try {
      setProcessing(surveyId);
      await surveyApi.process(surveyId);
      await loadSurveys();
      onProcess(surveyId);
      navigate('/');
    } catch {
      console.error('Failed to process survey');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (surveyId: string) => {
    if (!window.confirm('Are you sure you want to delete this survey and its detections?')) {
      return;
    }
    try {
      await surveyApi.delete(surveyId);
      await loadSurveys();
      onProcess(surveyId);
    } catch {
      console.error('Failed to delete survey');
    }
  };

  const handleGenerateDemo = async () => {
    try {
      setGeneratingDemo(true);
      await surveyApi.generateDemo();
      await loadSurveys();
      onProcess('');
      navigate('/');
    } catch {
      console.error('Failed to generate demo surveys');
    } finally {
      setGeneratingDemo(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('vessel_id', 'Autonomous Survey Towfish SSS-01');
    formData.append('area_name', 'Offshore Survey Track A');
    formData.append('sonar_type', 'EdgeTech 4200 Dual-Frequency (400/900 kHz)');

    try {
      setUploading(true);
      const created = await surveyApi.create(formData);
      // Auto process uploaded survey
      if (created && created.survey_id) {
        await surveyApi.process(created.survey_id);
      }
      await loadSurveys();
      onProcess(created.survey_id);
      navigate('/');
    } catch {
      console.error('Failed to upload survey');
    } finally {
      setUploading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'processing': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#60a5fa';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 bg-transparent">
      <div className="max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight font-heading text-glow">Sonar Survey Mission Management</h1>
            <p className="text-sm text-gray-400">
              Ingest raw Side-Scan Sonar (SSS) datasets, execute multi-stage evidence fusion, and inspect targets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateDemo}
              disabled={generatingDemo}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none flex items-center gap-2 font-heading tracking-wide"
            >
              {generatingDemo ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Surveys...</span>
                </>
              ) : (
                <>
                  <span>⚡ Load Realistic Demo Surveys</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed rounded-3xl p-10 mb-10 text-center transition-all hover:border-cyan-400 glass-panel relative overflow-hidden group cursor-pointer"
        >
          <input
            type="file"
            accept=".zip,.tar,.gz,.png,.jpg,.jpeg,.tif,.tiff"
            onChange={handleUpload}
            className="hidden"
            id="survey-upload"
            disabled={uploading}
          />
          <label htmlFor="survey-upload" className="cursor-pointer block relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 text-3xl border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] group-hover:scale-110 transition-transform">
              {uploading ? '⏳' : '📥'}
            </div>
            <div className="text-base font-bold text-white mb-2 font-heading tracking-wide">
              {uploading ? 'Uploading & Processing SSS Survey...' : 'Drop Side-Scan Sonar dataset here or browse files'}
            </div>
            <div className="text-sm text-gray-400">
              Accepts compressed surveys (<span className="text-cyan-400 font-medium">.zip</span>, <span className="text-cyan-400 font-medium">.tar.gz</span>) or individual sonar waterfall images (<span className="text-cyan-400 font-medium">.png</span>, <span className="text-cyan-400 font-medium">.jpg</span>, <span className="text-cyan-400 font-medium">.tif</span>)
            </div>
          </label>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        {/* Survey List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Survey Missions ({surveys.length})
            </h2>
            <button
              onClick={loadSurveys}
              className="text-xs text-gray-400 hover:text-white cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 glass-panel rounded-2xl">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
              <div className="text-sm font-semibold text-cyan-100 font-heading">Loading surveys...</div>
            </div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl border-dashed">
              <div className="text-5xl mb-4 opacity-70">🌊</div>
              <div className="text-lg font-bold text-white mb-2 font-heading">No active surveys in database</div>
              <div className="text-sm text-gray-400 mb-6 max-w-md mx-auto">Upload a sonar file or generate demo missions to explore full AI evidence fusion capabilities.</div>
              <button
                onClick={handleGenerateDemo}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-bold cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all font-heading tracking-wide"
              >
                ⚡ Generate Demo Surveys
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {surveys.map((survey) => (
                <div
                  key={survey.survey_id}
                  className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 glass-panel hover:shadow-[0_10px_30px_rgba(0,240,255,0.1)] hover:border-cyan-500/30"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-bold text-white tracking-wide">{survey.name}</h3>
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            color: statusColor(survey.status),
                            backgroundColor: `${statusColor(survey.status)}18`,
                            border: `1px solid ${statusColor(survey.status)}40`,
                          }}
                        >
                          {survey.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-400 mt-3 pt-3 border-t border-slate-800">
                        <div>
                          <span className="text-gray-500 block text-[10px] uppercase">Survey Area</span>
                          <span className="text-gray-200 font-medium">{survey.area_name || 'Offshore Sector'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px] uppercase">Vessel / AUV</span>
                          <span className="text-gray-200 font-medium truncate block">{survey.vessel_id || 'AUV Platform'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px] uppercase">Sonar Sensor</span>
                          <span className="text-gray-200 font-medium truncate block">{survey.sonar_type || 'Side-Scan Sonar'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px] uppercase">Images / Detections</span>
                          <span className="text-blue-400 font-semibold">
                            {survey.image_count || 0} scans &bull; {survey.detection_count || 0} targets
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/10 md:pl-4">
                      {survey.status === 'uploaded' && (
                        <button
                          onClick={() => handleProcess(survey.survey_id)}
                          disabled={processing === survey.survey_id}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer hover:scale-105 bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                          {processing === survey.survey_id ? 'Processing...' : 'Run Pipeline'}
                        </button>
                      )}
                      {survey.status === 'completed' && (
                        <button
                          onClick={() => {
                            onProcess(survey.survey_id);
                            navigate('/');
                          }}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:scale-105 shadow-[0_0_15px_rgba(0,136,255,0.3)] bg-gradient-to-r from-blue-600 to-blue-500"
                        >
                          Explore GIS View &rarr;
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(survey.survey_id)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                        title="Delete Survey"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
