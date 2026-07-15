export interface SimulationParams {
  length: number;      // Length of pendulum string (m)
  mass: number;        // Mass of bob (kg)
  gravity: number;     // Gravity (m/s^2)
  damping: number;     // Damping coefficient (kg/s)
  smallAngleApprox: boolean; // Compare with linear model
}

export interface SimulationState {
  theta: number;       // Angle from vertical (rad)
  omega: number;       // Angular velocity (rad/s)
  time: number;        // Elapsed time (s)
}

export interface DataPoint {
  time: number;
  theta: number;
  thetaLinear: number; // For comparison
  omega: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
}
