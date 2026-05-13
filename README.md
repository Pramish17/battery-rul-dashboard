# Battery RUL Dashboard

A web dashboard for visualising the remaining useful life (RUL) of lithium-ion batteries, built using data from the Oxford Energy Trading Battery Degradation dataset.

The dataset comes from a year-long experiment at EnergyVille, Belgium, where 6 Kokam 16 Ah cells were cycled using three different trading strategies for stationary batteries in the Belgian day-ahead energy market.

---

## What it shows

- Current capacity and state of health (SOH) for each of the 6 cells
- How quickly each cell is degrading depending on which charging strategy it followed
- Estimated time remaining before each cell reaches end of life (80% of nominal capacity)
- Capacity fade charts with projections extrapolated beyond the observed period

The most interesting finding: the revenue-maximising strategy (BMR) degrades batteries **8.9× faster** than the single particle model strategy (SPM), because it uses the full voltage range of the cell.

---

## Stack

- **Backend** — Python, Flask, pandas, scipy
- **Frontend** — React, Recharts
- **Data** — Oxford ORA dataset (Reniers et al., 2020)

---

## Running locally

You'll need Python 3 and Node.js installed.

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install flask flask-cors pandas numpy scipy
python3 app.py
```

The API runs on `http://localhost:5001`

**Frontend**
```bash
cd frontend
npm install
npm start
```

The dashboard opens at `http://localhost:3000`

---

## Data

The capacity CSV files are included in the `backend/` folder. They come from the Oxford Research Archive:

> Reniers, J., Mulder, G., Howey, D. (2020). *Battery degradation data for energy trading with physical models*. University of Oxford. https://doi.org/10.5287/bodleian:KGBqbZ9Xo

---

## Project context

This dashboard is part of a broader research project on predictive maintenance and explainable AI for energy systems. The main project focuses on the NASA C-MAPSS turbofan engine dataset and involves a CNN-LSTM model with SHAP-based explainability and cyber-physical resilience testing.
