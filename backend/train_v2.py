"""
train_v2.py — Train LightGBM, XGBoost, and RandomForest models using DB data.
Usage: python train_v2.py
Output: models/v2/{model_name}/
"""
import json, csv, logging, sys
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models" / "v2"
DB_PATH = Path(__file__).resolve().parent / "forecast.db"

FEATURE_COLUMNS = [
    "year","month","day","dayofweek","weekofyear","quarter","dayofyear",
    "is_weekend","is_holiday","days_to_holiday","days_after_holiday",
    "long_weekend","festival_week",
    "lag_1","lag_7","lag_14","lag_28","lag_30","lag_60","lag_90","lag_180","lag_364",
    "rolling_mean_7","rolling_mean_14","rolling_mean_28","rolling_mean_30","rolling_mean_60","rolling_mean_90",
    "rolling_std_7","rolling_std_14","rolling_std_28","rolling_std_30","rolling_std_60","rolling_std_90",
    "rolling_min_7","rolling_min_14","rolling_min_28","rolling_min_30",
    "rolling_max_7","rolling_max_14","rolling_max_28","rolling_max_30",
    "rolling_median_7","rolling_median_14","rolling_median_28","rolling_median_30","rolling_median_60","rolling_median_90",
    "ema_05","ema_07","ema_08","ema_09","ema_095",
    "expanding_mean","expanding_std","expanding_min","expanding_max",
    "sales_weekly_growth","sales_monthly_growth",
    "store","item","store_avg_sales","item_avg_sales","store_sales_trend"
]

def get_connection():
    import sqlite3
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def build_training_dataset():
    conn = get_connection()
    query = """
        SELECT date, store, item, sales
        FROM sales
        ORDER BY store, item, date ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    df["date"] = pd.to_datetime(df["date"])
    df.sort_values(["store", "item", "date"], inplace=True)
    return df

def engineer_features_for_train(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.sort_values(["store", "item", "date"], inplace=True)

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day
    df["dayofweek"] = df["date"].dt.dayofweek
    df["weekofyear"] = df["date"].dt.isocalendar().week.astype(int)
    df["quarter"] = df["date"].dt.quarter
    df["dayofyear"] = df["date"].dt.dayofyear
    df["is_weekend"] = (df["dayofweek"] >= 5).astype(int)

    df["is_holiday"] = 0
    df["days_to_holiday"] = 0
    df["days_after_holiday"] = 0
    df["long_weekend"] = 0
    df["festival_week"] = 0

    from datetime import date
    holidays = [
        date(2020,1,1),date(2020,1,26),date(2020,3,10),date(2020,4,2),date(2020,4,6),date(2020,4,10),date(2020,4,14),date(2020,5,1),date(2020,5,7),date(2020,5,25),date(2020,7,31),date(2020,8,3),date(2020,8,11),date(2020,8,22),date(2020,9,10),date(2020,10,2),date(2020,11,14),date(2020,11,30),date(2020,12,25),
        date(2021,1,1),date(2021,1,26),date(2021,3,11),date(2021,3,29),date(2021,4,2),date(2021,4,14),date(2021,4,21),date(2021,5,1),date(2021,5,13),date(2021,7,20),date(2021,8,19),date(2021,9,10),date(2021,10,2),date(2021,10,15),date(2021,11,4),date(2021,11,5),date(2021,11,19),date(2021,12,25),
        date(2022,1,1),date(2022,1,26),date(2022,3,1),date(2022,3,18),date(2022,4,10),date(2022,4,14),date(2022,4,15),date(2022,5,1),date(2022,5,3),date(2022,5,16),date(2022,7,10),date(2022,8,9),date(2022,8,15),date(2022,8,31),date(2022,10,2),date(2022,10,5),date(2022,10,24),date(2022,11,8),date(2022,12,25),
    ]
    all_dates = df["date"].dt.date
    is_hol = all_dates.isin(holidays)
    df.loc[is_hol, "is_holiday"] = 1

    grp = df.groupby(["store", "item"], group_keys=False)

    lags = [1,7,14,28,30,60,90,180,364]
    for lag in lags:
        df[f"lag_{lag}"] = grp["sales"].shift(lag)

    for w in [7,14,28,30,60,90]:
        df[f"rolling_mean_{w}"] = grp["sales"].transform(lambda x: x.shift(1).rolling(w, min_periods=1).mean())
        df[f"rolling_std_{w}"] = grp["sales"].transform(lambda x: x.shift(1).rolling(w, min_periods=1).std())
        if w <= 30:
            df[f"rolling_min_{w}"] = grp["sales"].transform(lambda x: x.shift(1).rolling(w, min_periods=1).min())
            df[f"rolling_max_{w}"] = grp["sales"].transform(lambda x: x.shift(1).rolling(w, min_periods=1).max())
        if w in [7,14,28,30,60,90]:
            df[f"rolling_median_{w}"] = grp["sales"].transform(lambda x: x.shift(1).rolling(w, min_periods=1).median())

    for alpha, key in [(0.5,"05"),(0.7,"07"),(0.8,"08"),(0.9,"09"),(0.95,"095")]:
        df[f"ema_{key}"] = grp["sales"].transform(lambda x: x.shift(1).ewm(alpha=alpha, min_periods=1).mean())

    df["expanding_mean"] = grp["sales"].transform(lambda x: x.shift(1).expanding().mean())
    df["expanding_std"] = grp["sales"].transform(lambda x: x.shift(1).expanding().std())
    df["expanding_min"] = grp["sales"].transform(lambda x: x.shift(1).expanding().min())
    df["expanding_max"] = grp["sales"].transform(lambda x: x.shift(1).expanding().max())

    df["sales_weekly_growth"] = grp["sales"].transform(lambda x: x.shift(1) / x.shift(8).replace(0, np.nan))
    df["sales_monthly_growth"] = grp["sales"].transform(lambda x: x.shift(1) / x.shift(31).replace(0, np.nan))

    for c in ["store","item"]:
        series_mean = df.groupby(c)["sales"].transform("mean")
        df[f"{c}_avg_sales"] = series_mean

    store_item_mean = df.groupby(["store","item"])["sales"].transform("mean")
    df["store_sales_trend"] = (
        df.groupby(["store","item"])["sales"]
        .transform(lambda x: x.tail(30).mean() - x.head(30).mean())
    )

    for c in FEATURE_COLUMNS:
        if c not in df.columns:
            df[c] = 0.0

    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    return df

def compute_metrics(y_true, y_pred):
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    mape_val = float(np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1))) * 100)
    smape_val = float(np.mean(2 * np.abs(y_true - y_pred) / (np.abs(y_true) + np.abs(y_pred))) * 100)
    wape_val = float(np.sum(np.abs(y_true - y_pred)) / np.sum(np.maximum(y_true, 1)) * 100)
    rmsle_val = float(np.sqrt(np.mean((np.log1p(y_true) - np.log1p(y_pred)) ** 2)))
    return {
        "rmse": rmse, "mae": mae, "r2": r2,
        "mape": mape_val, "smape": smape_val, "wape": wape_val, "rmsle": rmsle_val,
    }

def save_model(model, features, metrics, feature_importance, model_name, model_dir):
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_dir / f"{model_name}_model.pkl")
    joblib.dump(features, model_dir / f"{model_name}_features.pkl")
    with open(model_dir / f"{model_name}_metrics.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["Metric", "Value"])
        w.writeheader()
        for k, v in metrics.items():
            w.writerow({"Metric": k, "Value": v})
    with open(model_dir / f"{model_name}_feature_importance.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["Feature", "Importance"])
        w.writeheader()
        for feat, imp in feature_importance:
            w.writerow({"Feature": feat, "Importance": imp})
    params = {"model_name": model_name, "training_date": datetime.now().isoformat(), "feature_count": len(features)}
    with open(model_dir / f"{model_name}_params.json", "w") as f:
        json.dump(params, f, indent=2)
    logger.info("Saved %s to %s", model_name, model_dir)

def main():
    logger.info("Loading dataset from DB...")
    raw = build_training_dataset()
    logger.info("Loaded %d rows", len(raw))

    logger.info("Engineering features...")
    X = engineer_features_for_train(raw)
    logger.info("Feature matrix: %d rows x %d cols", X.shape[0], X.shape[1])

    train_mask = X["date"] < "2022-01-01"
    val_mask = (X["date"] >= "2022-01-01") & (X["date"] < "2022-07-01")
    test_mask = X["date"] >= "2022-07-01"

    X_train = X[train_mask].copy()
    X_val = X[val_mask].copy()
    X_test = X[test_mask].copy()

    y_train = X_train["sales"].values.astype(np.float64)
    y_val = X_val["sales"].values.astype(np.float64)
    y_test = X_test["sales"].values.astype(np.float64)

    X_train_feat = X_train[FEATURE_COLUMNS].values.astype(np.float64)
    X_val_feat = X_val[FEATURE_COLUMNS].values.astype(np.float64)
    X_test_feat = X_test[FEATURE_COLUMNS].values.astype(np.float64)

    X_train_feat = np.nan_to_num(X_train_feat, nan=0.0, posinf=0.0, neginf=0.0)
    X_val_feat = np.nan_to_num(X_val_feat, nan=0.0, posinf=0.0, neginf=0.0)
    X_test_feat = np.nan_to_num(X_test_feat, nan=0.0, posinf=0.0, neginf=0.0)

    logger.info("Train: %d | Val: %d | Test: %d", len(X_train), len(X_val), len(X_test))

    # ── LightGBM ──
    logger.info("=" * 60)
    logger.info("Training LightGBM...")
    import lightgbm as lgb
    lgb_model = lgb.LGBMRegressor(
        n_estimators=2000, learning_rate=0.03, max_depth=8,
        num_leaves=63, subsample=0.8, colsample_bytree=0.8,
        reg_alpha=0.1, reg_lambda=0.1, min_child_samples=20,
        random_state=42, n_jobs=-1, verbose=-1
    )
    lgb_model.fit(
        X_train_feat, y_train,
        eval_set=[(X_val_feat, y_val)],
        eval_metric="rmse",
        callbacks=[lgb.log_evaluation(100), lgb.early_stopping(50)]
    )
    lgb_preds = lgb_model.predict(X_test_feat)
    lgb_metrics = compute_metrics(y_test, lgb_preds)
    logger.info("LightGBM Test Metrics: RMSE=%.4f, MAE=%.4f, R2=%.4f, MAPE=%.2f%%",
                lgb_metrics["rmse"], lgb_metrics["mae"], lgb_metrics["r2"], lgb_metrics["mape"])
    lgb_imp = sorted(zip(FEATURE_COLUMNS, lgb_model.feature_importances_), key=lambda x: x[1], reverse=True)
    save_model(lgb_model, FEATURE_COLUMNS, lgb_metrics, lgb_imp, "lightgbm", MODELS_DIR / "lightgbm")

    # ── XGBoost ──
    logger.info("=" * 60)
    logger.info("Training XGBoost...")
    import xgboost as xgb
    xgb_model = xgb.XGBRegressor(
        n_estimators=2000, learning_rate=0.03, max_depth=8,
        subsample=0.8, colsample_bytree=0.8,
        reg_alpha=0.1, reg_lambda=0.1,
        random_state=42, n_jobs=-1, verbosity=0
    )
    xgb_model.fit(
        X_train_feat, y_train,
        eval_set=[(X_val_feat, y_val)],
        verbose=100
    )
    xgb_preds = xgb_model.predict(X_test_feat)
    xgb_metrics = compute_metrics(y_test, xgb_preds)
    logger.info("XGBoost Test Metrics: RMSE=%.4f, MAE=%.4f, R2=%.4f, MAPE=%.2f%%",
                xgb_metrics["rmse"], xgb_metrics["mae"], xgb_metrics["r2"], xgb_metrics["mape"])
    xgb_imp = sorted(zip(FEATURE_COLUMNS, xgb_model.feature_importances_), key=lambda x: x[1], reverse=True)
    save_model(xgb_model, FEATURE_COLUMNS, xgb_metrics, xgb_imp, "xgboost", MODELS_DIR / "xgboost")

    # ── RandomForest ──
    logger.info("=" * 60)
    logger.info("Training RandomForest...")
    from sklearn.ensemble import RandomForestRegressor
    rf_model = RandomForestRegressor(
        n_estimators=500, max_depth=20, min_samples_split=10,
        min_samples_leaf=5, max_features="sqrt",
        random_state=42, n_jobs=-1, verbose=0
    )
    rf_model.fit(X_train_feat, y_train)
    rf_preds = rf_model.predict(X_test_feat)
    rf_metrics = compute_metrics(y_test, rf_preds)
    logger.info("RandomForest Test Metrics: RMSE=%.4f, MAE=%.4f, R2=%.4f, MAPE=%.2f%%",
                rf_metrics["rmse"], rf_metrics["mae"], rf_metrics["r2"], rf_metrics["mape"])
    rf_imp = sorted(zip(FEATURE_COLUMNS, rf_model.feature_importances_), key=lambda x: x[1], reverse=True)
    save_model(rf_model, FEATURE_COLUMNS, rf_metrics, rf_imp, "randomforest", MODELS_DIR / "randomforest")

    logger.info("=" * 60)
    logger.info("All models trained successfully!")
    logger.info("Models saved to: %s", MODELS_DIR)

if __name__ == "__main__":
    main()
