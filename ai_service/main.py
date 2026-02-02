from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import uvicorn

app = FastAPI()

print("Loading text model...")
text_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Text model loaded.")

# ===============================
# DEPARTMENT KNOWLEDGE BASE
# ===============================
DEPARTMENT_PROFILES = {
    "roads": [
        "road maintenance",
        "potholes",
        "street repair",
        "asphalt",
        "pavement",
        "footpath",
        "road infrastructure",
        "public works",
        "road safety",
        "street inspection",
        "drainage along roads",
        "civic road complaints"
    ],
    "water": [
        "water supply",
        "pipeline",
        "water leakage",
        "drinking water",
        "valve repair",
        "water distribution"
    ],
    "sanitation": [
        "garbage",
        "waste collection",
        "cleanliness",
        "sanitation workers",
        "solid waste"
    ],
    "streetlight": [
        "streetlight",
        "lamp post",
        "lighting",
        "electrical maintenance"
    ]
}

class OfficerScreeningRequest(BaseModel):
    text: str
    department: str
    designation: str | None = None
    document_url: str | None = None

def normalize(text: str) -> str:
    return text.lower().strip()

@app.post("/screen-officer")
def screen_officer(request: OfficerScreeningRequest):
    try:
        if not request.text or len(request.text.strip()) < 100:
            return {
                "ai_score": 0.0,
                "ai_result": "NOT_CHECKED",
                "ai_reason": "Insufficient readable document text"
            }

        department = normalize(request.department)
        if department not in DEPARTMENT_PROFILES:
            return {
                "ai_score": 0.0,
                "ai_result": "FLAGGED",
                "ai_reason": f"Unknown department: {request.department}"
            }

        doc_text = normalize(request.text)
        keywords = DEPARTMENT_PROFILES[department]

        keyword_hits = sum(1 for kw in keywords if kw in doc_text)
        keyword_score = keyword_hits / len(keywords)

        reference_text = f"{department} department responsibilities include " + ", ".join(keywords)

        doc_embedding = text_model.encode(doc_text)
        ref_embedding = text_model.encode(reference_text)

        semantic_score = float(util.cos_sim(doc_embedding, ref_embedding)[0][0])
        final_score = (semantic_score * 0.6) + (keyword_score * 0.4)

        if final_score >= 0.60:
            result = "APPROVED"
            reason = "Strong match with department responsibilities"
        elif final_score >= 0.35:
            result = "PENDING_REVIEW"
            reason = "Moderate match, requires manual verification"
        else:
            result = "REJECTED"
            reason = "Weak or no match with department responsibilities"

        return {
            "ai_score": round(final_score, 2),
            "ai_result": result,
            "ai_reason": reason
        }

    except Exception as e:
        print("AI ERROR:", str(e))
        raise HTTPException(status_code=500, detail="AI screening failed")

@app.get("/")
def health():
    return {"status": "Officer AI Service Running"}


class IssueAnalysisRequest(BaseModel):
    image: str | None = None
    text: str | None = None

@app.post("/analyze")
def analyze_issue(request: IssueAnalysisRequest):
    try:
        text = request.text or ""
        # If no text, we can't do much with just local embedding model for images
        # In a real app, we would use a VLM (Vision Language Model) here.
        if not text or len(text.strip()) < 5:
             return {
                "category": "Uncategorized",
                "ai_status": "PENDING_REVIEW",
                "ai_confidence": 0.0,
                "ai_reason": "No description provided for analysis"
            }

        # Classify based on text
        norm_text = normalize(text)
        embedding = text_model.encode(norm_text)
        
        best_category = "Uncategorized"
        best_score = 0.0
        
        for dept, keywords in DEPARTMENT_PROFILES.items():
             # Create a prototype sentence for the department
             ref_text = f"This is an issue regarding {dept}. " + ", ".join(keywords)
             ref_embedding = text_model.encode(ref_text)
             
             score = float(util.cos_sim(embedding, ref_embedding)[0][0])
             
             if score > best_score:
                 best_score = score
                 best_category = dept.capitalize()

        if best_score > 0.4:
            return {
                "category": best_category,
                "ai_status": "CATEGORIZED",
                "ai_confidence": round(best_score, 2),
                "ai_reason": f"Matched with {best_category} related terms"
            }
        elif best_score < 0.25:
             return {
                "category": "Flagged",
                "ai_status": "FLAGGED",
                "ai_confidence": round(best_score, 2),
                "ai_reason": "Content seems irrelevant or unintelligible"
            }
        else:
             return {
                "category": "Uncategorized",
                "ai_status": "PENDING_REVIEW",
                "ai_confidence": round(best_score, 2),
                "ai_reason": "Low confidence in automatic categorization"
            }

    except Exception as e:
        print("ANALYSIS ERROR:", str(e))
        return {
            "category": "Uncategorized",
            "ai_status": "ERROR",
            "ai_confidence": 0.0,
            "ai_reason": "AI Service Error"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
