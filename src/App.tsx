import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, ArrowRight, Settings, Info, Code, Compass, HelpCircle } from "lucide-react";
import { SimulationParams, SimulationState, DataPoint } from "./types";
import { rk4Step, getKineticEnergy, getPotentialEnergy } from "./physics";
import PendulumCanvas from "./components/PendulumCanvas";
import Charts from "./components/Charts";
import PythonGenerator from "./components/PythonGenerator";
import TheorySection from "./components/TheorySection";

export default function App() {
  // ---------------------------------------------------------
  // 1. STATE DECLARATIONS
  // ---------------------------------------------------------
  const [params, setParams] = useState<SimulationParams>({
    length: 2.0,       // meters
    mass: 1.0,         // kg
    gravity: 9.81,     // m/s^2
    damping: 0.05,     // kg/s
    smallAngleApprox: false, // compare linear model
  });

  // Initial conditions state (binds to sliders)
  const [initialAngleDeg, setInitialAngleDeg] = useState(60); // degrees
  const [initialOmega, setInitialOmega] = useState(0.0);       // rad/s

  // Running simulation state
  const [state, setState] = useState<SimulationState>({
    theta: (60 * Math.PI) / 180,
    omega: 0.0,
    time: 0.0,
  });

  // Parallel state for linear approximation MHS
  const [linearState, setLinearState] = useState<{ theta: number; omega: number }>({
    theta: (60 * Math.PI) / 180,
    omega: 0.0,
  });

  const [isPaused, setIsPaused] = useState(true);
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [activeTab, setActiveTab] = useState<"charts" | "python" | "theory">("charts");

  // Force vector toggle states
  const [showForces, setShowForces] = useState({
    gravity: true,
    tension: true,
    velocity: true,
  });

  // Keep a ref to get fresh params inside the animation loop
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // ---------------------------------------------------------
  // 2. BI-DIRECTIONAL BINDING & RESET METHODS
  // ---------------------------------------------------------
  
  // Resets simulation to currently selected Initial Conditions
  const resetSimulation = () => {
    const theta0Rad = (initialAngleDeg * Math.PI) / 180;
    
    const newState = {
      theta: theta0Rad,
      omega: initialOmega,
      time: 0.0,
    };
    
    setState(newState);
    setLinearState({
      theta: theta0Rad,
      omega: initialOmega,
    });

    // Clear and initialize history starting from this point
    const ep = getPotentialEnergy(theta0Rad, params);
    const ek = getKineticEnergy(initialOmega, params);
    
    setHistory([
      {
        time: 0.0,
        theta: theta0Rad,
        thetaLinear: theta0Rad,
        omega: initialOmega,
        kineticEnergy: ek,
        potentialEnergy: ep,
        totalEnergy: ek + ep,
      },
    ]);
  };

  // Sync state whenever initial condition sliders are modified
  useEffect(() => {
    if (isPaused) {
      resetSimulation();
    }
  }, [initialAngleDeg, initialOmega]);

  // Set preset environments
  const applyPreset = (presetName: string) => {
    setIsPaused(true);
    switch (presetName) {
      case "terra_ideal":
        setParams({ length: 2.0, mass: 1.0, gravity: 9.81, damping: 0.0, smallAngleApprox: false });
        setInitialAngleDeg(45);
        setInitialOmega(0.0);
        break;
      case "lua":
        setParams({ length: 1.5, mass: 1.0, gravity: 1.62, damping: 0.0, smallAngleApprox: false });
        setInitialAngleDeg(45);
        setInitialOmega(0.0);
        break;
      case "amortecido":
        setParams({ length: 2.0, mass: 1.5, gravity: 9.81, damping: 0.25, smallAngleApprox: false });
        setInitialAngleDeg(110);
        setInitialOmega(0.0);
        break;
      case "grande_angulo":
        setParams({ length: 3.0, mass: 1.0, gravity: 9.81, damping: 0.01, smallAngleApprox: false });
        setInitialAngleDeg(170);
        setInitialOmega(0.0);
        break;
      case "zero_g":
        setParams({ length: 2.0, mass: 1.0, gravity: 0.0, damping: 0.05, smallAngleApprox: false });
        setInitialAngleDeg(90);
        setInitialOmega(3.5); // Spin it in space
        break;
      default:
        break;
    }
  };

  // Run initial reset once on mount
  useEffect(() => {
    resetSimulation();
  }, []);

  // Handle manual coordinate adjustment from Canvas dragging
  const handleCanvasStateChange = (newState: Partial<SimulationState>) => {
    if (newState.theta !== undefined) {
      const angleRad = newState.theta;
      const angleDeg = (angleRad * 180) / Math.PI;
      
      // Update our initial sliders so they match the dragged bob
      setInitialAngleDeg(parseFloat(angleDeg.toFixed(1)));
      setInitialOmega(newState.omega !== undefined ? newState.omega : 0);
      
      // Update actual simulation running states
      setState((prev) => ({
        ...prev,
        theta: angleRad,
        omega: newState.omega !== undefined ? newState.omega : 0,
        time: 0.0,
      }));
      setLinearState({
        theta: angleRad,
        omega: newState.omega !== undefined ? newState.omega : 0,
      });

      // Reset history to match manual placement
      const ep = getPotentialEnergy(angleRad, params);
      const ek = getKineticEnergy(0, params);
      setHistory([
        {
          time: 0.0,
          theta: angleRad,
          thetaLinear: angleRad,
          omega: 0,
          kineticEnergy: ek,
          potentialEnergy: ep,
          totalEnergy: ek + ep,
        },
      ]);
    }
  };

  // ---------------------------------------------------------
  // 3. ANIMATION PHYSICS LOOP
  // ---------------------------------------------------------
  useEffect(() => {
    if (isPaused) return;

    let active = true;
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      if (!active) return;

      // Delta time in seconds
      const elapsedMs = timestamp - lastTime;
      lastTime = timestamp;

      // Bound delta to prevent huge jumps if tab is unfocused
      const dt = Math.min(elapsedMs / 1000, 0.03);

      setState((curr) => {
        const p = paramsRef.current;
        
        // 1. Integrate nonlinear exact model (theta, omega)
        const nextState = rk4Step(curr, dt, p);

        // 2. Integrate linear comparative model (thetaLinear, omegaLinear) in parallel
        // For linear model, derivatives are d_theta = omega, d_omega = -g/L * theta - b/m * omega
        let nextLinearTheta = linearState.theta;
        let nextLinearOmega = linearState.omega;

        setLinearState((currLin) => {
          // RK4 on linear approximation
          const getLinDerivs = (th: number, om: number) => {
            return {
              dTh: om,
              dOm: - (p.gravity / p.length) * th - (p.damping / p.mass) * om
            };
          };

          const k1 = getLinDerivs(currLin.theta, currLin.omega);
          const k2 = getLinDerivs(currLin.theta + 0.5 * dt * k1.dTh, currLin.omega + 0.5 * dt * k1.dOm);
          const k3 = getLinDerivs(currLin.theta + 0.5 * dt * k2.dTh, currLin.omega + 0.5 * dt * k2.dOm);
          const k4 = getLinDerivs(currLin.theta + dt * k3.dTh, currLin.omega + dt * k3.dOm);

          nextLinearTheta = currLin.theta + (dt / 6) * (k1.dTh + 2 * k2.dTh + 2 * k3.dTh + k4.dTh);
          nextLinearOmega = currLin.omega + (dt / 6) * (k1.dOm + 2 * k2.dOm + 2 * k3.dOm + k4.dOm);

          return {
            theta: nextLinearTheta,
            omega: nextLinearOmega
          };
        });

        // 3. Calculate Energies for precise graphing
        const ek = getKineticEnergy(nextState.omega, p);
        const ep = getPotentialEnergy(nextState.theta, p);
        const et = ek + ep;

        // 4. Update history (keep sliding buffer of 200 points for responsiveness)
        setHistory((prevHistory) => {
          const newPoint: DataPoint = {
            time: nextState.time,
            theta: nextState.theta,
            thetaLinear: nextLinearTheta,
            omega: nextState.omega,
            kineticEnergy: ek,
            potentialEnergy: ep,
            totalEnergy: et,
          };
          const nextHistory = [...prevHistory, newPoint];
          if (nextHistory.length > 200) {
            nextHistory.shift();
          }
          return nextHistory;
        });

        return nextState;
      });

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      active = false;
    };
  }, [isPaused, linearState.theta, linearState.omega]);

  // Manual single frame step forward (useful for static analysis)
  const stepForward = () => {
    setIsPaused(true);
    const dt = 0.016; // single frame time delta

    setState((curr) => {
      const p = params;
      const nextState = rk4Step(curr, dt, p);

      let nextLinearTheta = linearState.theta;
      let nextLinearOmega = linearState.omega;

      setLinearState((currLin) => {
        const getLinDerivs = (th: number, om: number) => {
          return {
            dTh: om,
            dOm: - (p.gravity / p.length) * th - (p.damping / p.mass) * om
          };
        };
        const k1 = getLinDerivs(currLin.theta, currLin.omega);
        const k2 = getLinDerivs(currLin.theta + 0.5 * dt * k1.dTh, currLin.omega + 0.5 * dt * k1.dOm);
        const k3 = getLinDerivs(currLin.theta + 0.5 * dt * k2.dTh, currLin.omega + 0.5 * dt * k2.dOm);
        const k4 = getLinDerivs(currLin.theta + dt * k3.dTh, currLin.omega + dt * k3.dOm);

        nextLinearTheta = currLin.theta + (dt / 6) * (k1.dTh + 2 * k2.dTh + 2 * k3.dTh + k4.dTh);
        nextLinearOmega = currLin.omega + (dt / 6) * (k1.dOm + 2 * k2.dOm + 2 * k3.dOm + k4.dOm);
        return { theta: nextLinearTheta, omega: nextLinearOmega };
      });

      const ek = getKineticEnergy(nextState.omega, p);
      const ep = getPotentialEnergy(nextState.theta, p);
      const et = ek + ep;

      setHistory((prev) => {
        const nextHist = [...prev, {
          time: nextState.time,
          theta: nextState.theta,
          thetaLinear: nextLinearTheta,
          omega: nextState.omega,
          kineticEnergy: ek,
          potentialEnergy: ep,
          totalEnergy: et,
        }];
        if (nextHist.length > 200) nextHist.shift();
        return nextHist;
      });

      return nextState;
    });
  };

  // Helper values for current system details
  const calculatedPeriod = (2 * Math.PI * Math.sqrt(params.length / params.gravity)).toFixed(3);
  const calculatedFrequency = (1 / parseFloat(calculatedPeriod)).toFixed(3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* HEADER BANNER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm select-none" id="app-header">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
              <Compass className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Laboratório de Física Computacional
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Simulador de Pêndulo e Movimento Harmônico Simples (MHS) com Runge-Kutta 4 (RK4)
          </p>
        </div>
        
        {/* Quick Readout Stats */}
        <div className="flex items-center gap-4 text-xs font-mono bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 max-w-max self-start md:self-auto">
          <div className="px-2">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Período Ideal (T)</span>
            <span className="text-indigo-600 font-bold text-sm">{params.gravity > 0 ? `${calculatedPeriod}s` : "∞"}</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="px-2">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Frequência (f)</span>
            <span className="text-teal-600 font-bold text-sm">{params.gravity > 0 ? `${calculatedFrequency} Hz` : "0 Hz"}</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="px-2">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Energia Total</span>
            <span className="text-rose-600 font-bold text-sm">
              {history.length > 0 ? `${history[history.length - 1].totalEnergy.toFixed(3)} J` : "0.00 J"}
            </span>
          </div>
        </div>
      </header>

      {/* WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPARTMENT: SIMULATION & PRESETS (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Pendulum Viewbox Screen */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              Visualização Física
            </h3>
            
            <PendulumCanvas
              params={params}
              state={state}
              onChangeState={handleCanvasStateChange}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
              showForces={showForces}
            />

            {/* Playback Button Actions bar */}
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                  isPaused
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                }`}
                id="play-pause-btn"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar Simulação</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar</span>
                  </>
                )}
              </button>

              <button
                onClick={stepForward}
                disabled={!isPaused}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Avançar 1 Frame"
                id="step-btn"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={resetSimulation}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-55 text-slate-500 hover:text-rose-600 rounded-lg transition-colors"
                title="Reiniciar Simulação"
                id="reset-btn"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset Buttons Board */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">Ambientes Predefinidos</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset("terra_ideal")}
                className="text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs transition-colors flex flex-col gap-0.5"
                id="preset-earth"
              >
                <span className="font-bold text-slate-800">Terra Ideal</span>
                <span className="text-[10px] text-slate-500">MHS clássico ideal, g=9.81m/s²</span>
              </button>
              <button
                onClick={() => applyPreset("lua")}
                className="text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs transition-colors flex flex-col gap-0.5"
                id="preset-moon"
              >
                <span className="font-bold text-indigo-600">Pêndulo Lunar</span>
                <span className="text-[10px] text-slate-500">Movimento lento, g=1.62m/s²</span>
              </button>
              <button
                onClick={() => applyPreset("amortecido")}
                className="text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs transition-colors flex flex-col gap-0.5"
                id="preset-damped"
              >
                <span className="font-bold text-amber-600">Fricção Viscosa</span>
                <span className="text-[10px] text-slate-500">Amortecimento e perda de energia</span>
              </button>
              <button
                onClick={() => applyPreset("grande_angulo")}
                className="text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs transition-colors flex flex-col gap-0.5"
                id="preset-chaotic"
              >
                <span className="font-bold text-rose-600">Grande Amplitude</span>
                <span className="text-[10px] text-slate-500">Limiar não-linear exato (&theta;=170&deg;)</span>
              </button>
            </div>
            <button
              onClick={() => applyPreset("zero_g")}
              className="w-full text-center p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-colors font-bold text-indigo-600 hover:text-indigo-700"
              id="preset-space"
            >
              🚀 Ausência de Gravidade (Rotação Livre)
            </button>
          </div>
        </div>

        {/* MIDDLE COLUMN: PARAMETER CONFIGURATION SLIDERS (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Variáveis Físicas</span>
            </h3>

            {/* Slider 1: Comprimento L */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-medium">Comprimento (L)</span>
                <span className="text-indigo-600 font-mono font-bold">{params.length.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={params.length}
                onChange={(e) => setParams((prev) => ({ ...prev, length: parseFloat(e.target.value) }))}
                className="w-full accent-indigo-600 cursor-pointer bg-slate-100 h-1.5 rounded-lg"
                id="slider-length"
              />
            </div>

            {/* Slider 2: Massa m */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-medium">Massa (m)</span>
                <span className="text-rose-500 font-mono font-bold">{params.mass.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={params.mass}
                onChange={(e) => setParams((prev) => ({ ...prev, mass: parseFloat(e.target.value) }))}
                className="w-full accent-rose-500 cursor-pointer bg-slate-100 h-1.5 rounded-lg"
                id="slider-mass"
              />
            </div>

            {/* Slider 3: Gravidade g */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-medium">Gravidade (g)</span>
                <span className="text-teal-600 font-mono font-bold">{params.gravity.toFixed(2)} m/s²</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="25.0"
                step="0.1"
                value={params.gravity}
                onChange={(e) => setParams((prev) => ({ ...prev, gravity: parseFloat(e.target.value) }))}
                className="w-full accent-teal-600 cursor-pointer bg-slate-100 h-1.5 rounded-lg"
                id="slider-gravity"
              />
              {/* Quick gravity set shortcuts */}
              <div className="grid grid-cols-4 gap-1 pt-1 text-[9px] font-bold text-slate-600 font-mono text-center">
                <button
                  onClick={() => setParams((p) => ({ ...p, gravity: 0.0 }))}
                  className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  title="Gravidade Zero"
                >
                  Zero
                </button>
                <button
                  onClick={() => setParams((p) => ({ ...p, gravity: 1.62 }))}
                  className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  title="Lua: 1.62 m/s²"
                >
                  Lua
                </button>
                <button
                  onClick={() => setParams((p) => ({ ...p, gravity: 9.81 }))}
                  className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-indigo-600 font-bold transition-colors"
                  title="Terra: 9.81 m/s²"
                >
                  Terra
                </button>
                <button
                  onClick={() => setParams((p) => ({ ...p, gravity: 24.79 }))}
                  className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  title="Júpiter: 24.79 m/s²"
                >
                  Júp
                </button>
              </div>
            </div>

            {/* Slider 4: Amortecimento b */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-medium">Amortecimento (b)</span>
                <span className="text-amber-600 font-mono font-bold">{params.damping.toFixed(3)} kg/s</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.01"
                value={params.damping}
                onChange={(e) => setParams((prev) => ({ ...prev, damping: parseFloat(e.target.value) }))}
                className="w-full accent-amber-500 cursor-pointer bg-slate-100 h-1.5 rounded-lg"
                id="slider-damping"
              />
            </div>

            {/* Slider 5: Ângulo Inicial */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-bold">Ângulo Inicial (&theta;₀)</span>
                <span className="text-indigo-600 font-mono font-bold">{initialAngleDeg.toFixed(1)}&deg;</span>
              </div>
              <input
                type="range"
                min="-179"
                max="179"
                step="1"
                value={initialAngleDeg}
                onChange={(e) => {
                  setInitialAngleDeg(parseInt(e.target.value));
                  if (!isPaused) setIsPaused(true); // pause to set
                }}
                className="w-full accent-indigo-600 cursor-pointer bg-slate-100 h-1.5 rounded-lg"
                id="slider-init-angle"
              />
            </div>

            {/* Slider 6: Velocidade Inicial */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-bold">Velocidade Inicial (&omega;₀)</span>
                <span className="text-slate-800 font-mono font-bold">{initialOmega.toFixed(2)} rad/s</span>
              </div>
              <input
                type="range"
                min="-8.0"
                max="8.0"
                step="0.1"
                value={initialOmega}
                onChange={(e) => {
                  setInitialOmega(parseFloat(e.target.value));
                  if (!isPaused) setIsPaused(true); // pause to set
                }}
                className="w-full accent-indigo-600 cursor-pointer bg-slate-100 h-1.5 rounded-lg"
                id="slider-init-omega"
              />
            </div>

            {/* Display / Vector Toggles Section */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-bold">Exibição de Forças</span>
              <div className="space-y-1.5 font-medium text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={showForces.gravity}
                    onChange={(e) => setShowForces((prev) => ({ ...prev, gravity: e.target.checked }))}
                    className="rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 focus:ring-1"
                    id="chk-force-gravity"
                  />
                  <span>Força Peso (Gravidade)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={showForces.tension}
                    onChange={(e) => setShowForces((prev) => ({ ...prev, tension: e.target.checked }))}
                    className="rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 focus:ring-1"
                    id="chk-force-tension"
                  />
                  <span>Tensão do Fio</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={showForces.velocity}
                    onChange={(e) => setShowForces((prev) => ({ ...prev, velocity: e.target.checked }))}
                    className="rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 focus:ring-1"
                    id="chk-force-velocity"
                  />
                  <span>Vetor Velocidade</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GRAPHS, PYTHON GENERATOR & THEORY DECK (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Deck Tab Selectors */}
          <div className="flex border-b border-slate-200 select-none bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab("charts")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "charts"
                  ? "bg-slate-50 text-slate-900 border border-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="deck-tab-btn-charts"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Gráficos</span>
            </button>
            <button
              onClick={() => setActiveTab("python")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "python"
                  ? "bg-slate-50 text-slate-900 border border-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="deck-tab-btn-python"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Código Python</span>
            </button>
            <button
              onClick={() => setActiveTab("theory")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "theory"
                  ? "bg-slate-50 text-slate-900 border border-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="deck-tab-btn-theory"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Teoria</span>
            </button>
          </div>

          {/* Active Tab Panel Rendering */}
          <div className="flex-1 min-h-[460px] flex flex-col">
            {activeTab === "charts" && (
              <Charts
                history={history}
                onClearHistory={() => setHistory([])}
              />
            )}
            
            {activeTab === "python" && (
              <PythonGenerator
                params={params}
                initialTheta={(initialAngleDeg * Math.PI) / 180}
                initialOmega={initialOmega}
              />
            )}

            {activeTab === "theory" && (
              <TheorySection />
            )}
          </div>
        </div>

      </main>

      {/* FOOTER credit line */}
      <footer className="bg-white border-t border-slate-200 text-center py-4 px-6 text-xs text-slate-500 font-mono select-none" id="app-footer">
        Desenvolvido com Runge-Kutta de 4ª Ordem (RK4) &bull; Física Computacional 2026
      </footer>

    </div>
  );
}
