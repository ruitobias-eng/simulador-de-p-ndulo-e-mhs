# 🧭 Laboratório de Física Computacional: Simulador de Pêndulo & MHS

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

Um laboratório virtual interativo e de alta fidelidade científica projetado para explorar o **Movimento Harmônico Simples (MHS)** e as oscilações não-lineares exatas de um pêndulo simples. O simulador utiliza o algoritmo de integração numérica de **Runge-Kutta de 4ª Ordem (RK4)** para resolver as equações diferenciais subjacentes em tempo real, garantindo precisão e estabilidade física sem acúmulo artificial de energia.

---

## 🎨 Demonstração Visual & Design

O simulador foi desenvolvido com foco em acessibilidade e estética moderna de laboratório científico:
- **Interface Clean & Minimalista**: Paleta de cores baseada em tons suaves de cinza, azul-indigo e verde-esmeralda, facilitando a leitura de dados de longa duração.
- **HUD em Tempo Real**: Painel dinâmico mostrando o ângulo exato ($\theta$), velocidade angular ($\omega$), tempo decorrido ($t$) e velocidade tangencial ($v$).
- **Interação Direta**: Permite clicar e arrastar a esfera (bob) diretamente na tela para definir o ângulo inicial de forma intuitiva.

---

## 🚀 Principais Funcionalidades

1. **Simulação Física com RK4**: Resolução contínua da equação diferencial de segunda ordem não-linear exata do pêndulo amortecido.
2. **Visualização de Vetores de Força**: Exibição em tempo real das forças atuantes:
   - Força Peso (Gravidade)
   - Tensão do Fio
   - Vetor Velocidade Tangencial
3. **Análise Gráfica Avançada**:
   - **Gráfico de Estado**: Evolução temporal de $\theta(t)$ e $\omega(t)$ comparada em tempo real com a aproximação linear ideal do MHS.
   - **Gráfico de Energia**: Acompanhamento dinâmico da Energia Cinética ($E_c$), Energia Potencial ($E_p$) e a verificação da conservação da Energia Mecânica Total ($E_{mecanica}$).
   - **Espaço de Fase**: Retrato de fase mostrando a relação entre velocidade angular e posição ($\omega$ vs. $\theta$), evidenciando comportamentos periódicos estáveis e atratores de foco espiral com o amortecimento viscoso.
4. **Ambientes Pré-configurados**:
   - **Terra Ideal**: MHS clássico perfeito sem resistência do ar ($g = 9.81\text{ m/s}^2$).
   - **Pêndulo Lunar**: Gravidade reduzida ($g = 1.62\text{ m/s}^2$) para observar oscilações lentas de longo período.
   - **Fricção Viscosa**: Demonstração de dissipação de energia exponencial com amortecimento.
   - **Grande Amplitude**: Configuração extrema ($\theta_0 = 170^\circ$) para observar o desvio não-linear extremo em relação à aproximação simplificada de pequenos ângulos.
   - **Ausência de Gravidade**: Simulação de rotação livre no espaço sideral.
5. **Gerador de Código Python**: Sincronização em tempo real de todas as variáveis físicas definidas na interface para um script autônomo em Python pronto para execução local com animações físicas interativas baseadas em `matplotlib`.

---

## 🔬 Fundamentos Físicos

A dinâmica exata de um pêndulo simples amortecido de comprimento $L$, massa $m$ e coeficiente de amortecimento $b$ sob aceleração da gravidade $g$ é modelada pela equação diferencial de 2ª ordem não-linear:

$$\frac{d^2\theta}{dt^2} + \frac{b}{m} \frac{d\theta}{dt} + \frac{g}{L} \sin(\theta) = 0$$

### Integração Numérica (RK4)

Para garantir que a simulação computacional seja estável e não sofra com a acumulação artificial de energia (problema comum no método básico de Euler), o simulador divide a equação de segunda ordem em um sistema de duas equações de primeira ordem:

1. $\frac{d\theta}{dt} = \omega$
2. $\frac{d\omega}{dt} = -\frac{b}{m}\omega - \frac{g}{L}\sin(\theta)$

E aplica o método de **Runge-Kutta de 4ª Ordem (RK4)** com quatro amostragens de inclinação por passo temporal:

$$\begin{aligned}
k_1 &= f(t_n, y_n) \\
k_2 &= f\left(t_n + \frac{dt}{2}, y_n + \frac{dt}{2} k_1\right) \\
k_3 &= f\left(t_n + \frac{dt}{2}, y_n + \frac{dt}{2} k_2\right) \\
k_4 &= f(t_n + dt, y_n + dt \cdot k_3) \\
y_{n+1} &= y_n + \frac{dt}{6}(k_1 + 2k_2 + 2k_3 + k_4)
\end{aligned}$$

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [React 18](https://react.dev/) com TypeScript para componentização e tipagem estrita de variáveis.
- **Build Tool**: [Vite](https://vitejs.dev/) para empacotamento ultrarrápido.
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) com design totalmente responsivo e customizado.
- **Iconografia**: [Lucide React](https://lucide.dev/) para ícones minimalistas de alta resolução.
- **Renderização Gráfica**: SVG dinâmico de alta performance com redimensionamento responsivo para gráficos científicos e canvas físico.

---

## 💻 Instalação & Execução Local

### Pré-requisitos
Certifique-se de possuir o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Executando a Aplicação Web
1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_SEU_REPOSITORIO>
   cd <NOME_DO_DIRETORIO>
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.

---

## 🐍 Como Executar a Simulação em Python

O laboratório permite baixar ou copiar um script Python correspondente aos exatos parâmetros configurados na tela em tempo real.

### Pré-requisitos
Você precisará do Python 3 instalado e das bibliotecas científicas de computação:
```bash
pip install numpy matplotlib
```

### Executando o Script
Copie o código gerado no painel do aplicativo, cole em um arquivo chamado `simulacao_pendulo.py` e execute:
```bash
python simulacao_pendulo.py
```
Isso abrirá uma janela interativa do **Matplotlib** exibindo a animação física em tempo real sincronizada com gráficos de energia dinâmica e espaço de fase!

---

## 📝 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar, estudar, modificar e distribuir para fins educacionais e científicos.

---
Desenvolvido como projeto prático para a disciplina de **Física Computacional** e **Sistemas Dinâmicos**.
