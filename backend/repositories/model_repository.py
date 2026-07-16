import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple

MODELS_DIR = Path(__file__).parent.parent.parent / "models"

class ModelRepository:
    """
    Repository for interacting with the core LightGBM models.
    Per architectural constraints, LightGBM remains the ONLY forecasting engine.
    The LLM will NEVER predict demand.
    """
    def __init__(self):
        self.model_point = None
        self.model_low = None
        self.model_high = None
        self.metadata: Dict = {}
        self.metrics: Dict = {}
        self.feature_importance: List[Dict] = []
        self._load_models()

    def _load_models(self):
        # Load the models
        self.model_point = joblib.load(MODELS_DIR / "lightgbm_forecaster.joblib")
        self.model_low = joblib.load(MODELS_DIR / "model_low_q05.joblib")
        self.model_high = joblib.load(MODELS_DIR / "model_high_q95.joblib")

        # Load Metadata & Metrics
        with open(MODELS_DIR / "metadata (5).json", "r") as f:
            self.metadata = json.load(f)
        with open(MODELS_DIR / "metrics (5).json", "r") as f:
            self.metrics = json.load(f)

        # Load Feature Importance
        import csv
        fi_path = MODELS_DIR / "feature_importance (5).csv"
        with open(fi_path, newline="") as f:
            reader = csv.DictReader(f)
            self.feature_importance = [
                {"feature": row["feature"], "importance": int(row["importance"])}
                for row in reader if row["feature"]
            ]
        self.feature_importance.sort(key=lambda x: x["importance"], reverse=True)
        for i, item in enumerate(self.feature_importance):
            item["rank"] = i + 1

    @property
    def is_loaded(self) -> bool:
        return self.model_point is not None

    def predict(self, features: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Runs the LightGBM models.
        Returns point, low (q05), and high (q95) predictions.
        """
        if not self.is_loaded:
            raise RuntimeError("LightGBM model is not loaded.")
        
        point = np.clip(self.model_point.predict(features), 0, None)
        low = np.clip(self.model_low.predict(features), 0, None)
        high = np.clip(self.model_high.predict(features), 0, None)
        
        return point, low, high

# Singleton instance
model_repository = ModelRepository()
