import React, { useState, useMemo } from "react";
import { DataPoint } from "../types";

interface ChartsProps {
  history: DataPoint[];
  onClearHistory: () => void;
}

type ChartTab = "state" | "energy" | "phase";

export default function Charts({ history, onClearHistory }: ChartsProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>("state");

  // Constant size for the custom SVG graphing canvas
  const chartWidth = 500;
  const chartHeight = 220;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // ---------------------------------------------------------
  // 1. Time Series Chart Path Calculator (theta, omega vs time)
  // ---------------------------------------------------------
  const stateChartPaths = useMemo(() => {
    if (history.length < 2) return { thetaPath: "", omegaPath: "", linearPath: "", thetaScale: 1, omegaScale: 1 };

    // Find min and max of theta and omega to establish scales
    const limit = Math.max(
      ...history.map(d => Math.max(Math.abs(d.theta), Math.abs(d.omega), Math.abs(d.thetaLinear), 0.1))
    );
    
    // Y-axis scale (maps -limit to limit)
    const yScale = (val: number) => {
      const normalized = (val - (-limit)) / (2 * limit); // 0 to 1
      return chartHeight - paddingBottom - normalized * graphHeight;
    };

    // X-axis scale (maps index to width)
    const xScale = (index: number) => {
      return paddingLeft + (index / (history.length - 1)) * graphWidth;
    };

    // Build SVG paths
    const thetaPath = history
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.theta)}`)
      .join(" ");

    const omegaPath = history
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.omega)}`)
      .join(" ");

    const linearPath = history
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.thetaLinear)}`)
      .join(" ");

    return { thetaPath, omegaPath, linearPath, limit, yScale, xScale };
  }, [history, graphWidth, graphHeight]);

  // ---------------------------------------------------------
  // 2. Energy Chart Path Calculator (Kinetic, Potential, Total vs time)
  // ---------------------------------------------------------
  const energyChartPaths = useMemo(() => {
    if (history.length < 2) return { kineticPath: "", potentialPath: "", totalPath: "", maxEnergy: 1 };

    // Find max energy seen
    const maxEnergy = Math.max(
      ...history.map(d => Math.max(d.kineticEnergy, d.potentialEnergy, d.totalEnergy, 0.05))
    );

    // Y scale (maps 0 to maxEnergy with some padding on top)
    const energyLimit = maxEnergy * 1.15;
    const yScale = (val: number) => {
      const normalized = val / energyLimit; // 0 to 1
      return chartHeight - paddingBottom - normalized * graphHeight;
    };

    // X scale
    const xScale = (index: number) => {
      return paddingLeft + (index / (history.length - 1)) * graphWidth;
    };

    const kineticPath = history
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.kineticEnergy)}`)
      .join(" ");

    const potentialPath = history
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.potentialEnergy)}`)
      .join(" ");

    const totalPath = history
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.totalEnergy)}`)
      .join(" ");

    return { kineticPath, potentialPath, totalPath, energyLimit, yScale, xScale };
  }, [history, graphWidth, graphHeight]);

  // ---------------------------------------------------------
  // 3. Phase Portrait Path Calculator (omega vs theta)
  // ---------------------------------------------------------
  const phasePortraitPath = useMemo(() => {
    if (history.length < 2) return { path: "", maxTheta: 1, maxOmega: 1 };

    // Find limits for theta (X) and omega (Y)
    const maxTheta = Math.max(...history.map(d => Math.abs(d.theta)), 0.1);
    const maxOmega = Math.max(...history.map(d => Math.abs(d.omega)), 0.1);

    const limTheta = maxTheta * 1.2;
    const limOmega = maxOmega * 1.2;

    const xScale = (th: number) => {
      const normalized = (th - (-limTheta)) / (2 * limTheta); // 0 to 1
      return paddingLeft + normalized * graphWidth;
    };

    const yScale = (om: number) => {
      const normalized = (om - (-limOmega)) / (2 * limOmega); // 0 to 1
      return chartHeight - paddingBottom - normalized * graphHeight;
    };

    const path = history
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.theta)} ${yScale(d.omega)}`)
      .join(" ");

    return { path, limTheta, limOmega, xScale, yScale };
  }, [history, graphWidth, graphHeight]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-sm" id="charts-panel">
      {/* Tab Selectors and Clear Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("state")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "state"
                ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            id="tab-btn-state"
          >
            Estado (t)
          </button>
          <button
            onClick={() => setActiveTab("energy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "energy"
                ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            id="tab-btn-energy"
          >
            Energia
          </button>
          <button
            onClick={() => setActiveTab("phase")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "phase"
                ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            id="tab-btn-phase"
          >
            Espaço de Fase
          </button>
        </div>

        <button
          onClick={onClearHistory}
          className="text-xs font-semibold px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-sm transition-colors"
          id="clear-charts-btn"
        >
          Limpar Gráficos
        </button>
      </div>

      {/* Drawing Space */}
      <div className="w-full flex-1 flex items-center justify-center bg-slate-50 rounded-xl p-2 border border-slate-100 min-h-[220px]">
        {history.length < 2 ? (
          <div className="text-slate-400 font-mono text-xs text-center py-10">
            Aguardando a simulação iniciar...<br />
            Clique no botão de Play acima.
          </div>
        ) : (
          <div className="w-full">
            {/* 1. STATE TIME SERIES GRAPH */}
            {activeTab === "state" && (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                {/* Horizontal reference grid lines */}
                <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="#e2e8f0" />
                <line x1={paddingLeft} y1={paddingTop + graphHeight/2} x2={chartWidth - paddingRight} y2={paddingTop + graphHeight/2} stroke="#cbd5e1" strokeDasharray="2,4" />
                <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#e2e8f0" />

                {/* Left vertical Y-axis ticks */}
                <text x={paddingLeft - 8} y={paddingTop + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                  {stateChartPaths.limit.toFixed(2)}
                </text>
                <text x={paddingLeft - 8} y={paddingTop + graphHeight/2 + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                  0.00
                </text>
                <text x={paddingLeft - 8} y={chartHeight - paddingBottom + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                  -{stateChartPaths.limit.toFixed(2)}
                </text>

                {/* Grid Axes lines */}
                <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={chartHeight - paddingBottom} stroke="#cbd5e1" />
                <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#cbd5e1" />

                {/* Time X-axis indicators */}
                <text x={paddingLeft} y={chartHeight - 8} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {history[0].time.toFixed(1)}s
                </text>
                <text x={chartWidth - paddingRight} y={chartHeight - 8} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {history[history.length - 1].time.toFixed(1)}s
                </text>

                {/* Graph Paths */}
                {/* 1. Angle comparison linear (Dashed Blue-Grey) */}
                <path d={stateChartPaths.linearPath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
                {/* 2. Theta Path (Indigo) */}
                <path d={stateChartPaths.thetaPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* 3. Omega Path (Teal) */}
                <path d={stateChartPaths.omegaPath} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Interactive End Indicator Dots */}
                <circle cx={paddingLeft + graphWidth} cy={stateChartPaths.yScale(history[history.length - 1].theta)} r="4" fill="#4f46e5" />
                <circle cx={paddingLeft + graphWidth} cy={stateChartPaths.yScale(history[history.length - 1].omega)} r="4" fill="#0d9488" />
              </svg>
            )}

            {/* 2. ENERGY ANALYSIS GRAPH */}
            {activeTab === "energy" && (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                {/* Horizontal reference grid lines */}
                <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="#e2e8f0" />
                <line x1={paddingLeft} y1={paddingTop + graphHeight/2} x2={chartWidth - paddingRight} y2={paddingTop + graphHeight/2} stroke="#e2e8f0" opacity="0.5" />
                <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#e2e8f0" />

                {/* Y-ticks (Energy) */}
                <text x={paddingLeft - 8} y={paddingTop + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                  {energyChartPaths.energyLimit.toFixed(3)} J
                </text>
                <text x={paddingLeft - 8} y={paddingTop + graphHeight/2 + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                  {(energyChartPaths.energyLimit / 2).toFixed(3)} J
                </text>
                <text x={paddingLeft - 8} y={chartHeight - paddingBottom + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                  0.0 J
                </text>

                {/* Grid Axes lines */}
                <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={chartHeight - paddingBottom} stroke="#cbd5e1" />
                <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#cbd5e1" />

                {/* Time X-axis indicators */}
                <text x={paddingLeft} y={chartHeight - 8} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {history[0].time.toFixed(1)}s
                </text>
                <text x={chartWidth - paddingRight} y={chartHeight - 8} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {history[history.length - 1].time.toFixed(1)}s
                </text>

                {/* Energy Paths */}
                {/* Potential energy (Blue) */}
                <path d={energyChartPaths.potentialPath} fill="none" stroke="#3b82f6" strokeWidth="2.0" />
                {/* Kinetic energy (Rose) */}
                <path d={energyChartPaths.kineticPath} fill="none" stroke="#f43f5e" strokeWidth="2.0" />
                {/* Total energy (Purple) */}
                <path d={energyChartPaths.totalPath} fill="none" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Current Value End Nodes */}
                <circle cx={paddingLeft + graphWidth} cy={energyChartPaths.yScale(history[history.length - 1].totalEnergy)} r="3.5" fill="#9333ea" />
              </svg>
            )}

            {/* 3. PHASE SPACE PORTRAIT GRAPH (omega vs theta) */}
            {activeTab === "phase" && (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                {/* Centered crosshairs reference lines (since 0,0 is the center of phase space) */}
                <line x1={paddingLeft} y1={paddingTop + graphHeight / 2} x2={chartWidth - paddingRight} y2={paddingTop + graphHeight / 2} stroke="#cbd5e1" opacity="0.6" strokeDasharray="2,3" />
                <line x1={paddingLeft + graphWidth / 2} y1={paddingTop} x2={paddingLeft + graphWidth / 2} y2={chartHeight - paddingBottom} stroke="#cbd5e1" opacity="0.6" strokeDasharray="2,3" />

                {/* Axes lines */}
                <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={chartHeight - paddingBottom} stroke="#cbd5e1" />
                <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#cbd5e1" />

                {/* Axes Labels */}
                {/* Y-Axis: Velocity limit */}
                <text x={paddingLeft - 8} y={paddingTop + 4} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
                  {phasePortraitPath.limOmega.toFixed(1)}
                </text>
                <text x={paddingLeft - 8} y={chartHeight - paddingBottom + 4} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
                  -{phasePortraitPath.limOmega.toFixed(1)}
                </text>
                <text x={paddingLeft + 10} y={paddingTop + 14} fill="#0d9488" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  &omega; (rad/s)
                </text>

                {/* X-Axis: Angle limits */}
                <text x={paddingLeft} y={chartHeight - 8} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  -{phasePortraitPath.limTheta.toFixed(2)} rad
                </text>
                <text x={chartWidth - paddingRight} y={chartHeight - 8} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {phasePortraitPath.limTheta.toFixed(2)} rad
                </text>
                <text x={chartWidth - paddingRight} y={chartHeight - paddingBottom - 10} fill="#4f46e5" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  &theta; (rad)
                </text>

                {/* The Trajectory Path */}
                <path d={phasePortraitPath.path} fill="none" stroke="#0d9488" strokeWidth="2.0" opacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Initial starting node */}
                <circle cx={phasePortraitPath.xScale(history[0].theta)} cy={phasePortraitPath.yScale(history[0].omega)} r="4" fill="#f43f5e" />
                {/* Active leading node */}
                <circle cx={phasePortraitPath.xScale(history[history.length - 1].theta)} cy={phasePortraitPath.yScale(history[history.length - 1].omega)} r="5" fill="#3b82f6" />
              </svg>
            )}

            {/* Custom Interactive Graph Legends */}
            <div className="flex justify-center items-center gap-4 mt-2 select-none">
              {activeTab === "state" && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-indigo-600 rounded"></span>
                    <span className="text-[10px] font-medium text-slate-600 font-mono">Ângulo (&theta;)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-teal-600 rounded"></span>
                    <span className="text-[10px] font-medium text-slate-600 font-mono">Velocidade (&omega;)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed border-slate-400 rounded"></span>
                    <span className="text-[10px] font-medium text-slate-500 font-mono">Modelo Linear</span>
                  </div>
                </>
              )}
              {activeTab === "energy" && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-rose-500 rounded"></span>
                    <span className="text-[10px] font-medium text-slate-600 font-mono">Cinética (Ec)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-blue-500 rounded"></span>
                    <span className="text-[10px] font-medium text-slate-600 font-mono">Potencial (Ep)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-purple-600 rounded"></span>
                    <span className="text-[10px] font-medium text-slate-600 font-mono">Mecânica Total</span>
                  </div>
                </>
              )}
              {activeTab === "phase" && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                    <span className="text-[10px] font-medium text-slate-600 font-mono">Início</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                    <span className="text-[10px] font-medium text-slate-600 font-mono">Estado Atual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-teal-600 rounded inline-block"></span>
                    <span className="text-[10px] font-medium text-slate-600 font-mono">Trajetória</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
