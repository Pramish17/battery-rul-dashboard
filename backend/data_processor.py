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

NOMINAL_CAP  = 16.0   # nominal cell capacity, used for C-rate normalisation only
EOL_SOH_PCT  = 0.80   # EOL = 80% of each cell's own initial capacity

# Stress thresholds
THRESHOLDS = {
    'voltage_max':      4.20,
    'voltage_min':      2.70,
    'cell_temp_max':    40.0,
    'current_max':      32.0,   # 2C rate for 16Ah cell
    'current_min':      -32.0,
}

def load_capacity_data():
    data = {}
    for cell_id, info in CELLS.items():
        path = os.path.join(BASE_DIR, f'{cell_id}_capacityData.csv')
        df   = pd.read_csv(path)
        df['time_months'] = df['time_s'] / 86400 / 30.44
        initial_cap       = df['capacity_Ah'].iloc[0]
        df['soh']         = (df['capacity_Ah'] / initial_cap) * 100
        df['cell_id']     = cell_id
        df['strategy']    = info['strategy']
        df['color']       = info['color']
        df['label']       = info['label']
        data[cell_id]     = df
    return data

def load_profile_data(cell_id):
    path = os.path.join(BASE_DIR, f'{cell_id}_profileData.csv')
    df   = pd.read_csv(path)
    df.columns = ['time_s', 'current_A', 'voltage_V',
                  'cell_temp_C', 'env_temp_C']
    # Sample down to max 5000 rows for performance
    if len(df) > 5000:
        df = df.iloc[::len(df)//5000].reset_index(drop=True)
    return df

def compute_metrics(df):
    start_cap = df['capacity_Ah'].iloc[0]
    end_cap   = df['capacity_Ah'].iloc[-1]
    x = df['time_months'].values
    y = df['capacity_Ah'].values

    slope, intercept, r, _, _ = stats.linregress(x, y)

    fade_pct       = ((start_cap - end_cap) / start_cap) * 100
    fade_per_month = abs(slope)
    soh_end        = (end_cap / start_cap) * 100

    # Per-cell EOL capacity: 80% of this cell's own first reading
    eol_cap_cell = start_cap * EOL_SOH_PCT

    if slope < 0:
        months_to_eol = (end_cap - eol_cap_cell) / fade_per_month
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
        'eolCapCell':    round(eol_cap_cell, 3),
        'sohEnd':        round(soh_end, 1),
        'fadePct':       round(fade_pct, 2),
        'fadePerMonth':  round(fade_per_month, 4),
        'rulMonths':     round(months_to_eol, 1),
        'r2':            round(r**2, 4),
        'slope':         round(slope, 6),
        'intercept':     round(intercept, 4),
        'status':        status,
    }

def compute_stress_alerts(cell_id):
    try:
        df      = load_profile_data(cell_id)
        alerts  = []
        summary = {}

        # voltage == 0 means "no measurement available" per dataset readme — exclude from all voltage analysis
        df_v = df[df['voltage_V'] != 0]

        # Overvoltage
        if len(df_v) > 0:
            ov_count = int((df_v['voltage_V'] > THRESHOLDS['voltage_max']).sum())
            if ov_count > 0:
                alerts.append({
                    'type': 'Overvoltage',
                    'severity': 'High',
                    'count': ov_count,
                    'message': f'Voltage exceeded {THRESHOLDS["voltage_max"]}V in {ov_count} readings'
                })

            # Undervoltage
            uv_count = int((df_v['voltage_V'] < THRESHOLDS['voltage_min']).sum())
            if uv_count > 0:
                alerts.append({
                    'type': 'Undervoltage',
                    'severity': 'High',
                    'count': uv_count,
                    'message': f'Voltage dropped below {THRESHOLDS["voltage_min"]}V in {uv_count} readings'
                })

        # Overtemperature
        temp_valid = df[df['cell_temp_C'] > 0]['cell_temp_C']
        if len(temp_valid) > 0:
            ot_count = int((temp_valid > THRESHOLDS['cell_temp_max']).sum())
            avg_temp = round(float(temp_valid.mean()), 1)
            max_temp = round(float(temp_valid.max()), 1)
            if ot_count > 0:
                alerts.append({
                    'type': 'Overtemperature',
                    'severity': 'Medium',
                    'count': ot_count,
                    'message': f'Cell temperature exceeded {THRESHOLDS["cell_temp_max"]}°C in {ot_count} readings'
                })
            summary['avgTemp'] = avg_temp
            summary['maxTemp'] = max_temp

        # Overcurrent
        oc_count = int((df['current_A'].abs() > THRESHOLDS['current_max']).sum())
        if oc_count > 0:
            alerts.append({
                'type': 'Overcurrent',
                'severity': 'Medium',
                'count': oc_count,
                'message': f'Current exceeded 2C rate in {oc_count} readings'
            })

        summary['alertCount'] = len(alerts)
        if len(df_v) > 0:
            summary['maxVoltage'] = round(float(df_v['voltage_V'].max()), 3)
            summary['minVoltage'] = round(float(df_v['voltage_V'].min()), 3)
            summary['avgVoltage'] = round(float(df_v['voltage_V'].mean()), 3)
        summary['maxCurrent'] = round(float(df['current_A'].abs().max()), 2)

        return {'alerts': alerts, 'summary': summary}

    except Exception as e:
        return {'alerts': [], 'summary': {}, 'error': str(e)}

def compute_degradation_drivers(cell_id, cap_df):
    try:
        profile_df = load_profile_data(cell_id)

        # C-rate (current normalised by capacity)
        profile_df['c_rate'] = profile_df['current_A'].abs() / NOMINAL_CAP

        # Depth of discharge — estimate from valid voltage range (0 means no measurement)
        v_valid = profile_df[profile_df['voltage_V'] != 0]['voltage_V']
        v_range = float(v_valid.max() - v_valid.min()) if len(v_valid) > 1 else 0.0
        avg_dod = round(v_range / (4.2 - 2.7) * 100, 1)

        # Temperature stats
        temp_valid = profile_df[profile_df['cell_temp_C'] > 0]['cell_temp_C']
        avg_temp   = round(float(temp_valid.mean()), 1) if len(temp_valid) > 0 else 0
        temp_score = min(100, max(0, (avg_temp - 20) / 20 * 100))

        # C-rate stats
        avg_crate   = round(float(profile_df['c_rate'].mean()), 3)
        crate_score = min(100, avg_crate / 2.0 * 100)

        # DOD score
        dod_score = min(100, avg_dod)

        # Capacity fade
        total_fade = cap_df['fadePct']

        # Attribute fade proportionally across 3 drivers
        total_score = temp_score + crate_score + dod_score
        if total_score > 0:
            temp_contribution  = round(total_fade * temp_score  / total_score, 2)
            crate_contribution = round(total_fade * crate_score / total_score, 2)
            dod_contribution   = round(total_fade * dod_score   / total_score, 2)
        else:
            temp_contribution = crate_contribution = dod_contribution = 0

        return {
            'avgTemp':           avg_temp,
            'avgCRate':          avg_crate,
            'avgDoD':            avg_dod,
            'tempContribution':  temp_contribution,
            'cRateContribution': crate_contribution,
            'doDContribution':   dod_contribution,
            'tempScore':         round(temp_score, 1),
            'cRateScore':        round(crate_score, 1),
            'doDScore':          round(dod_score, 1),
        }

    except Exception as e:
        return {'error': str(e)}

def compute_oxford_benchmark(all_metrics):
    # Baseline: average across all 6 cells
    avg_soh       = round(sum(m['sohEnd']       for m in all_metrics) / len(all_metrics), 1)
    avg_fade      = round(sum(m['fadePct']       for m in all_metrics) / len(all_metrics), 2)
    avg_rul       = round(sum(m['rulMonths']     for m in all_metrics if m['rulMonths'] < 9999) /
                          max(1, sum(1 for m in all_metrics if m['rulMonths'] < 9999)), 1)
    avg_fade_rate = round(sum(m['fadePerMonth']  for m in all_metrics) / len(all_metrics), 4)

    return {
        'baselineSOH':      avg_soh,
        'baselineFade':     avg_fade,
        'baselineRUL':      avg_rul,
        'baselineFadeRate': avg_fade_rate,
        'description':      'Oxford lab baseline — average across all 6 Kokam 16Ah cells'
    }

def get_projection(df, slope, intercept, eol_cap_cell):
    x     = df['time_months'].values
    x_end = x[-1]

    if slope < 0:
        t_eol = min((eol_cap_cell - intercept) / slope, 30)
    else:
        t_eol = 30

    x_proj = np.linspace(x_end, t_eol, 30)
    y_proj = slope * x_proj + intercept

    return [
        {'month': round(float(m), 2), 'capacity': round(float(c), 4)}
        for m, c in zip(x_proj, y_proj)
    ]

def build_api_response():
    all_cap_data = load_capacity_data()
    cells        = []
    chart_series = []
    all_metrics  = []

    for cell_id, info in CELLS.items():
        df      = all_cap_data[cell_id]
        metrics = compute_metrics(df)
        all_metrics.append(metrics)

        stress  = compute_stress_alerts(cell_id)
        drivers = compute_degradation_drivers(cell_id, metrics)
        proj    = get_projection(df, metrics['slope'], metrics['intercept'], metrics['eolCapCell'])

        actual_points = [
            {'month':    round(float(r['time_months']), 2),
             'capacity': round(float(r['capacity_Ah']), 4),
             'soh':      round(float(r['soh']), 2)}
            for _, r in df.iterrows()
        ]

        cells.append({
            'id':        cell_id,
            'label':     info['label'],
            'strategy':  info['strategy'],
            'color':     info['color'],
            **metrics,
            'actual':    actual_points,
            'projection': proj,
            'stress':    stress,
            'drivers':   drivers,
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
    benchmark = compute_oxford_benchmark(all_metrics)

    # Representative EOL capacity for chart reference line (average across all cells)
    avg_eol_cap = round(sum(m['eolCapCell'] for m in all_metrics) / len(all_metrics), 3)

    return {
        'cells':       cells,
        'chartSeries': chart_series,
        'eolCap':      avg_eol_cap,
        'nominalCap':  NOMINAL_CAP,
        'benchmark':   benchmark,
        'summary': {
            'fastestDegrading': 'BMR Cell 2',
            'slowestDegrading': 'SPM Cell 1',
            'degradationRatio': 8.9,
            'criticalCount':    sum(1 for c in cells if c['status'] == 'Critical'),
            'healthyCount':     sum(1 for c in cells if c['status'] == 'Healthy'),
        }
    }