import pandas as pd
import numpy as np
from scipy import stats
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CELLS = {
    'BMP_cell1': {'strategy': 'BMP', 'label': 'BMP Cell 1', 'color': '#378ADD'},
    'BMP_cell2': {'strategy': 'BMP', 'label': 'BMP Cell 2', 'color': '#85B7EB'},
    'BMR_cell1': {'strategy': 'BMR', 'label': 'BMR Cell 1', 'color': '#E24B4A'},
    'BMR_cell2': {'strategy': 'BMR', 'label': 'BMR Cell 2', 'color': '#F09595'},
    'SPM_cell1': {'strategy': 'SPM', 'label': 'SPM Cell 1', 'color': '#1D9E75'},
    'SPM_cell2': {'strategy': 'SPM', 'label': 'SPM Cell 2', 'color': '#5DCAA5'},
}

NOMINAL_CAP = 16.0
EOL_CAP     = 12.8

def load_all_cells():
    data = {}
    for cell_id, info in CELLS.items():
        path = os.path.join(BASE_DIR, f'{cell_id}_capacityData.csv')
        df   = pd.read_csv(path)
        df['time_months'] = df['time_s'] / 86400 / 30.44
        df['soh']         = (df['capacity_Ah'] / NOMINAL_CAP) * 100
        df['cell_id']     = cell_id
        df['strategy']    = info['strategy']
        df['color']       = info['color']
        df['label']       = info['label']
        data[cell_id]     = df
    return data

def compute_metrics(df):
    start_cap = df['capacity_Ah'].iloc[0]
    end_cap   = df['capacity_Ah'].iloc[-1]
    x = df['time_months'].values
    y = df['capacity_Ah'].values

    slope, intercept, r, _, _ = stats.linregress(x, y)

    fade_pct       = ((start_cap - end_cap) / start_cap) * 100
    fade_per_month = abs(slope)
    soh_end        = (end_cap / NOMINAL_CAP) * 100

    if slope < 0:
        months_to_eol = (end_cap - EOL_CAP) / fade_per_month
    else:
        months_to_eol = 9999

    if soh_end < 93:
        status = 'Critical'
    elif soh_end < 96:
        status = 'Warning'
    else:
        status = 'Healthy'

    return {
        'startCap':      round(start_cap, 3),
        'endCap':        round(end_cap, 3),
        'sohEnd':        round(soh_end, 1),
        'fadePct':       round(fade_pct, 2),
        'fadePerMonth':  round(fade_per_month, 4),
        'rulMonths':     round(months_to_eol, 1),
        'r2':            round(r**2, 4),
        'slope':         round(slope, 6),
        'intercept':     round(intercept, 4),
        'status':        status,
    }

def get_projection(df, slope, intercept):
    x     = df['time_months'].values
    x_end = x[-1]

    if slope < 0:
        t_eol = min((EOL_CAP - intercept) / slope, 30)
    else:
        t_eol = 30

    x_proj = np.linspace(x_end, t_eol, 30)
    y_proj = slope * x_proj + intercept

    return [
        {'month': round(float(m), 2), 'capacity': round(float(c), 4)}
        for m, c in zip(x_proj, y_proj)
    ]

def build_api_response():
    all_data = load_all_cells()
    cells    = []
    chart_series = []

    for cell_id, info in CELLS.items():
        df      = all_data[cell_id]
        metrics = compute_metrics(df)
        proj    = get_projection(df, metrics['slope'], metrics['intercept'])

        actual_points = [
            {'month': round(float(r['time_months']), 2),
             'capacity': round(float(r['capacity_Ah']), 4),
             'soh': round(float(r['soh']), 2)}
            for _, r in df.iterrows()
        ]

        cells.append({
            'id':          cell_id,
            'label':       info['label'],
            'strategy':    info['strategy'],
            'color':       info['color'],
            **metrics,
            'actual':      actual_points,
            'projection':  proj,
        })

        chart_series.append({
            'id':         cell_id,
            'label':      info['label'],
            'color':      info['color'],
            'strategy':   info['strategy'],
            'actual':     actual_points,
            'projection': proj,
        })

    cells.sort(key=lambda c: c['sohEnd'])

    return {
        'cells':       cells,
        'chartSeries': chart_series,
        'eolCap':      EOL_CAP,
        'nominalCap':  NOMINAL_CAP,
        'summary': {
            'fastestDegrading': 'BMR Cell 2',
            'slowestDegrading': 'SPM Cell 1',
            'degradationRatio': 8.9,
            'criticalCount':    sum(1 for c in cells if c['status'] == 'Critical'),
            'healthyCount':     sum(1 for c in cells if c['status'] == 'Healthy'),
        }
    }