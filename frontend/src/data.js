// src/data.js — hardcoded verified research data and computed values
import nasaFullData from './data/nasa_capacity_full.json';
import stressRaw    from './data/stress_violations_real.json';

export const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12.3];

const RAW_CAPS = {
  BMP_cell1: [17.24,17.18,17.14,17.11,17.08,17.06,17.04,17.03,17.01,17.00,16.93,16.88,16.80],
  BMP_cell2: [17.27,17.22,17.18,17.15,17.12,17.10,17.08,17.06,17.04,17.03,16.97,16.91,16.84],
  BMR_cell1: [17.22,17.18,17.05,16.88,16.58,16.39,16.14,15.86,15.74,15.67,15.30,15.05,14.81],
  BMR_cell2: [17.24,17.19,16.93,16.56,16.47,16.38,16.27,15.76,15.44,15.42,14.30,14.77,14.67],
  SPM_cell1: [17.27,17.25,17.23,17.21,17.19,17.18,17.17,17.16,17.14,17.09,17.00,16.95,16.90],
  SPM_cell2: [17.26,17.24,17.22,17.20,17.18,17.16,17.15,17.14,17.13,17.08,16.99,16.93,16.85],
};

const CELL_META = [
  { id: 'BMP_cell1', label: 'BMP Cell 1', strategy: 'BMP', color: '#1d4ed8' },
  { id: 'BMP_cell2', label: 'BMP Cell 2', strategy: 'BMP', color: '#60a5fa' },
  { id: 'BMR_cell1', label: 'BMR Cell 1', strategy: 'BMR', color: '#b91c1c' },
  { id: 'BMR_cell2', label: 'BMR Cell 2', strategy: 'BMR', color: '#f87171' },
  { id: 'SPM_cell1', label: 'SPM Cell 1', strategy: 'SPM', color: '#15803d' },
  { id: 'SPM_cell2', label: 'SPM Cell 2', strategy: 'SPM', color: '#4ade80' },
];

function linReg(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

// Full-trajectory OLS projection (same method as the paper's reference fit).
// Anchors the trend through all observed points, not just the endpoints.
function buildProjection(caps, months) {
  const { slope, intercept } = linReg(months, caps);
  const lastMonth = months[months.length - 1];
  const pts = [];
  for (let m = lastMonth; m <= 25.01; m += 0.5) {
    pts.push({ month: parseFloat(m.toFixed(1)), capacity: parseFloat((slope * m + intercept).toFixed(3)) });
  }
  return pts;
}

// Paper-verified total predicted life (months from experiment start).
// Method: full-trajectory OLS on the paper's complete dataset (Dinmohammadi et al.).
// Sentinel 9999 = projected EOL is beyond a practical planning horizon — display as no-EOL.
const PAPER_RUL = {
  BMP_cell1: 9999,
  BMP_cell2: 9999,
  BMR_cell1: 17.9,
  BMR_cell2: 16.6,
  SPM_cell1: 9999,
  SPM_cell2: 9999,
};

function buildStressEntry(d) {
  const alerts = [];
  if (d.overvoltage > 0) {
    alerts.push({
      type: 'Overvoltage',
      severity: d.overvoltage > 10000 ? 'High' : 'Low',
      count: d.overvoltage,
      message: d.overvoltage > 10000
        ? `Voltage exceeded 4.20 V in ${d.overvoltage.toLocaleString()} readings — upper limit consistently breached`
        : `Voltage briefly exceeded 4.20 V in ${d.overvoltage.toLocaleString()} readings`,
    });
  }
  if (d.undervoltage > 0) {
    alerts.push({
      type: 'Undervoltage',
      severity: d.undervoltage > 10000 ? 'High' : 'Medium',
      count: d.undervoltage,
      message: d.undervoltage > 10000
        ? `Voltage fell below 2.70 V in ${d.undervoltage.toLocaleString()} readings — deep discharge events`
        : `Voltage dipped below 2.70 V in ${d.undervoltage.toLocaleString()} readings`,
    });
  }
  if (d.overtemperature > 0) {
    alerts.push({
      type: 'Overtemperature',
      severity: 'Low',
      count: d.overtemperature,
      message: `Temperature exceeded 40°C in ${d.overtemperature} reading${d.overtemperature !== 1 ? 's' : ''}`,
    });
  }
  return {
    alerts,
    summary: {
      maxVoltage: d.max_V,
      minVoltage: d.min_V,
      maxCurrent: d.max_I_A,
      avgTemp:    d.avg_T_C,
      maxTemp:    d.max_T_C,
    },
  };
}

const STRESS_DATA = Object.fromEntries(
  Object.entries(stressRaw).map(([id, d]) => [id, buildStressEntry(d)])
);

const DEGRADATION_DRIVERS = {
  BMP_cell1: { tempContribution: 0.52, cRateContribution: 0.89, doDContribution: 1.21, avgTemp: 24.5, avgCRate: 0.52, avgDoD: 68.4, tempScore: 2, cRateScore: 3, doDScore: 4 },
  BMP_cell2: { tempContribution: 0.48, cRateContribution: 0.82, doDContribution: 1.15, avgTemp: 25.0, avgCRate: 0.54, avgDoD: 67.8, tempScore: 2, cRateScore: 3, doDScore: 4 },
  BMR_cell1: { tempContribution: 3.21, cRateContribution: 5.87, doDContribution: 4.92, avgTemp: 28.9, avgCRate: 1.23, avgDoD: 89.3, tempScore: 6, cRateScore: 8, doDScore: 7 },
  BMR_cell2: { tempContribution: 3.76, cRateContribution: 6.42, doDContribution: 4.72, avgTemp: 30.1, avgCRate: 1.31, avgDoD: 91.2, tempScore: 7, cRateScore: 9, doDScore: 7 },
  SPM_cell1: { tempContribution: 0.21, cRateContribution: 0.38, doDContribution: 0.55, avgTemp: 23.7, avgCRate: 0.31, avgDoD: 62.4, tempScore: 1, cRateScore: 2, doDScore: 2 },
  SPM_cell2: { tempContribution: 0.24, cRateContribution: 0.41, doDContribution: 0.72, avgTemp: 23.9, avgCRate: 0.33, avgDoD: 63.8, tempScore: 1, cRateScore: 2, doDScore: 2 },
};

function buildCells() {
  return CELL_META.map(meta => {
    const caps = RAW_CAPS[meta.id];
    const c0 = caps[0];
    const eolCap = parseFloat((c0 * 0.8).toFixed(3));
    const endCap = caps[caps.length - 1];
    const sohEnd = parseFloat((endCap / c0 * 100).toFixed(1));
    const fadePct = parseFloat(((c0 - endCap) / c0 * 100).toFixed(2));
    const fadePerMonth = (c0 - endCap) / MONTHS[MONTHS.length - 1];
    const rulMonths = PAPER_RUL[meta.id];
    const status =
      (sohEnd < 86 || (rulMonths < 9999 && rulMonths < 6)) ? 'Critical' :
      (sohEnd < 96 || (rulMonths < 9999 && rulMonths < 24)) ? 'Warning' :
      'Healthy';

    const actual = caps.map((c, i) => ({
      month: MONTHS[i],
      capacity: c,
      soh: parseFloat((c / c0 * 100).toFixed(2)),
    }));

    return {
      ...meta,
      caps,
      c0,
      eolCap,
      endCap,
      sohEnd,
      fadePct,
      fadePerMonth,
      rulMonths,
      status,
      startCap: c0,
      eolCapCell: eolCap,
      actual,
      projection: buildProjection(caps, MONTHS),
      stress: STRESS_DATA[meta.id],
      drivers: DEGRADATION_DRIVERS[meta.id],
    };
  });
}

export const CELLS = buildCells();

export const CHART_SERIES = CELLS.map(cell => ({
  id: cell.id,
  label: cell.label,
  color: cell.color,
  strategy: cell.strategy,
  actual: cell.actual,
  projection: cell.projection,
}));

// Average EOL cap across all Oxford cells (they differ by < 0.05 Ah)
export const EOL_CAP = parseFloat(
  (CELLS.reduce((s, c) => s + c.eolCap, 0) / CELLS.length).toFixed(2)
);

// ── Benchmark RMSE data (verified from Colab) ──────────────────────────────

export const OXFORD_RMSE = {
  perCell: {
    BMP_cell1: { Linear: 0.034, Polynomial: 0.103, Exponential: 0.086, RandomForest: 0.142, GPR: 0.131 },
    BMP_cell2: { Linear: 0.023, Polynomial: 0.075, Exponential: 0.064, RandomForest: 0.125, GPR: 0.099 },
    BMR_cell1: { Linear: 0.390, Polynomial: 0.133, Exponential: 0.390, RandomForest: 0.852, GPR: 0.426 },
    BMR_cell2: { Linear: 0.381, Polynomial: 0.279, Exponential: 0.381, RandomForest: 0.892, GPR: 0.161 },
    SPM_cell1: { Linear: 0.087, Polynomial: 0.118, Exponential: 0.114, RandomForest: 0.137, GPR: 0.182 },
    SPM_cell2: { Linear: 0.076, Polynomial: 0.121, Exponential: 0.076, RandomForest: 0.134, GPR: 0.183 },
  },
  mean: { Linear: 0.165, Polynomial: 0.138, Exponential: 0.185, RandomForest: 0.380, GPR: 0.197 },
};

export const NASA_RMSE = {
  perCell: {
    B0005: { Linear: 0.031, Polynomial: 0.167, Exponential: 0.031, RandomForest: 0.078, GPR: 0.219 },
    B0006: { Linear: 0.117, Polynomial: 0.027, Exponential: 0.032, RandomForest: 0.112, GPR: 0.395 },
    B0007: { Linear: 0.042, Polynomial: 0.111, Exponential: 0.042, RandomForest: 0.067, GPR: 0.060 },
    B0018: { Linear: 0.081, Polynomial: 0.095, Exponential: 0.081, RandomForest: 0.053, GPR: 0.243 },
  },
  mean: { Linear: 0.068, Polynomial: 0.100, Exponential: 0.047, RandomForest: 0.077, GPR: 0.229 },
};

export const MODELS = ['Linear', 'Polynomial', 'Exponential', 'RandomForest', 'GPR'];

export const MODEL_DESCRIPTIONS = {
  Linear:       'Assumes steady, constant decline — works well on slow cells, fails on fast-degrading ones',
  Polynomial:   'Follows curve-shaped trends — best overall on Oxford dataset',
  Exponential:  'Smooth accelerating decay — best overall on NASA dataset',
  RandomForest: 'Pattern matching — cannot predict beyond observed range (catastrophic on fast BMR cells)',
  GPR:          'Probabilistic — flexible but can overfit noise in short datasets',
};

export const MODEL_COLORS = {
  Linear:       '#3b82f6',
  Polynomial:   '#8b5cf6',
  Exponential:  '#f59e0b',
  RandomForest: '#ef4444',
  GPR:          '#10b981',
};

// ── NASA PCoE capacity data ────────────────────────────────────────────────
// Representative values sampled from the raw NASA dataset at ~10-20 cycle intervals.
// Spikes at cycles 20 (B0005) and 40 (B0006) represent real electrochemical
// capacity regeneration events, not data errors.

export const NASA_CELLS_DATA = [
  {
    id: 'B0005', label: 'B0005', color: '#3b82f6',
    initialCap: 1.856, finalCap: 1.325, totalCycles: 168, fadePct: 28.6,
    eolCap: parseFloat((1.856 * 0.70).toFixed(3)),
    data: nasaFullData.B0005,
  },
  {
    id: 'B0006', label: 'B0006', color: '#ef4444',
    initialCap: 2.035, finalCap: 1.186, totalCycles: 168, fadePct: 41.7,
    eolCap: parseFloat((2.035 * 0.70).toFixed(3)),
    data: nasaFullData.B0006,
  },
  {
    id: 'B0007', label: 'B0007', color: '#22c55e',
    initialCap: 1.891, finalCap: 1.432, totalCycles: 168, fadePct: 24.3,
    eolCap: parseFloat((1.891 * 0.70).toFixed(3)),
    data: nasaFullData.B0007,
  },
  {
    id: 'B0018', label: 'B0018', color: '#f59e0b',
    initialCap: 1.855, finalCap: 1.341, totalCycles: 132, fadePct: 27.7,
    eolCap: parseFloat((1.855 * 0.70).toFixed(3)),
    data: nasaFullData.B0018,
  },
];
