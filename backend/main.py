from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from pathlib import Path
import json

load_dotenv()

app = FastAPI(title="ElderGuard AI Backend", version="1.0.0")

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4173", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client (with error handling for httpx compatibility)
try:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"Warning: OpenAI client initialization had issues: {e}")
    print("API responses will use mock fallback.")
    client = None

class AssessmentInput(BaseModel):
    meals: str
    outings: str
    activities: str
    interactions: str
    mood: str
    moodScore: int
    socialConnections: str
    familyContact: str
    notes: str
    uclaLoneliness: int

class AssessmentResult(BaseModel):
    risk: str
    summary: str
    recommendations: list
    alert: str = None

class ProfileInput(BaseModel):
    name: str
    age: str
    gender: str
    location: str
    familyContact: str
    appetite: str
    mood: str
    mobility: str
    sleepQuality: str
    lonelinessScore: int
    notes: str

class ElderlyProfile(ProfileInput):
    id: str
    risk: str
    createdAt: str

DATA_DIR = Path(__file__).resolve().parent / 'data'
PROFILE_DB = DATA_DIR / 'profiles.json'

DATA_DIR.mkdir(exist_ok=True)
if not PROFILE_DB.exists():
    PROFILE_DB.write_text('[]', encoding='utf-8')


def load_profiles() -> list[ElderlyProfile]:
    try:
        raw = PROFILE_DB.read_text(encoding='utf-8')
        return [ElderlyProfile(**item) for item in json.loads(raw or '[]')]
    except Exception:
        return []


def save_profiles(profiles: list[ElderlyProfile]) -> None:
    PROFILE_DB.write_text(json.dumps([profile.dict() for profile in profiles], indent=2), encoding='utf-8')

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ElderGuard AI Backend"}

@app.post("/api/assess", response_model=AssessmentResult)
async def assess_elder(assessment: AssessmentInput):
    """
    Analyze elder's condition using AI
    Returns risk level, summary, and recommendations
    """
    try:
        # Build context for AI
        context = f"""
        Elder Assessment Data:
        - Meals: {assessment.meals}
        - Outings this week: {assessment.outings}
        - Activities: {assessment.activities}
        - Social interactions: {assessment.interactions}
        - Current mood: {assessment.mood}
        - Mood score (1-5): {assessment.moodScore}
        - Social connections: {assessment.socialConnections}
        - Family contact: {assessment.familyContact}
        
        UCLA Loneliness Scale Score: {assessment.uclaLoneliness}/20
        (Range: 5-9=Low, 10-15=Moderate, 16-20=High loneliness)
        
        Additional notes: {assessment.notes}
        
        Based on this comprehensive data (especially the UCLA Loneliness Scale), provide:
        1. A risk level (Low/Medium/High) - Weight UCLA score heavily in your assessment
        2. A behavioral summary (2-3 sentences)
        3. 3-4 specific, actionable recommendations
        4. An alert message if risk is high
        
        Return ONLY valid JSON without code blocks in this format:
        {{
            "risk": "Low|Medium|High",
            "summary": "...",
            "recommendations": ["...", "...", "..."],
            "alert": "..."
        }}
        """

        # Call OpenAI if client is available
        if client is None:
            print("OpenAI client not available, using mock assessment")
            return mock_assessment(assessment)

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert geriatric loneliness detection AI. Analyze elderly care data and provide compassionate but accurate risk assessments."},
                {"role": "user", "content": context}
            ],
            temperature=0.7,
            max_tokens=500
        )

        # Parse response
        result_text = response.choices[0].message.content
        
        # Remove markdown code blocks if present
        result_text = result_text.replace("```json", "").replace("```", "").strip()
        
        import json
        try:
            result_data = json.loads(result_text)
        except json.JSONDecodeError:
            # Fallback to mock if JSON parsing fails
            result_data = mock_assessment(assessment)

        return AssessmentResult(**result_data)

    except Exception as e:
        print(f"Error: {e}")
        # Fallback to mock assessment
        return mock_assessment(assessment)

def mock_assessment(assessment: AssessmentInput) -> AssessmentResult:
    """Fallback mock assessment if AI fails"""
    try:
        interactions = int(assessment.interactions) if assessment.interactions.isdigit() else 0
    except:
        interactions = 0
    
    try:
        mood_score = int(assessment.moodScore)
    except:
        mood_score = 3
    
    # Determine risk based on UCLA loneliness score primarily, then other factors
    ucla_score = assessment.uclaLoneliness
    
    # High risk: UCLA score 16-20 OR combination of severe factors
    if ucla_score >= 16 or (assessment.mood in ["Sad", "Withdrawn"] and (interactions < 3 or mood_score < 2)):
        return AssessmentResult(
            risk="High",
            summary=f"UCLA Loneliness Scale score of {ucla_score}/20 indicates significant loneliness. Combined with other behavioral indicators, immediate intervention is recommended.",
            recommendations=[
                "Increase frequency of family or volunteer visits",
                "Arrange for group activities or social programs",
                "Consider counseling or peer support groups",
                "Schedule regular check-ins and meaningful conversations"
            ],
            alert=f"🚨 High loneliness alert (UCLA: {ucla_score}/20). Immediate care attention recommended."
        )
    
    # Medium risk: UCLA score 10-15 OR moderate isolation signals
    elif ucla_score >= 10 or assessment.mood == "Neutral" or (interactions < 7 and interactions >= 3):
        return AssessmentResult(
            risk="Medium",
            summary=f"UCLA Loneliness Scale score of {ucla_score}/20 suggests moderate loneliness. Consider increasing social engagement and support.",
            recommendations=[
                "Introduce weekly group activities or hobbies",
                "Increase family contact frequency to 2-3 times weekly",
                "Encourage participation in community events",
                "Track mood patterns and social engagement trends"
            ]
        )
    
    # Low risk: UCLA score 5-9 AND positive social indicators
    else:
        return AssessmentResult(
            risk="Low",
            summary=f"UCLA Loneliness Scale score of {ucla_score}/20 indicates low loneliness. Positive social patterns and engagement are present.",
            recommendations=[
                "Maintain current social routines and activities",
                "Continue regular family contact and outings",
                "Encourage hobbies and interests that bring joy",
                "Monitor for any changes in mood or social engagement"
            ]
        )

@app.get("/api/trends")
async def get_trends():
    """Get historical trend data"""
    return {
        "weeklyData": [
            {"day": "Mon", "riskScore": 35, "interactions": 5, "mood": 3},
            {"day": "Tue", "riskScore": 42, "interactions": 4, "mood": 2},
            {"day": "Wed", "riskScore": 55, "interactions": 3, "mood": 2},
            {"day": "Thu", "riskScore": 68, "interactions": 2, "mood": 1},
            {"day": "Fri", "riskScore": 72, "interactions": 2, "mood": 1},
            {"day": "Sat", "riskScore": 65, "interactions": 3, "mood": 2},
            {"day": "Sun", "riskScore": 78, "interactions": 1, "mood": 1},
        ]
    }

@app.get("/api/recommendations/{risk_level}")
async def get_recommendations(risk_level: str):
    """Get recommendations based on risk level"""
    if risk_level.lower() == "high":
        return {
            "urgent": True,
            "recommendations": [
                "Schedule immediate family visit",
                "Arrange professional caregiver support",
                "Increase daily check-ins to 2-3x",
                "Consider therapeutic activities"
            ]
        }
    elif risk_level.lower() == "medium":
        return {
            "urgent": False,
            "recommendations": [
                "Weekly family visits planned",
                "Daily phone calls or video chats",
                "Group activity participation",
                "Hobby engagement sessions"
            ]
        }
    else:
        return {
            "urgent": False,
            "recommendations": [
                "Maintain current social routines",
                "Continue regular family contact",
                "Encourage continued activities",
                "Monitor for any changes"
            ]
        }

@app.get('/api/profiles', response_model=list[ElderlyProfile])
async def list_profiles(familyContact: str | None = None):
    """Return saved geriatric profiles."""
    profiles = load_profiles()
    if familyContact:
        return [profile for profile in profiles if profile.familyContact.strip().lower() == familyContact.strip().lower()]
    return profiles

from datetime import datetime

@app.post('/api/profiles', response_model=ElderlyProfile)
async def create_profile(profile: ProfileInput):
    """Create and persist a new geriatric profile."""
    profiles = load_profiles()
    now = datetime.utcnow()
    new_profile = ElderlyProfile(
        id=f"{int(now.timestamp())}-{len(profiles) + 1}",
        risk=assess_profile_risk(profile),
        createdAt=now.isoformat(timespec='seconds') + 'Z',
        **profile.dict()
    )
    profiles.insert(0, new_profile)
    save_profiles(profiles)
    return new_profile

@app.put('/api/profiles/{profile_id}', response_model=ElderlyProfile)
async def update_profile(profile_id: str, profile: ProfileInput):
    """Update an existing geriatric profile."""
    profiles = load_profiles()
    for index, existing in enumerate(profiles):
        if existing.id == profile_id:
            updated_profile = ElderlyProfile(
                id=existing.id,
                risk=assess_profile_risk(profile),
                createdAt=existing.createdAt,
                **profile.dict()
            )
            profiles[index] = updated_profile
            save_profiles(profiles)
            return updated_profile

    raise HTTPException(status_code=404, detail='Profile not found')


def assess_profile_risk(profile: ProfileInput) -> str:
    if profile.lonelinessScore >= 16 or profile.mobility == 'Limited' or profile.appetite == 'Poor':
        return 'High'
    if profile.lonelinessScore >= 12 or profile.mobility == 'Reduced' or profile.appetite == 'Fair':
        return 'Medium'
    return 'Low'

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
