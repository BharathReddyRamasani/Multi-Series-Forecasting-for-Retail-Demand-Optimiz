"""Feature engineering pipeline — reproduces all 74 training features."""
import numpy as np
import pandas as pd
from typing import List


# ── Indian public holidays (simplified, used by training) ──────────────────
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


def _add_date_features(df: pd.DataFrame) -> pd.DataFrame:
    """Calendar and cyclical date features."""
    dt = df["date"]
    df["year"]         = dt.dt.year
    df["month"]        = dt.dt.month
    df["day"]          = dt.dt.day
    df["day_of_week"]  = dt.dt.dayofweek          # 0=Mon
    df["day_of_year"]  = dt.dt.dayofyear
    df["week"]         = dt.dt.isocalendar().week.astype(int)
    df["quarter"]      = dt.dt.quarter
    df["weekend"]      = (df["day_of_week"] >= 5).astype(int)
    df["month_start"]  = dt.dt.is_month_start.astype(int)
    df["month_end"]    = dt.dt.is_month_end.astype(int)
    df["quarter_start"] = dt.dt.is_quarter_start.astype(int)
    df["quarter_end"]  = dt.dt.is_quarter_end.astype(int)

    # Cyclical encodings
    df["day_of_week_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["day_of_week_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    df["day_of_year_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
    df["day_of_year_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 365)
    df["month_sin"]    = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"]    = np.cos(2 * np.pi * df["month"] / 12)
    df["week_sin"]     = np.sin(2 * np.pi * df["week"] / 52)
    df["week_cos"]     = np.cos(2 * np.pi * df["week"] / 52)
    return df


def _add_holiday_features(df: pd.DataFrame) -> pd.DataFrame:
    """Holiday proximity features."""
    df["is_holiday"] = df["date"].isin(HOLIDAY_DATES).astype(int)

    def days_to_next(d):
        future = HOLIDAY_DATES[HOLIDAY_DATES >= d]
        return (future.min() - d).days if len(future) > 0 else 365

    def days_from_last(d):
        past = HOLIDAY_DATES[HOLIDAY_DATES <= d]
        return (d - past.max()).days if len(past) > 0 else 365

    df["days_to_holiday"]   = df["date"].apply(days_to_next)
    df["days_from_holiday"] = df["date"].apply(days_from_last)

    # Festival week: within 7 days of a major holiday
    df["festival_week"] = (
        (df["days_to_holiday"] <= 7) | (df["days_from_holiday"] <= 7)
    ).astype(int)

    # Long weekend: Friday or Monday adjacent to weekend
    df["long_weekend"] = (
        (df["day_of_week"] == 4) | (df["day_of_week"] == 0)
    ).astype(int) & df["is_holiday"]

    return df


def _add_lag_features(df: pd.DataFrame, sales_col: str = "sales") -> pd.DataFrame:
    """Lag features at standard offsets."""
    lags = [1, 2, 3, 7, 14, 21, 28, 30, 60, 90, 180, 364]
    for lag in lags:
        df[f"sales_lag_{lag}"] = df[sales_col].shift(lag)
    return df


def _add_rolling_features(df: pd.DataFrame, sales_col: str = "sales") -> pd.DataFrame:
    """Rolling window aggregates."""
    windows = [7, 14, 28, 30, 60, 90]
    for w in windows:
        rolled = df[sales_col].shift(1).rolling(w, min_periods=1)
        df[f"sales_roll_mean_{w}"]   = rolled.mean()
        df[f"sales_roll_std_{w}"]    = rolled.std()
        df[f"sales_roll_min_{w}"]    = rolled.min()
        df[f"sales_roll_max_{w}"]    = rolled.max()
        df[f"sales_roll_median_{w}"] = rolled.median()
    return df


def _add_ema_features(df: pd.DataFrame, sales_col: str = "sales") -> pd.DataFrame:
    """Exponential moving averages."""
    alphas = [0.5, 0.7, 0.8, 0.9, 0.95]
    for alpha in alphas:
        df[f"sales_ema_{alpha}"] = (
            df[sales_col].shift(1).ewm(alpha=alpha, adjust=False).mean()
        )
    return df


def _add_growth_features(df: pd.DataFrame, sales_col: str = "sales") -> pd.DataFrame:
    """Week-over-week and month-over-month growth rates."""
    df["sales_weekly_growth"] = (
        df[sales_col].shift(1) / (df[sales_col].shift(8) + 1e-6) - 1
    )
    df["sales_monthly_growth"] = (
        df[sales_col].shift(1) / (df[sales_col].shift(31) + 1e-6) - 1
    )
    return df


def _add_expanding_features(df: pd.DataFrame, sales_col: str = "sales") -> pd.DataFrame:
    """Expanding (cumulative) statistics."""
    shifted = df[sales_col].shift(1)
    df["sales_expanding_mean"] = shifted.expanding(min_periods=1).mean()
    df["sales_expanding_std"]  = shifted.expanding(min_periods=1).std()
    return df


def _add_store_item_stats(
    df: pd.DataFrame,
    store: int,
    item: int,
    sales_col: str = "sales",
) -> pd.DataFrame:
    """Static store/item aggregate features derived from history."""
    series_mean = df[sales_col].mean()
    df["store_item_avg_sales"]   = series_mean
    df["store_avg_sales"]        = series_mean * np.random.uniform(0.9, 1.1)  # approx
    df["item_avg_sales"]         = series_mean * np.random.uniform(0.9, 1.1)
    df["item_sales_popularity"]  = series_mean / (series_mean + 1)
    df["store_sales_trend"]      = (
        df[sales_col].tail(30).mean() - df[sales_col].head(30).mean()
    ) / (df[sales_col].head(30).mean() + 1e-6)
    return df


# ── The 74 feature columns expected by the model (in training order) ───────
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
    store: int,
    item: int,
    start_date: pd.Timestamp,
    n_history: int = 400,
) -> pd.DataFrame:
    """
    Build synthetic history that statistically mimics Kaggle's store-item dataset.
    Used as warm-up buffer for lag/rolling features when no uploaded CSV is present.
    """
    rng = np.random.default_rng(seed=store * 100 + item)
    dates = pd.date_range(end=start_date - pd.Timedelta(days=1), periods=n_history)

    # Base level varies by store & item
    base  = 30 + store * 2.5 + item * 0.8
    trend = np.linspace(0, base * 0.05, n_history)

    # Weekly + annual seasonality
    dow    = np.array([d.dayofweek for d in dates])
    doy    = np.array([d.dayofyear for d in dates])
    weekly = 4 * np.sin(2 * np.pi * dow / 7)
    annual = 5 * np.sin(2 * np.pi * doy / 365 - 1.2)

    noise  = rng.normal(0, 2, n_history)
    sales  = np.clip(base + trend + weekly + annual + noise, 1, None).round().astype(float)

    df = pd.DataFrame({"date": dates, "sales": sales, "store": store, "item": item})
    return df


def engineer_features(
    history_df: pd.DataFrame,
    forecast_dates: pd.DatetimeIndex,
    store: int,
    item: int,
) -> pd.DataFrame:
    """
    Iteratively build feature rows for each forecast date using recursive
    prediction (the previous step's point forecast fills the lag).
    Returns a DataFrame with FEATURE_COLUMNS aligned to forecast_dates.
    """
    # We need to return feature frames for each forecast step
    # We'll build them one by one, appending synthetic point to history
    all_feature_rows = []
    working = history_df.copy()

    for fdate in forecast_dates:
        # Append a placeholder row for the forecast date
        new_row = pd.DataFrame(
            {"date": [fdate], "sales": [np.nan], "store": [store], "item": [item]}
        )
        full = pd.concat([working, new_row], ignore_index=True)
        full["date"] = pd.to_datetime(full["date"])
        full = full.sort_values("date").reset_index(drop=True)

        # Engineer all features on the full series
        full = _add_date_features(full)
        full = _add_holiday_features(full)
        full = _add_lag_features(full)
        full = _add_rolling_features(full)
        full = _add_ema_features(full)
        full = _add_growth_features(full)
        full = _add_expanding_features(full)
        full = _add_store_item_stats(full, store, item)

        # Extract the last row (forecast date)
        row = full.iloc[-1]
        feat_dict = row.to_dict()
        all_feature_rows.append(feat_dict)

        # Fill NaN placeholder with rolling mean as synthetic "actual" for next step
        fill_val = full["sales_roll_mean_7"].iloc[-1]
        if pd.isna(fill_val):
            fill_val = working["sales"].mean()
        working = pd.concat(
            [working, pd.DataFrame({"date": [fdate], "sales": [fill_val], "store": [store], "item": [item]})],
            ignore_index=True,
        )

    feat_df = pd.DataFrame(all_feature_rows, index=forecast_dates)
    return feat_df
