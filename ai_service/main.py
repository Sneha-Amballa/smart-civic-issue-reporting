from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from PIL import Image
import io
import base64
import numpy as np
import uvicorn

app = FastAPI()

# Load Models (Load once on startup)
# Using a lightweight CLIP model and S-BERT
print("Loading AI Models... This may take a moment.")
vision_model = SentenceTransformer('clip-ViT-B-32')
text_model = SentenceTransformer('all-MiniLM-L6-v2')
print("AI Models Loaded.")

# Candidate Categories with descriptions for matching
CATEGORIES = {
    "Road / Pothole": ["A photo of a pothole", "damaged road", "cracked asphalt", "road construction"],
    "Garbage": ["A photo of garbage", "pile of trash", "waste dump", "overflowing dustbin", "litter"],
    "Water Leakage": ["A photo of water leakage", "burst pipe", "flooded street", "stagnant water"],
    "Streetlight": ["A photo of a streetlight", "broken street lamp", "dark street", "non-functional light"],
    "Public Safety": ["A photo of a safety hazard", "open manhole", "hanging wires", "fallen tree"],
    "Other": ["Civic issue", "public problem"]
}

class AnalyzeRequest(BaseModel):
    image: str # Base64 string
    text: str

@app.get("/")
def home():
    return {"status": "AI Service Running"}

@app.post("/analyze")
def analyze_issue(request: AnalyzeRequest):
    try:
        # 1. Decode Image
        try:
            # Handle data:image/png;base64, prefix if present
            img_str = request.image
            if "," in img_str:
                img_str = img_str.split(",")[1]
            
            image_data = base64.b64decode(img_str)
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

        # 2. Image Analysis (CLIP)
        # We encode the image and compare against category descriptions
        image_embedding = vision_model.encode(image)
        
        image_scores = {}
        for cat, prompts in CATEGORIES.items():
            # Compare image against prompts for this category
            prompt_embeddings = vision_model.encode(prompts)
            # Compute cosine similarity
            cos_scores = util.cos_sim(image_embedding, prompt_embeddings)[0]
            # Take max score for this category
            image_scores[cat] = float(np.max(cos_scores.numpy()))

        # 3. Text Analysis (S-BERT)
        text_scores = {}
        if request.text and len(request.text.strip()) > 0:
            text_embedding = text_model.encode(request.text)
            for cat, prompts in CATEGORIES.items():
                prompt_embeddings = text_model.encode(prompts)
                cos_scores = util.cos_sim(text_embedding, prompt_embeddings)[0]
                text_scores[cat] = float(np.max(cos_scores.numpy()))
        else:
            # If no text, use 0
            for cat in CATEGORIES:
                text_scores[cat] = 0.0

        # 4. Fusion
        # Weighted average: Image 60%, Text 40% (since image is primary evidence)
        final_scores = {}
        for cat in CATEGORIES:
            img_s = image_scores.get(cat, 0)
            txt_s = text_scores.get(cat, 0)
            
            # Boost if both are high
            if request.text:
                final_scores[cat] = (img_s * 0.6) + (txt_s * 0.4)
            else:
                final_scores[cat] = img_s

        # 5. Result
        best_category = max(final_scores, key=final_scores.get)
        confidence = final_scores[best_category]
        
        # Threshold for verification
        ai_status = "Verified" if confidence > 0.25 else "Flagged" # Open threshold

        return {
            "category": best_category,
            "ai_status": ai_status,
            "ai_confidence": round(confidence, 4),
            "ai_reason": f"Detected {best_category} with {round(confidence*100, 1)}% confidence based on visual and semantic analysis."
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
