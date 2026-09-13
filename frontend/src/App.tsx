import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SurveyView from './pages/SurveyView';
import { useState } from 'react';

function Nav() {
  return (
    <nav className="h-14 flex items-center justify-between px-6 pl-10 border-b border-white/5 z-40 flex-shrink-0 glass-panel shadow-lg">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 font-bold tracking-wider text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <span className="text-white text-sm font-heading">SA</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-heading text-lg">SONARIS</span>
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-medium">Mission Control</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'text-gray-400 border border-transparent hover:text-gray-200 hover:bg-slate-800/40 hover:border-white/10'
              }`
            }
          >
            <span className="flex items-center gap-2">🗺️ Dashboard</span>
          </NavLink>
          <NavLink
            to="/surveys"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'text-gray-400 border border-transparent hover:text-gray-200 hover:bg-slate-800/40 hover:border-white/10'
              }`
            }
          >
            <span className="flex items-center gap-2">📁 Survey Missions</span>
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-gray-400 bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#00ff88]"></span>
          </span>
          <span className="text-gray-300 font-mono tracking-wide">EdgeTech SSS Pipeline Online</span>
        </span>
      </div>
    </nav>
  );
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col overflow-hidden bg-transparent">
        <Nav />
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Dashboard key={refreshKey} />} />
            <Route
              path="/surveys"
              element={
                <SurveyView
                  onProcess={() => {
                    setRefreshKey((k) => k + 1);
                  }}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
