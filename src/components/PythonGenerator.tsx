import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { SimulationParams } from "../types";
import { generatePythonCode } from "../physics";

interface PythonGeneratorProps {
  params: SimulationParams;
  initialTheta: number;
  initialOmega: number;
}

export default function PythonGenerator({
  params,
  initialTheta,
  initialOmega,
}: PythonGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const pythonCode = React.useMemo(() => {
    return generatePythonCode(params, initialTheta, initialOmega);
  }, [params, initialTheta, initialOmega]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm" id="python-generator-panel">
      {/* Code window header */}
      <div className="flex items-center justify-between bg-slate-50 px-5 py-3 border-b border-slate-200 select-none">
        <div className="flex items-center space-x-2">
          {/* Mac-style window dots */}
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
          </div>
          <span className="text-slate-300 px-2">|</span>
          <div className="flex items-center space-x-1.5 text-slate-700 font-mono text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5 text-indigo-600" />
            <span>simulacao_pendulo.py</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            copied
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
          }`}
          id="copy-python-code-btn"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copiar Código</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents block with visual highlighting */}
      <div className="relative flex-1 bg-slate-50 p-5 overflow-auto max-h-[420px] font-mono text-xs leading-relaxed text-slate-800 border-b border-slate-200">
        <pre className="whitespace-pre select-all text-slate-800">
          {pythonCode}
        </pre>
      </div>

      {/* Guide Footer */}
      <div className="bg-slate-50/50 p-4 flex items-start gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg mt-0.5">
          <Terminal className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Como executar localmente?</h4>
          <p className="text-xs text-slate-500 leading-normal">
            Este código é totalmente autônomo. Ele sincroniza os parâmetros definidos nos controles acima em tempo real! Para executá-lo, instale as dependências científicas e execute o arquivo:
          </p>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 font-semibold my-2 select-all flex items-center justify-between shadow-sm">
            <span>pip install numpy matplotlib</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 font-semibold my-2 select-all flex items-center justify-between shadow-sm">
            <span>python simulacao_pendulo.py</span>
          </div>
          <p className="text-[10px] text-amber-700 bg-amber-50/50 p-2.5 border border-amber-100 rounded-lg italic font-mono mt-2 leading-relaxed">
            * O código inclui uma simulação de animação física dinâmica utilizando o matplotlib.animation.FuncAnimation.
          </p>
        </div>
      </div>
    </div>
  );
}
