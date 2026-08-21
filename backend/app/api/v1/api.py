from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, athletes, sports, assessments, storage,
    leaderboard, scouts, achievements, community,
    connections, messages, blocks, reports, notifications,
    fitness_tests
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(athletes.router, prefix="/athletes", tags=["Athletes"])
api_router.include_router(achievements.router, prefix="/achievements", tags=["Achievements"])
api_router.include_router(community.router, prefix="/community", tags=["Community"])
api_router.include_router(connections.router, prefix="/connections", tags=["Connections"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages & Conversations"])
api_router.include_router(blocks.router, prefix="/blocks", tags=["User Blocking"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Moderation"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(sports.router, prefix="/sports", tags=["Sports & Drills"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(storage.router, prefix="/storage", tags=["Storage & Video"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
api_router.include_router(scouts.router, prefix="/scout", tags=["Scouts & Coaches"])
api_router.include_router(fitness_tests.router, prefix="/fitness-tests", tags=["Fitness Tests"])
