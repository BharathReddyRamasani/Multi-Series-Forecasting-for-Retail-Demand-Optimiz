"""
feature_engine.py — Inference-time feature engineering.

Produces the EXACT feature schema (column names + order) that the models in
models/v2/ were trained on (see FEATURE_COLUMNS in services/forecaster.py and
train_v2.py). This guarantees no train/serve schema skew.
"""
import numpy as np
import pandas as pd
from typing import List

HOLIDAYS = [
    "2020-01-26", "2020-08-15", "2020-10-02", "2020-10-24", "2020-11-14",
    "2021-01-26", "2021-08-15", "2021-10-02", "2021-10-15", "2021-11-04",
    "2022-01-26", "2022-08-15", "2022-10-02", "2022-10-05", "2022-10-24",
    "2023-01-26", "2023-08-15", "2023-10-02", "2023-10-24", "2023-11-12",
]
HOLIDAY_DATES = pd.to_datetime(HOLIDAYS)


def _add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day
    df["dayofweek"] = df["date"].dt.dayofweek
    df["weekofyear"] = df["date"].dt.isocalendar().week.astype(int)
    df["quarter"] = df["date"].dt.quarter
    df["dayofyear"] = df["date"].dt.dayofyear
    df["is_weekend"] = (df["dayofweek"] >= 5).astype(int)

    is_hol = df["date"].dt.normalize().isin(HOLIDAY_DATES)
    df["is_holiday"] = is_hol.astype(int)

    delta = (df["date"].values.astype("datetime64[D]")[None, :]
             - HOLIDAY_DATES.values.astype("datetime64[D]")[:, None])
    delta_days = delta.astype(int)
    future = np.where(delta_days <= 0, -delta_days, 9999)
    past = np.where(delta_days >= 0, delta_days, 9999)
    df["days_to_holiday"] = np.where(future.min(axis=0) < 9999, future.min(axis=0), 365)
    df["days_after_holiday"] = np.where(past.min(axis=0) < 9999, past.min(axis=0), 365)
    dow = df["dayofweek"].values
    df["long_weekend"] = (
        ((dow == 4) | (dow == 0)).astype(int) & df["is_holiday"].values
    )
    df["festival_week"] = (
        (df["days_to_holiday"] <= 7) | (df["days_after_holiday"] <= 7)
    ).astype(int)
    return df


def _add_sales_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    grp = df.groupby(["store", "item"], group_keys=False)

    lags = [1, 7, 14, 28, 30, 60, 90, 180, 364]
    for lag in lags:
        df[f"lag_{lag}"] = grp["sales"].shift(lag)

    for w in [7, 14, 28, 30, 60, 90]:
        df[f"rolling_mean_{w}"] = grp["sales"].transform(
            lambda x: x.shift(1).rolling(w, min_periods=1).mean())
        df[f"rolling_std_{w}"] = grp["sales"].transform(
            lambda x: x.shift(1).rolling(w, min_periods=1).std())
        if w <= 30:
            df[f"rolling_min_{w}"] = grp["sales"].transform(
                lambda x: x.shift(1).rolling(w, min_periods=1).min())
            df[f"rolling_max_{w}"] = grp["sales"].transform(
                lambda x: x.shift(1).rolling(w, min_periods=1).max())
        df[f"rolling_median_{w}"] = grp["sales"].transform(
            lambda x: x.shift(1).rolling(w, min_periods=1).median())

    for alpha, key in [(0.5, "05"), (0.7, "07"), (0.8, "08"),
                       (0.9, "09"), (0.95, "095")]:
        df[f"ema_{key}"] = grp["sales"].transform(
            lambda x: x.shift(1).ewm(alpha=alpha, min_periods=1).mean())

    df["expanding_mean"] = grp["sales"].transform(
        lambda x: x.shift(1).expanding().mean())
    df["expanding_std"] = grp["sales"].transform(
        lambda x: x.shift(1).expanding().std())
    df["expanding_min"] = grp["sales"].transform(
        lambda x: x.shift(1).expanding().min())
    df["expanding_max"] = grp["sales"].transform(
        lambda x: x.shift(1).expanding().max())

    df["sales_weekly_growth"] = grp["sales"].transform(
        lambda x: x.shift(1) / x.shift(8).replace(0, np.nan))
    df["sales_monthly_growth"] = grp["sales"].transform(
        lambda x: x.shift(1) / x.shift(31).replace(0, np.nan))

    for c in ["store", "item"]:
        df[f"{c}_avg_sales"] = (
            df.groupby(c)["sales"]
            .transform(lambda x: x.shift(1).expanding().mean())
        )

    def _past_trend(x: pd.Series) -> pd.Series:
        past = x.shift(1)
        recent = past.rolling(30, min_periods=1).mean()
        earlier = past.shift(30).rolling(30, min_periods=1).mean()
        return recent - earlier

    df["store_sales_trend"] = (
        df.groupby(["store", "item"])["sales"].transform(_past_trend)
    )
    return df


def engineer_features(
    history_df: pd.DataFrame,
    forecast_dates: pd.DatetimeIndex,
    store: int,
    item: int,
) -> pd.DataFrame:
    """Build inference features for a single (store, item) at forecast_dates.

    Future rows (forecast_dates) have no `sales`, so we grow the sales history
    recursively using rolling_mean_7 of the prior window (matching the training
    distribution), then compute the SAME features as train_v2.py.
    """
    hist = history_df.copy()
    hist["store"] = store
    hist["item"] = item
    hist["date"] = pd.to_datetime(hist["date"])
    hist = hist.sort_values("date").reset_index(drop=True)

    fut = pd.DataFrame({
        "date": forecast_dates,
        "store": store,
        "item": item,
        "sales": np.nan,
    })
    combined = pd.concat([hist, fut], ignore_index=True)
    combined = combined.sort_values("date").reset_index(drop=True)

    sales = combined["sales"].astype(float).values
    last_known_idx = len(hist) - 1
    for i in range(last_known_idx + 1, len(combined)):
        window = sales[max(0, i - 7):i]
        valid = window[~np.isnan(window)]
        if len(valid) > 0:
            fill = float(np.nanmean(valid))
        elif last_known_idx >= 0:
            fill = float(np.nanmean(sales[:last_known_idx + 1]))
        else:
            fill = 0.0
        sales[i] = fill if not np.isnan(fill) else 0.0
    combined["sales"] = sales

    combined = _add_calendar_features(combined)
    combined = _add_sales_features(combined)

    combined = combined.set_index("date")
    out = combined.loc[forecast_dates].reset_index()
    return out


def build_history_dataframe(
    store: int, item: int,
    start_date: pd.Timestamp,
    n_history: int = 400,
) -> pd.DataFrame:
    """Fallback synthetic history used only when the database has no rows."""
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
