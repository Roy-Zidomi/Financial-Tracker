from fastapi import FastAPI

from routes.health import router as health_router
from routes.insights import router as insights_router
from routes.predict import router as predict_router

app = FastAPI(
    title="Finance Tracker ML Service",
    version="1.0.0",
    description="ML inference service for category prediction, spending forecast, and financial insights.",
)

app.include_router(health_router)
app.include_router(predict_router)
app.include_router(insights_router)
