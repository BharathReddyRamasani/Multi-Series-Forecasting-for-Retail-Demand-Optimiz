"""Reports router — generate a downloadable model-performance report."""
import csv
import io
import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter()


@router.get("/generate")
async def generate_report(request: Request, type: str = "csv"):
    """Generate a real report from the loaded model's test metrics.

    Returns a CSV or JSON file containing the honest test metrics and top
    feature importances — no external/fake URLs.
    """
    forecaster = request.app.state.forecaster
    if not forecaster.is_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")

    metrics = forecaster.metrics
    importance = forecaster.feature_importance[:20]

    if type.lower() == "json":
        payload = {
            "model": forecaster.metadata.get("model_name", "lightgbm"),
            "training_date": forecaster.metadata.get("training_date"),
            "metrics": metrics,
            "top_features": importance,
        }
        buf = io.BytesIO()
        buf.write(json.dumps(payload, indent=2).encode("utf-8"))
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=forecast_report.json"},
        )

    # Default: CSV
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["section", "key", "value"])
    for k, v in metrics.items():
        writer.writerow(["metrics", k, v])
    for i, item in enumerate(importance, 1):
        writer.writerow(["feature_importance", f"{i}:{item['feature']}", item["importance"]])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=forecast_report.csv"},
    )
