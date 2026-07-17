import numpy as np
import pandas as pd
from typing import List

HOLIDAYS = [
    "2013-01-26", "2013-08-15", "2013-10-02", "2013-10-14", "2013-11-02",
    "2014-01-26", "2014-08-15", "2014-10-02", "2014-10-03", "2014-10-22",
    "2015-01-26", "2015-08-15", "2015-10-02", "2015-10-22", "2015-11-10",
    "2016-01-26", "2016-08-15", "2016-10-02", "2016-10-11", "2016-10-30",
    "2017-01-26", "2017-08-15", "2017-10-02", "2017-10-19", "2017-11-07",
    "2018-01-26", "2018-08-15", "2018-10-02", "2018-10-08", "2018-10-27",
    "2019-01-26", "2019-08-15", "2019-10-02", "2019-10-27", "2019-11-15",
    "2020-01-26", "2020-08-15", "2020-10-02", "2020-10-24", "2020-11-14",
    "2021-01-26", "2021-08-15", "2021-10-02", "2021-10-15", "2021-11-04",
    "2022-01-26", "2022-08-15", "2022-10-02", "2022-10-05", "2022-10-24",
    "2023-01-26", "2023-08-15", "2023-10-02", "2023-10-24", "2023-11-12",
]
HOLIDAY_DATES = pd.to_datetime(HOLIDAYS)

DATE_FEATURE_COLS = [
    "year", "month", "day", "day_of_week", "day_of_year", "week", "quarter",
    "weekend", "month_start", "month_end", "quarter_start", "quarter_end",
    "day_of_week_sin", "day_of_week_cos", "day_of_year_sin", "day_of_year_cos",
    "month_sin", "month_cos", "week_sin", "week_cos",
]
HOLIDAY_FEATURE_COLS = [
    "is_holiday", "days_to_holiday", "days_from_holiday", "festival_week", "long_weekend",
]
STATIC_FEATURE_COLS = DATE_FEATURE_COLS + HOLIDAY_FEATURE_COLS


def _compute_static_features(dates: pd.DatetimeIndex, store: int, item: int) -> pd.DataFrame:
    n = len(dates)
    out = pd.DataFrame(index=range(n))
    out["date"] = dates
    dt = dates
    out["year"] = dt.year
    out["month"] = dt.month
    out["day"] = dt.day
    out["day_of_week"] = dt.dayofweek
    out["day_of_year"] = dt.dayofyear
    out["week"] = dt.isocalendar().week.astype(int)
    out["quarter"] = dt.quarter
    out["weekend"] = (out["day_of_week"] >= 5).astype(int)
    out["month_start"] = dt.is_month_start.astype(int)
    out["month_end"] = dt.is_month_end.astype(int)
    out["quarter_start"] = dt.is_quarter_start.astype(int)
    out["quarter_end"] = dt.is_quarter_end.astype(int)

    dw = out["day_of_week"].values
    dy = out["day_of_year"].values
    mo = out["month"].values
    wk = out["week"].values
    out["day_of_week_sin"] = np.sin(2 * np.pi * dw / 7)
    out["day_of_week_cos"] = np.cos(2 * np.pi * dw / 7)
    out["day_of_year_sin"] = np.sin(2 * np.pi * dy / 365)
    out["day_of_year_cos"] = np.cos(2 * np.pi * dy / 365)
    out["month_sin"] = np.sin(2 * np.pi * mo / 12)
    out["month_cos"] = np.cos(2 * np.pi * mo / 12)
    out["week_sin"] = np.sin(2 * np.pi * wk / 52)
    out["week_cos"] = np.cos(2 * np.pi * wk / 52)

    date_series = pd.Series(dates)
    hday = HOLIDAY_DATES
    out["is_holiday"] = date_series.isin(hday).astype(int)
    date_np = date_series.values.astype("datetime64[D]")
    hday_np = hday.values.astype("datetime64[D]")
    delta = date_np[:, None] - hday_np[None, :]
    delta_days = delta.astype(int)
    future_mask = delta_days <= 0
    past_mask = delta_days >= 0
    future_days = np.where(future_mask, -delta_days, 9999)
    past_days = np.where(past_mask, delta_days, 9999)
    future_min = future_days.min(axis=1)
    past_min = past_days.min(axis=1)
    out["days_to_holiday"] = np.where(future_min < 9999, future_min, 365)
    out["days_from_holiday"] = np.where(past_min < 9999, past_min, 365)
    out["festival_week"] = ((out["days_to_holiday"] <= 7) | (out["days_from_holiday"] <= 7)).astype(int)
    out["long_weekend"] = (((out["day_of_week"] == 4) | (out["day_of_week"] == 0)).astype(int) & out["is_holiday"])

    return out


FEATURE_COLUMNS: List[str] = [
    "sales_weekly_growth", "sales_monthly_growth", "sales_roll_mean_7",
    "sales_roll_min_7", "sales_ema_0.5", "sales_lag_364", "day_of_week",
    "sales_roll_std_7", "sales_roll_max_7", "sales_lag_14",
    "sales_roll_median_7", "sales_lag_2", "sales_lag_28", "sales_lag_21",
    "sales_roll_mean_60", "sales_lag_3", "sales_roll_median_60",
    "sales_expanding_mean", "sales_ema_0.7", "day_of_week_sin", "day",
    "sales_roll_median_14", "sales_lag_1", "day_of_year", "sales_roll_mean_14",
    "day_of_week_cos", "sales_ema_0.95", "month_cos", "sales_ema_0.8",
    "sales_roll_median_90", "day_of_year_sin", "day_of_year_cos", "sales_ema_0.9",
    "sales_roll_mean_90", "sales_roll_mean_28", "sales_expanding_std",
    "weekend", "sales_roll_median_28", "store_item_avg_sales", "sales_roll_std_60",
    "sales_roll_min_60", "sales_roll_min_14", "year", "month", "sales_roll_std_90",
    "days_to_holiday", "sales_roll_max_14", "month_sin", "week",
    "days_from_holiday", "sales_roll_min_28", "sales_roll_min_90", "week_sin",
    "sales_lag_90", "sales_roll_std_28", "week_cos", "sales_roll_max_60",
    "sales_lag_60", "sales_roll_max_90", "item_avg_sales", "sales_roll_std_14",
    "sales_lag_180", "store_sales_trend", "sales_roll_max_28",
    "item_sales_popularity", "month_end", "quarter", "quarter_end",
    "quarter_start", "store_avg_sales", "month_start", "festival_week",
    "is_holiday", "long_weekend",
]


def build_history_dataframe(
    store: int, item: int,
    start_date: pd.Timestamp,
    n_history: int = 400,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed=store * 100 + item)
    dates = pd.date_range(end=start_date - pd.Timedelta(days=1), periods=n_history)
    base = 30 + store * 2.5 + item * 0.8
    trend = np.linspace(0, base * 0.05, n_history)
    dow = np.array([d.dayofweek for d in dates])
    doy = np.array([d.dayofyear for d in dates])
    weekly = 4 * np.sin(2 * np.pi * dow / 7)
    annual = 5 * np.sin(2 * np.pi * doy / 365 - 1.2)
    noise = rng.normal(0, 2, n_history)
    sales = np.clip(base + trend + weekly + annual + noise, 1, None).round().astype(float)
    return pd.DataFrame({"date": dates, "sales": sales, "store": store, "item": item})


def _add_sales_features(
    history: pd.DataFrame, sales: np.ndarray
) -> dict:
    s = sales
    result = {}
    lags = [1, 2, 3, 7, 14, 21, 28, 30, 60, 90, 180, 364]
    for lag in lags:
        result[f"sales_lag_{lag}"] = s[-(1 + lag)] if len(s) > lag else s[0]

    windows = [7, 14, 28, 30, 60, 90]
    for w in windows:
        seg = s[-w:] if len(s) >= w else s
        result[f"sales_roll_mean_{w}"] = seg.mean()
        result[f"sales_roll_std_{w}"] = seg.std()
        result[f"sales_roll_min_{w}"] = seg.min()
        result[f"sales_roll_max_{w}"] = seg.max()
        result[f"sales_roll_median_{w}"] = np.median(seg)

    alphas = [0.5, 0.7, 0.8, 0.9, 0.95]
    for alpha in alphas:
        ewm = pd.Series(s).ewm(alpha=alpha, adjust=False).mean().iloc[-1]
        result[f"sales_ema_{alpha}"] = ewm

    result["sales_weekly_growth"] = (s[-1] / (s[-8] + 1e-6) - 1) if len(s) > 8 else 0.0
    result["sales_monthly_growth"] = (s[-1] / (s[-31] + 1e-6) - 1) if len(s) > 31 else 0.0
    emean = np.mean(s)
    result["sales_expanding_mean"] = emean
    result["sales_expanding_std"] = np.std(s)
    result["store_item_avg_sales"] = emean
    result["store_avg_sales"] = emean * np.random.uniform(0.9, 1.1)
    result["item_avg_sales"] = emean * np.random.uniform(0.9, 1.1)
    result["item_sales_popularity"] = emean / (emean + 1)
    result["store_sales_trend"] = (
        (np.mean(s[-30:]) - np.mean(s[:30])) / (np.mean(s[:30]) + 1e-6)
        if len(s) > 60 else 0.0
    )
    return result


def engineer_features(
    history_df: pd.DataFrame,
    forecast_dates: pd.DatetimeIndex,
    store: int,
    item: int,
) -> pd.DataFrame:
    static = _compute_static_features(forecast_dates, store, item)
    sales_buffer = history_df["sales"].values.copy()
    rows = []
    for i in range(len(forecast_dates)):
        sf = _add_sales_features(history_df, sales_buffer)
        row = {k: static.loc[i, k] for k in STATIC_FEATURE_COLS}
        row.update(sf)
        rows.append(row)
        fill_val = row.get("sales_roll_mean_7", np.mean(sales_buffer))
        sales_buffer = np.append(sales_buffer, fill_val)
    return pd.DataFrame(rows, index=forecast_dates)
