import React from "react";
import { BookOpen, Award } from "lucide-react";

export default function TheorySection() {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-700 space-y-6 overflow-y-auto max-h-[580px]" id="theory-section-panel">
      {/* Title */}
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fundamentos Científicos & Computação Física</h3>
      </div>

      {/* Intro */}
      <p className="text-sm leading-relaxed text-slate-600">
        O estudo do pêndulo simples é um dos pilares mais importantes da mecânica clássica e da análise de sistemas dinâmicos. Ele serve como modelo fundamental para entender ressonâncias, oscilações acopladas, caos determinístico e o desenvolvimento de algoritmos de integração numérica.
      </p>

      {/* 1. Equações de Movimento */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          1. Equações Diferenciais do Movimento
        </h4>
        <p className="text-xs leading-relaxed text-slate-600">
          A força restauradora tangencial em uma massa em suspensão suspensa por um fio de comprimento <code className="font-mono text-indigo-600 font-semibold bg-slate-50 px-1 rounded">L</code> é decorrente da gravidade:
        </p>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono text-sm text-slate-800 font-semibold">
          F_tangencial = -m &middot; g &middot; sen(&theta;)
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          Pela Segunda Lei de Newton, a aceleração angular tangencial <code className="font-mono text-indigo-600 font-semibold bg-slate-50 px-1 rounded">&alpha; = d&sup2;&theta;/dt&sup2;</code> obedece à equação diferencial não-linear exata:
        </p>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono text-sm text-slate-800 font-semibold">
          d&sup2;&theta;/dt&sup2; + (b / m) &middot; d&theta;/dt + (g / L) &middot; sen(&theta;) = 0
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          Onde <code className="font-mono text-indigo-600 font-semibold bg-slate-50 px-1 rounded">b</code> é o coeficiente de amortecimento viscoso (resistência do ar) e <code className="font-mono text-indigo-600 font-semibold bg-slate-50 px-1 rounded">m</code> é a massa.
        </p>
      </div>

      {/* 2. Aproximação de Pequenos Ângulos */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
          2. Aproximação de Pequenos Ângulos (MHS)
        </h4>
        <p className="text-xs leading-relaxed text-slate-600">
          Para amplitudes muito pequenas (geralmente <code className="font-mono text-teal-600 font-semibold bg-slate-50 px-1 rounded">&theta; &lt; 15&deg;</code>), podemos aproximar <code className="font-mono text-slate-700">sen(&theta;) &approx; &theta;</code> (em radianos). Isso lineariza a equação do movimento, resultando no clássico <strong>Movimento Harmônico Simples (MHS)</strong>:
        </p>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono text-sm text-slate-800 font-semibold">
          d&sup2;&theta;/dt&sup2; + (b/m) &middot; d&theta;/dt + (g/L) &middot; &theta; = 0
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          Nesse limite ideal linear e sem amortecimento (<code className="font-mono text-slate-500">b=0</code>), o período <code className="font-mono text-teal-600 font-semibold bg-slate-50 px-1 rounded">T</code> da oscilação é <strong>independente da massa e do ângulo inicial</strong>:
        </p>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono text-sm text-slate-800 font-semibold">
          T = 2 &middot; &pi; &middot; &radic;(L / g)
        </div>
        <p className="text-xs leading-relaxed text-amber-600 font-medium italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
          * Ative os ambientes pré-definidos para comparar a curva simplificada linearizada (tracejado cinza) com a curva física exata (não-linear) no gráfico de Estado!
        </p>
      </div>

      {/* 3. Balanço de Energia */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          3. Conservação e Dissipação de Energia
        </h4>
        <p className="text-xs leading-relaxed text-slate-600">
          O sistema realiza continuamente a troca entre duas formas de energia:
        </p>
        <ul className="text-xs space-y-2 list-disc pl-5 text-slate-600">
          <li>
            <strong className="text-rose-600">Energia Cinética (Ec)</strong>: Associada à velocidade tangencial da massa. É máxima no ponto mais baixo (<code className="font-mono">&theta; = 0</code>). <code className="font-mono text-slate-700 bg-slate-50 px-1 rounded">Ec = 0.5 &middot; m &middot; (L &middot; &omega;)&sup2;</code>.
          </li>
          <li>
            <strong className="text-indigo-600">Energia Potencial Gravitacional (Ep)</strong>: Associada à altura <code className="font-mono">h</code> em relação ao ponto mais baixo. É máxima nas amplitudes extremas. <code className="font-mono text-slate-700 bg-slate-50 px-1 rounded">Ep = m &middot; g &middot; L &middot; (1 - cos(&theta;))</code>.
          </li>
          <li>
            <strong className="text-purple-600">Energia Mecânica Total (Emec)</strong>: É a soma <code className="font-mono text-slate-700 bg-slate-50 px-1 rounded">Emec = Ec + Ep</code>.
          </li>
        </ul>
        <p className="text-xs leading-relaxed text-slate-600">
          Em um pêndulo ideal (<code className="font-mono text-slate-500">b = 0</code>), a energia mecânica total permanece <strong>perfeitamente constante</strong>. Com amortecimento viscoso (<code className="font-mono text-slate-700 bg-slate-50 px-1 rounded">b &gt; 0</code>), a energia decai exponencialmente ao longo do tempo, sendo dissipada na forma de calor para o meio ambiente.
        </p>
      </div>

      {/* 4. Métodos de Integração Numérica */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          4. Integração de Runge-Kutta de 4ª Ordem (RK4)
        </h4>
        <p className="text-xs leading-relaxed text-slate-600">
          Para resolver a equação não-linear no computador, usamos aproximações discretas. O método clássico de Euler sofre de acumulação artificial de energia (fazendo o pêndulo oscilar cada vez mais alto com o tempo).
        </p>
        <p className="text-xs leading-relaxed text-slate-600">
          Esta simulação e o gerador de código Python implementam o método <strong>Runge-Kutta de 4ª Ordem (RK4)</strong>. O RK4 calcula quatro inclinações diferentes por passo de tempo <code className="font-mono">dt</code> (estimando as derivadas no início, meio e fim do passo) e faz uma média ponderada para avançar o estado físico. Isso fornece uma precisão de ordem <code className="font-mono text-slate-700 bg-slate-50 px-1 rounded">O(dt&sup4;)</code>, ideal para manter a estabilidade de longo prazo sem desvio energético espúrio.
        </p>
      </div>

      {/* Tips and icons */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 leading-relaxed">
        <div className="font-semibold text-slate-800 flex items-center gap-1">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Dicas Práticas para Exploração:</span>
        </div>
        <ul className="list-decimal pl-4 text-slate-600 space-y-1">
          <li>Ajuste o amortecimento para zero (<code className="font-mono">b = 0</code>) e mude para a aba de Energia para ver a conservação perfeita da energia mecânica total em linha reta roxa estável.</li>
          <li>Ative o "Espaço de Fase" e observe a órbita fechada oval. Em seguida, aumente gradualmente o amortecimento e repare na formação de uma espiral que converge para a origem (ponto atrator estável).</li>
          <li>Configure o ângulo inicial para um valor extremo como <code className="font-mono">160&deg;</code> e repare no atraso do período de oscilação físico frente ao linear!</li>
        </ul>
      </div>
    </div>
  );
}
