// src/data.js - hardcoded verified research data and computed values
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
// Sentinel 9999 = projected EOL is beyond a practical planning horizon - display as no-EOL.
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
        ? `Voltage exceeded 4.20 V in ${d.overvoltage.toLocaleString()} readings - upper limit consistently breached`
        : `Voltage briefly exceeded 4.20 V in ${d.overvoltage.toLocaleString()} readings`,
    });
  }
  if (d.undervoltage > 0) {
    alerts.push({
      type: 'Undervoltage',
      severity: d.undervoltage > 10000 ? 'High' : 'Medium',
      count: d.undervoltage,
      message: d.undervoltage > 10000
        ? `Voltage fell below 2.70 V in ${d.undervoltage.toLocaleString()} readings - deep discharge events`
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
// Method: chronological 70/30 train/test split per cell, RMSE on the held-out 30%.
// CNN-LSTM values are the mean over 5 random seeds (42, 7, 123, 2024, 99).
// Persistence = naive baseline (holds last training value flat).

export const OXFORD_RMSE = {
  perCell: {
    BMP_cell1: { 'CNN-LSTM': 0.076, Polynomial: 0.103, Linear: 0.034, Exponential: 0.086, GPR: 0.131, XGBoost: 0.133, RandomForest: 0.142, Persistence: 0.132 },
    BMP_cell2: { 'CNN-LSTM': 0.038, Polynomial: 0.075, Linear: 0.023, Exponential: 0.064, GPR: 0.099, XGBoost: 0.115, RandomForest: 0.125, Persistence: 0.114 },
    BMR_cell1: { 'CNN-LSTM': 0.258, Polynomial: 0.133, Linear: 0.390, Exponential: 0.390, GPR: 0.426, XGBoost: 0.748, RandomForest: 0.852, Persistence: 0.747 },
    BMR_cell2: { 'CNN-LSTM': 0.258, Polynomial: 0.279, Linear: 0.381, Exponential: 0.381, GPR: 0.161, XGBoost: 0.777, RandomForest: 0.892, Persistence: 0.776 },
    SPM_cell1: { 'CNN-LSTM': 0.054, Polynomial: 0.118, Linear: 0.087, Exponential: 0.114, GPR: 0.182, XGBoost: 0.131, RandomForest: 0.137, Persistence: 0.130 },
    SPM_cell2: { 'CNN-LSTM': 0.068, Polynomial: 0.121, Linear: 0.076, Exponential: 0.076, GPR: 0.183, XGBoost: 0.128, RandomForest: 0.134, Persistence: 0.126 },
  },
  mean: { 'CNN-LSTM': 0.125, Polynomial: 0.138, Linear: 0.165, Exponential: 0.185, GPR: 0.197, XGBoost: 0.339, RandomForest: 0.380, Persistence: 0.337 },
};

export const NASA_RMSE = {
  perCell: {
    B0005: { 'CNN-LSTM': 0.025, Polynomial: 0.167, Linear: 0.031, Exponential: 0.031, GPR: 0.219, XGBoost: 0.077, RandomForest: 0.078, Persistence: 0.075 },
    B0006: { 'CNN-LSTM': 0.097, Polynomial: 0.027, Linear: 0.117, Exponential: 0.032, GPR: 0.395, XGBoost: 0.112, RandomForest: 0.112, Persistence: 0.110 },
    B0007: { 'CNN-LSTM': 0.038, Polynomial: 0.111, Linear: 0.042, Exponential: 0.042, GPR: 0.060, XGBoost: 0.065, RandomForest: 0.067, Persistence: 0.064 },
    B0018: { 'CNN-LSTM': 0.051, Polynomial: 0.095, Linear: 0.081, Exponential: 0.081, GPR: 0.243, XGBoost: 0.049, RandomForest: 0.053, Persistence: 0.048 },
  },
  mean: { 'CNN-LSTM': 0.053, Polynomial: 0.100, Linear: 0.068, Exponential: 0.047, GPR: 0.229, XGBoost: 0.076, RandomForest: 0.077, Persistence: 0.074 },
};

export const MODELS = ['CNN-LSTM', 'Polynomial', 'Linear', 'Exponential', 'GPR', 'XGBoost', 'RandomForest', 'Persistence'];

// Persistence is a naive baseline, not a candidate model - rendered grey and
// excluded from #-rank numbering and (on Oxford) winner highlighting.
export const BASELINE_MODEL = 'Persistence';

export const MODEL_LABELS = {
  Persistence: 'Persistence (baseline)',
};

export const MODEL_DESCRIPTIONS = {
  'CNN-LSTM':   'Temporal deep learning - tied best on Oxford, 2nd on NASA; needs enough history (5-seed mean)',
  Linear:       'Assumes steady, constant decline - works well on slow cells, fails on fast-degrading ones',
  Polynomial:   'Follows curve-shaped trends - statistically tied for best on Oxford, but only 6th on NASA',
  Exponential:  'Smooth accelerating decay - best overall on NASA, 4th on Oxford',
  RandomForest: 'Pattern matching - cannot predict beyond observed range (catastrophic on fast BMR cells)',
  XGBoost:      'Gradient boosting - same extrapolation failure as Random Forest',
  GPR:          'Probabilistic - flexible but can overfit noise in short datasets',
  Persistence:  'Naive baseline - holds last value; beats both tree ensembles on NASA',
};

export const MODEL_COLORS = {
  'CNN-LSTM':   '#ec4899',
  Linear:       '#3b82f6',
  Polynomial:   '#8b5cf6',
  Exponential:  '#f59e0b',
  RandomForest: '#ef4444',
  XGBoost:      '#f97316',
  GPR:          '#10b981',
  Persistence:  '#6b7280',
};

// ── Rolling-origin robustness check (NASA only) ────────────────────────────
// Each model retrained on the first 50/60/70/80% of every NASA cell; entry is
// the best model at that forecast origin. Exponential is top-2 at every origin.

export const ROLLING_ORIGIN = [
  { origin: '50%', best: 'Linear' },
  { origin: '60%', best: 'Exponential' },
  { origin: '70%', best: 'Exponential' },
  { origin: '80%', best: 'CNN-LSTM' },
];

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
