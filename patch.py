import os

with open('d:\\forecast\\backend\\services\\forecaster.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = lines[:339]

missing_block = """            model_type = "lightgbm"
        elif model_type == "randomforest" and not (hasattr(self, 'model_rf') and self.model_rf is not None):
            logger.warning("RandomForest not available, falling back to LightGBM")
            model_type = "lightgbm"

        if not scenario_overrides:
            cached = self._forecast_cache.get(store, item, horizon, model_type, start_date)
            if cached is not None:
                return cached

        start = pd.Timestamp(start_date) if start_date else pd.Timestamp.today().normalize()
        forecast_dates = pd.date_range(start=start, periods=horizon, freq="D")
        history = self._get_history(store, item, start)
        
        # Build features
        feat_df = engineer_features(history, forecast_dates, store, item)
        
        holiday_mult = 1.0
        promo_mult = 1.0

        if scenario_overrides:
            if scenario_overrides.get("force_holiday"):
                # Calculate historical impact
                try:
                    from backend.services.feature_engine import HOLIDAY_DATES
                    hist_is_hol = history["date"].dt.normalize().isin(HOLIDAY_DATES)
                    hol_sales = history.loc[hist_is_hol, "sales"].mean()
                    non_hol_sales = history.loc[~hist_is_hol, "sales"].mean()
                    if pd.notna(hol_sales) and pd.notna(non_hol_sales) and non_hol_sales > 0:
                        holiday_mult = max(0.1, min(float(hol_sales / non_hol_sales), 5.0)) 
                    else:
                        holiday_mult = 1.15
                except Exception:
                    holiday_mult = 1.15

            if scenario_overrides.get("force_promotion"):
                promo_mult = 1.25
            if scenario_overrides.get("promotion_factor"):
                try:
                    promo_mult = float(scenario_overrides["promotion_factor"])
                except (ValueError, TypeError):
                    pass

        X_future_df = self._prepare_features(feat_df, store, item, model_type)

        supported = {"lightgbm", "xgboost", "randomforest", "arima", "sarima", "arma"}
        if model_type not in supported:
            raise ValueError(
                f"Unsupported model_type '{model_type}'. Supported: {sorted(supported)}")

        if model_type == "xgboost":
            preds_point, preds_low, preds_high = self._forecast_xgboost(history, X_future_df, horizon)
        elif model_type == "randomforest":
            preds_point, preds_low, preds_high = self._forecast_rf(X_future_df, horizon)
        elif model_type in ("sarima", "arima"):
            preds_point, preds_low, preds_high = self._forecast_arima(history, horizon, order=(1, 1, 1))
        elif model_type == "arma":
            preds_point, preds_low, preds_high = self._forecast_arima(history, horizon, order=(2, 0, 1))
        else:
            preds_point, preds_low, preds_high = self._forecast_lightgbm(X_future_df, horizon)

        total_mult = holiday_mult * promo_mult
        if total_mult != 1.0:
            preds_point = preds_point * total_mult
            preds_low = preds_low * total_mult
            preds_high = preds_high * total_mult

        # Ensure shapes match horizon
        if len(preds_point) != horizon:
            preds_point = np.pad(preds_point, (0, max(0, horizon - len(preds_point))), 'edge')[:horizon]
            preds_low   = np.pad(preds_low, (0, max(0, horizon - len(preds_low))), 'edge')[:horizon]
            preds_high  = np.pad(preds_high, (0, max(0, horizon - len(preds_high))), 'edge')[:horizon]

"""

new_lines.append(missing_block)
new_lines.extend(lines[339:])

with open('d:\\forecast\\backend\\services\\forecaster.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
