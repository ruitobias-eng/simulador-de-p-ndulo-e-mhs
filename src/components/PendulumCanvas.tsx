import React, { useRef, useState, useEffect } from "react";
import { SimulationParams, SimulationState } from "../types";

interface PendulumCanvasProps {
  params: SimulationParams;
  state: SimulationState;
  onChangeState: (newState: Partial<SimulationState>) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  showForces: {
    gravity: boolean;
    tension: boolean;
    velocity: boolean;
  };
}

export default function PendulumCanvas({
  params,
  state,
  onChangeState,
  isPaused,
  setIsPaused,
  showForces,
}: PendulumCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number; time: number }[]>([]);

  // Dimensions of SVG viewBox
  const width = 400;
  const height = 400;
  const pivotX = 200;
  const pivotY = 100;

  // Scale length (m) to pixels
  // Max length is 5m. Let's make length=1m about 60px, length=5m about 220px.
  // Linear scale: pixels = 40 + length * 40
  const visualLength = 50 + params.length * 40;

  // Bob position
  const bobX = pivotX + visualLength * Math.sin(state.theta);
  const bobY = pivotY + visualLength * Math.cos(state.theta);

  // Maintain motion trail
  useEffect(() => {
    if (!isPaused) {
      setTrail((prev) => {
        const updated = [...prev, { x: bobX, y: bobY, time: Date.now() }];
        // Keep trail of last 25 frames
        if (updated.length > 25) {
          updated.shift();
        }
        return updated;
      });
    } else {
      // Keep trail but prune if we aren't moving, or clear slowly
    }
  }, [bobX, bobY, isPaused]);

  // Handle pointer events for dragging
  const handlePointerDown = (e: React.PointerEvent<SVGCircleElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setIsPaused(true); // Pause while dragging
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    // Convert client screen coordinates to SVG coordinates
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // Scale factor between SVG viewBox (400) and actual client dimensions
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    const svgX = clientX * scaleX;
    const svgY = clientY * scaleY;
    
    const dx = svgX - pivotX;
    const dy = svgY - pivotY;
    
    // Calculate angle from vertical (dy increases downwards, so standard angle)
    // dx is opposite, dy is adjacent. Math.atan2(dx, dy) gives 0 at straight down.
    let angle = Math.atan2(dx, dy);
    
    // Clamping angular limits slightly to prevent wrapping issues if dragged near top
    if (angle > Math.PI) angle -= 2 * Math.PI;
    if (angle < -Math.PI) angle += 2 * Math.PI;

    onChangeState({
      theta: angle,
      omega: 0, // holding it, so zero velocity
    });
    setTrail([]); // Clear trail on manual drag
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  // Calculations for vector drawings (scaled)
  const gForceMagnitude = params.mass * params.gravity; // mg
  const velocityMagnitude = params.length * state.omega; // v = L*omega

  // Scale forces for visual rendering
  const forceScale = 4.0; // multiplier to make lines visible
  
  // 1. Gravity Vector (straight down)
  const gravityVectorY = bobY + gForceMagnitude * forceScale;
  
  // 2. Tension Vector (along the rod, towards the pivot)
  // Tension = m*g*cos(theta) + m*v^2/L
  const tensionMagnitude = params.mass * params.gravity * Math.cos(state.theta) + 
                          params.mass * (velocityMagnitude * velocityMagnitude) / params.length;
  // Tension vector points from bob to pivot
  const dxString = pivotX - bobX;
  const dyString = pivotY - bobY;
  const distString = Math.sqrt(dxString * dxString + dyString * dyString);
  const uxString = dxString / distString;
  const uyString = dyString / distString;
  const tensionVectorX = bobX + uxString * tensionMagnitude * forceScale;
  const tensionVectorY = bobY + uyString * tensionMagnitude * forceScale;

  // 3. Velocity Vector (perpendicular to string, in direction of motion)
  // Direction is (cos(theta), -sin(theta)) or similar
  const velVectorX = bobX + Math.cos(state.theta) * velocityMagnitude * forceScale * 8.0;
  const velVectorY = bobY - Math.sin(state.theta) * velocityMagnitude * forceScale * 8.0;

  // Degrees helper
  const angleDegrees = (state.theta * 180) / Math.PI;

  return (
    <div className="relative w-full aspect-square bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4 shadow-inner" id="canvas-container">
      {/* HUD Info */}
      <div className="absolute top-4 left-4 font-mono text-xs text-slate-700 space-y-1 bg-white/95 p-2.5 rounded-lg border border-slate-200 shadow-sm backdrop-blur z-10">
        <div>&theta;: <span className="text-indigo-600 font-bold">{angleDegrees.toFixed(1)}&deg;</span></div>
        <div>&omega;: <span className="text-teal-600 font-bold">{state.omega.toFixed(2)} rad/s</span></div>
        <div>Tempo: <span className="text-rose-600 font-bold">{state.time.toFixed(2)}s</span></div>
        <div>V: <span className="text-amber-600 font-bold">{(params.length * state.omega).toFixed(2)} m/s</span></div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        {isDragging ? (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full animate-pulse">
            Ajustando Ângulo
          </span>
        ) : isPaused ? (
          <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full">
            Pausado
          </span>
        ) : (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full animate-pulse">
            Simulando
          </span>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          {/* Arrow markers for vectors */}
          <marker
            id="arrow-gravity"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
          </marker>
          <marker
            id="arrow-tension"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5" />
          </marker>
          <marker
            id="arrow-velocity"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
          </marker>
        </defs>

        {/* --- Background Angular Grid lines --- */}
        <g stroke="#cbd5e1" strokeDasharray="3,3" strokeWidth="1" opacity="0.6">
          {/* Vertical 0 reference */}
          <line x1={pivotX} y1={pivotY} x2={pivotX} y2={height - 50} />
          {/* 30 Degrees Left */}
          <line x1={pivotX} y1={pivotY} x2={pivotX - Math.sin(Math.PI / 6) * 300} y2={pivotY + Math.cos(Math.PI / 6) * 300} />
          {/* 30 Degrees Right */}
          <line x1={pivotX} y1={pivotY} x2={pivotX + Math.sin(Math.PI / 6) * 300} y2={pivotY + Math.cos(Math.PI / 6) * 300} />
          {/* 60 Degrees Left */}
          <line x1={pivotX} y1={pivotY} x2={pivotX - Math.sin(Math.PI / 3) * 300} y2={pivotY + Math.cos(Math.PI / 3) * 300} />
          {/* 60 Degrees Right */}
          <line x1={pivotX} y1={pivotY} x2={pivotX + Math.sin(Math.PI / 3) * 300} y2={pivotY + Math.cos(Math.PI / 3) * 300} />
          {/* Horizontal Reference */}
          <line x1={50} y1={pivotY} x2={width - 50} y2={pivotY} />
        </g>

        {/* Angular Reference Text Labels */}
        <g fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.8">
          <text x={pivotX} y={pivotY - 10}>0&deg;</text>
          <text x={pivotX + Math.sin(Math.PI / 6) * 230} y={pivotY + Math.cos(Math.PI / 6) * 230 + 10}>30&deg;</text>
          <text x={pivotX - Math.sin(Math.PI / 6) * 230} y={pivotY + Math.cos(Math.PI / 6) * 230 + 10}>-30&deg;</text>
          <text x={pivotX + Math.sin(Math.PI / 3) * 230} y={pivotY + Math.cos(Math.PI / 3) * 230 + 10}>60&deg;</text>
          <text x={pivotX - Math.sin(Math.PI / 3) * 230} y={pivotY + Math.cos(Math.PI / 3) * 230 + 10}>-60&deg;</text>
          <text x={width - 30} y={pivotY + 4}>90&deg;</text>
          <text x={30} y={pivotY + 4}>-90&deg;</text>
        </g>

        {/* Angle arc overlay representing displacement */}
        {Math.abs(state.theta) > 0.01 && (
          <path
            d={`
              M ${pivotX} ${pivotY + 40}
              A 40 40 0 ${Math.abs(state.theta) > Math.PI ? 1 : 0} ${state.theta > 0 ? 1 : 0}
              ${pivotX + 40 * Math.sin(state.theta)} ${pivotY + 40 * Math.cos(state.theta)}
            `}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.5"
            opacity="0.7"
          />
        )}

        {/* --- Motion Trail --- */}
        {trail.length > 1 && (
          <path
            d={`M ${trail.map(p => `${p.x} ${p.y}`).join(" L ")}`}
            fill="none"
            stroke="#818cf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
          />
        )}

        {/* --- Pendulum String (Line) --- */}
        <line
          x1={pivotX}
          y1={pivotY}
          x2={bobX}
          y2={bobY}
          stroke="#64748b"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="transition-all duration-75"
        />

        {/* --- Force Vectors Overlay --- */}
        {showForces.gravity && (
          <g>
            <line
              x1={bobX}
              y1={bobY}
              x2={bobX}
              y2={gravityVectorY}
              stroke="#ef4444"
              strokeWidth="2.5"
              markerEnd="url(#arrow-gravity)"
            />
            <text x={bobX + 8} y={gravityVectorY} fill="#ef4444" fontSize="10" fontFamily="monospace">
              P (mg)
            </text>
          </g>
        )}

        {showForces.tension && (
          <g>
            <line
              x1={bobX}
              y1={bobY}
              x2={tensionVectorX}
              y2={tensionVectorY}
              stroke="#4f46e5"
              strokeWidth="2.5"
              markerEnd="url(#arrow-tension)"
            />
            <text x={tensionVectorX + 8} y={tensionVectorY - 4} fill="#4f46e5" fontSize="10" fontFamily="monospace">
              T
            </text>
          </g>
        )}

        {showForces.velocity && Math.abs(state.omega) > 0.05 && (
          <g>
            <line
              x1={bobX}
              y1={bobY}
              x2={velVectorX}
              y2={velVectorY}
              stroke="#f59e0b"
              strokeWidth="2.5"
              markerEnd="url(#arrow-velocity)"
            />
            <text x={velVectorX + 8} y={velVectorY} fill="#f59e0b" fontSize="10" fontFamily="monospace">
              v (L&omega;)
            </text>
          </g>
        )}

        {/* --- Pivot Base --- */}
        <rect
          x={pivotX - 30}
          y={pivotY - 8}
          width="60"
          height="8"
          rx="2"
          fill="#1e293b"
        />
        <circle
          cx={pivotX}
          cy={pivotY}
          r="6"
          fill="#475569"
          stroke="#0f172a"
          strokeWidth="1.5"
        />

        {/* --- Bob (Mass) --- */}
        <circle
          cx={bobX}
          cy={bobY}
          r={10 + params.mass * 2} // Size scales with mass
          fill={isDragging ? "#f59e0b" : "#4f46e5"}
          stroke={isDragging ? "#b45309" : "#3730a3"}
          strokeWidth="2.5"
          className="cursor-grab active:cursor-grabbing hover:brightness-110 touch-none shadow-sm"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          id="pendulum-bob"
        />
      </svg>
      
      {/* Dynamic string tension explanation */}
      <div className="text-[10px] text-slate-500 font-mono mt-1 text-center select-none">
        Clique e arraste a esfera para ajustar o ângulo inicial
      </div>
    </div>
  );
}
