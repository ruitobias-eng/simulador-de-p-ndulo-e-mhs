import { SimulationParams, SimulationState, DataPoint } from "./types";

// Physics solver using Runge-Kutta 4th Order (RK4) for the full non-linear equation:
// d^2(theta)/dt^2 = - (g / L) * sin(theta) - (b / m) * d(theta)/dt
export function getDerivatives(
  theta: number,
  omega: number,
  params: SimulationParams
): { dTheta: number; dOmega: number } {
  const { length, gravity, damping, mass, smallAngleApprox } = params;
  
  // Under small-angle approximation, sin(theta) is replaced by theta
  const restoringForceTerm = smallAngleApprox 
    ? theta 
    : Math.sin(theta);

  const dTheta = omega;
  const dOmega = - (gravity / length) * restoringForceTerm - (damping / mass) * omega;

  return { dTheta, dOmega };
}

export function rk4Step(
  state: SimulationState,
  dt: number,
  params: SimulationParams
): SimulationState {
  const { theta, omega, time } = state;

  // k1
  const k1 = getDerivatives(theta, omega, params);

  // k2
  const theta2 = theta + 0.5 * dt * k1.dTheta;
  const omega2 = omega + 0.5 * dt * k1.dOmega;
  const k2 = getDerivatives(theta2, omega2, params);

  // k3
  const theta3 = theta + 0.5 * dt * k2.dTheta;
  const omega3 = omega + 0.5 * dt * k2.dOmega;
  const k3 = getDerivatives(theta3, omega3, params);

  // k4
  const theta4 = theta + dt * k3.dTheta;
  const omega4 = omega + dt * k3.dOmega;
  const k4 = getDerivatives(theta4, omega4, params);

  const nextTheta = theta + (dt / 6) * (k1.dTheta + 2 * k2.dTheta + 2 * k3.dTheta + k4.dTheta);
  const nextOmega = omega + (dt / 6) * (k1.dOmega + 2 * k2.dOmega + 2 * k3.dOmega + k4.dOmega);

  // Normalize theta to keep it within [-PI, PI] for coordinate plotting
  // (though in continuous graphs, we may want to allow wrapping or clamp it depending on context)
  let normalizedTheta = nextTheta;
  while (normalizedTheta > Math.PI) normalizedTheta -= 2 * Math.PI;
  while (normalizedTheta < -Math.PI) normalizedTheta += 2 * Math.PI;

  return {
    theta: nextTheta, // Return actual accumulated theta for continuous plotting
    omega: nextOmega,
    time: time + dt,
  };
}

// Calculate the kinetic energy: Ec = 0.5 * m * v^2 = 0.5 * m * (L * omega)^2
export function getKineticEnergy(omega: number, params: SimulationParams): number {
  const { mass, length } = params;
  const linearVelocity = length * omega;
  return 0.5 * mass * linearVelocity * linearVelocity;
}

// Calculate potential energy relative to the lowest point: Ep = m * g * h = m * g * L * (1 - cos(theta))
export function getPotentialEnergy(theta: number, params: SimulationParams): number {
  const { mass, gravity, length } = params;
  return mass * gravity * length * (1 - Math.cos(theta));
}

// Generates the Python code dynamically reflecting the current UI settings
export function generatePythonCode(
  params: SimulationParams,
  initialTheta: number,
  initialOmega: number,
  tMax: number = 20.0,
  dt: number = 0.01
): string {
  const { length, mass, gravity, damping, smallAngleApprox } = params;
  
  // Format numbers neatly
  const L_val = length.toFixed(2);
  const m_val = mass.toFixed(2);
  const g_val = gravity.toFixed(2);
  const b_val = damping.toFixed(3);
  const t_val = initialTheta.toFixed(4);
  const o_val = initialOmega.toFixed(4);
  const dt_val = dt.toFixed(3);
  const tMax_val = tMax.toFixed(1);

  return `import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

# ==============================================================================
#                 PARÂMETROS FÍSICOS DO SISTEMA (ALTERE AQUI)
# ==============================================================================
# Você pode modificar as variáveis abaixo para testar diferentes condições:
L = ${L_val}       # Comprimento do fio do pêndulo (metros)
m = ${m_val}       # Massa do corpo/bob (quilogramas)
g = ${g_val}       # Aceleração da gravidade (m/s^2) - ex: 9.81 (Terra), 1.62 (Lua)
b = ${b_val}       # Coeficiente de amortecimento/atrito (kg/s) - 0.0 para pêndulo ideal
theta_0 = ${t_val} # Ângulo inicial em radianos (ex: np.radians(45) para 45 graus)
omega_0 = ${o_val} # Velocidade angular inicial em radianos por segundo (rad/s)

# Parâmetros de tempo da simulação:
t_max = ${tMax_val}    # Tempo total de duração da simulação (segundos)
dt = ${dt_val}       # Passo de tempo (resolução temporal do integrador)
# ==============================================================================

# Criação do vetor de tempo
t = np.arange(0, t_max, dt)
n_steps = len(t)

# Inicialização dos vetores de estado
theta = np.zeros(n_steps)
omega = np.zeros(n_steps)

theta[0] = theta_0
omega[0] = omega_0

# Integrador Numérico: Método de Runge-Kutta de 4ª Ordem (RK4)
# Extremamente estável e preciso para simular sistemas mecânicos.
for i in range(1, n_steps):
    th = theta[i-1]
    om = omega[i-1]
    
    # Função auxiliar para as derivadas: [d_theta/dt, d_omega/dt]
    # Se você quiser ativar a aproximação de pequenos ângulos, mude np.sin(th) para th
    def derivatives(th_val, om_val):
        d_theta = om_val
        # d_omega/dt = - (g/L) * sin(theta) - (b/m) * omega
        ${smallAngleApprox ? 'd_omega = - (g / L) * th_val - (b / m) * om_val  # Aproximação linear ativa' : 'd_omega = - (g / L) * np.sin(th_val) - (b / m) * om_val  # Equação não-linear exata'}
        return d_theta, d_omega

    # Passo RK4
    k1_th, k1_om = derivatives(th, om)
    
    k2_th, k2_om = derivatives(th + 0.5 * dt * k1_th, om + 0.5 * dt * k1_om)
    k3_th, k3_om = derivatives(th + 0.5 * dt * k2_th, om + 0.5 * dt * k2_om)
    k4_th, k4_om = derivatives(th + dt * k3_th, om + dt * k3_om)
    
    theta[i] = th + (dt / 6.0) * (k1_th + 2 * k2_th + 2 * k3_th + k4_th)
    omega[i] = om + (dt / 6.0) * (k1_om + 2 * k2_om + 2 * k3_om + k4_om)

# Cálculo de energias ao longo do tempo
v = L * omega                                # Velocidade linear (v = L * omega)
E_cinetica = 0.5 * m * (v**2)                # Ec = 1/2 * m * v^2
E_potencial = m * g * L * (1 - np.cos(theta)) # Ep = m * g * h
E_total = E_cinetica + E_potencial           # Emec = Ec + Ep

# ==============================================================================
#            PLOTAGEM DOS GRÁFICOS E ANÁLISE COMPORTAMENTAL
# ==============================================================================
fig, axs = plt.subplots(2, 2, figsize=(12, 8))
fig.suptitle("Simulação Física do Pêndulo Simples - Análise Científica", fontsize=16, fontweight='bold')

# 1. Ângulo e Velocidade Angular ao longo do tempo
axs[0, 0].plot(t, np.degrees(theta), 'b-', label='Ângulo θ (Graus)', linewidth=2)
axs[0, 0].plot(t, omega, 'r--', label='Vel. Angular ω (rad/s)', linewidth=1.5)
axs[0, 0].set_title("Evolução Temporal do Estado", fontsize=12, fontweight='bold')
axs[0, 0].set_xlabel("Tempo (s)", fontsize=10)
axs[0, 0].set_ylabel("Amplitude", fontsize=10)
axs[0, 0].grid(True, linestyle=':', alpha=0.6)
axs[0, 0].legend()

# 2. Espaço de Fase: Velocidade Angular vs Ângulo
# Mostra trajetórias fechadas (sem atrito) ou espirais em direção ao repouso (com atrito)
axs[0, 1].plot(theta, omega, 'g-', linewidth=2, color='#2ca02c')
axs[0, 1].plot(theta_0, omega_0, 'ro', label='Estado Inicial')
axs[0, 1].set_title("Espaço de Fase (Retrato de Fase)", fontsize=12, fontweight='bold')
axs[0, 1].set_xlabel("Ângulo θ (rad)", fontsize=10)
axs[0, 1].set_ylabel("Velocidade Angular ω (rad/s)", fontsize=10)
axs[0, 1].grid(True, linestyle=':', alpha=0.6)
axs[0, 1].legend()

# 3. Energias do Sistema
axs[1, 0].plot(t, E_cinetica, 'r-', label='Cinética (Ec)', alpha=0.8)
axs[1, 0].plot(t, E_potencial, 'b-', label='Potencial (Ep)', alpha=0.8)
axs[1, 0].plot(t, E_total, 'k-', label='Mecânica Total (Emec)', linewidth=2)
axs[1, 0].set_title("Conservação e Dissipação de Energia", fontsize=12, fontweight='bold')
axs[1, 0].set_xlabel("Tempo (s)", fontsize=10)
axs[1, 0].set_ylabel("Energia (Joules)", fontsize=10)
axs[1, 0].grid(True, linestyle=':', alpha=0.6)
axs[1, 0].legend()

# 4. Painel de Anotações Físicas
axs[1, 1].axis('off')
info_text = (
    f"Parâmetros Físicos:\\n"
    f"--------------------\\n"
    f"Comprimento (L): {L} m\\n"
    f"Massa (m): {m} kg\\n"
    f"Gravidade (g): {g} m/s²\\n"
    f"Coef. Amortecimento (b): {b} kg/s\\n"
    f"Frequência Natural (ω0): {np.sqrt(g/L):.3f} rad/s\\n"
    f"Período Linear (T): {2*np.pi*np.sqrt(L/g):.3f} s\\n\\n"
    f"Estado Inicial:\\n"
    f"--------------------\\n"
    f"Ângulo Inicial: {np.degrees(theta_0):.1f}° ({theta_0:.3f} rad)\\n"
    f"Velocidade Inicial: {omega_0} rad/s"
)
axs[1, 1].text(0.1, 0.9, info_text, transform=axs[1, 1].transAxes, fontsize=11,
              verticalalignment='top', family='monospace',
              bbox=dict(boxstyle='round,pad=0.5', facecolor='#f8f9fa', edgecolor='#dee2e6'))

plt.tight_layout()

# ==============================================================================
#              CRIAÇÃO DA ANIMAÇÃO INTERATIVA (PÊNDULO EM SI)
# ==============================================================================
# Criação de uma segunda janela para rodar a animação física em tempo real
anim_fig, anim_ax = plt.subplots(figsize=(6, 6))
anim_ax.set_xlim(-L * 1.2, L * 1.2)
anim_ax.set_ylim(-L * 1.3, L * 0.3)
anim_ax.set_aspect('equal')
anim_ax.grid(True, linestyle='--', alpha=0.4)
anim_ax.set_title("Animação Física do Pêndulo", fontsize=12, fontweight='bold')

# Elementos visuais da animação
suporte, = anim_ax.plot([0], [0], 'ko', markersize=10, label="Suporte Fixo")
fio, = anim_ax.plot([], [], 'k-', linewidth=2, color='#4a4a4a')
corpo, = anim_ax.plot([], [], 'ro', markersize=20, color='#d63031', label="Massa (Bob)")
tempo_texto = anim_ax.text(0.05, 0.95, '', transform=anim_ax.transAxes, family='monospace')

def init_anim():
    fio.set_data([], [])
    corpo.set_data([], [])
    tempo_texto.set_set_text('')
    return fio, corpo, tempo_texto

def animate(frame_idx):
    # Encontra as coordenadas cartesianas da massa
    angle = theta[frame_idx]
    x = L * np.sin(angle)
    y = -L * np.cos(angle)
    
    fio.set_data([0, x], [0, y])
    corpo.set_data([x], [y])
    tempo_texto.set_text(f"Tempo: {t[frame_idx]:.2f}s\\nÂngulo: {np.degrees(angle):.1f}°")
    return fio, corpo, tempo_texto

# Cria a animação. interval é o tempo em ms entre cada frame (corresponde a dt)
# O parâmetro blit melhora o desempenho redesenhando apenas o que mudou.
# Reduzimos o número de frames para animar de forma fluida dependendo de dt
step_ratio = max(1, int(0.02 / dt)) # Tenta manter ~50 FPS na animação
frames_to_anim = range(0, n_steps, step_ratio)

ani = FuncAnimation(
    anim_fig, 
    animate, 
    frames=frames_to_anim,
    init_func=init_anim, 
    interval=int(dt * step_ratio * 1000), 
    blit=True,
    repeat=True
)

anim_ax.legend(loc='lower right')
plt.show()
`;
}
