from fastapi import APIRouter

from models.schemas import InsightGenerationRequest, InsightGenerationResponse
from services.insight_generator import InsightGenerator

router = APIRouter(prefix="/insights", tags=["insights"])

insight_generator = InsightGenerator()


@router.post("/generate", response_model=InsightGenerationResponse)
async def generate_insights(payload: InsightGenerationRequest):
    insights = insight_generator.generate(payload)
    return {"insights": insights}
