from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from transformers import CLIPProcessor, CLIPModel, M2M100ForConditionalGeneration, M2M100Tokenizer
from PIL import Image
from typing import List
import uvicorn
import base64
import io
import torch
import numpy as np
from langdetect import detect as detect_lang
from contextlib import asynccontextmanager



# app will be initialized after lifespan definition

# ===============================

# ===============================
# LOAD MODELS (DEFERRED)
# ===============================
text_model = None
clip_model = None
clip_processor = None
translate_tokenizer = None
translate_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global text_model, clip_model, clip_processor, translate_tokenizer, translate_model
    try:
        print("Loading SentenceTransformer...")
        text_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("SentenceTransformer Loaded.")

        print("Loading CLIP...")
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        print("CLIP Loaded.")

        print("Loading M2M100 translation model (facebook/m2m100_418M)...")
        # Use M2M100 which supports 100+ languages including Hindi and Telugu
        model_name = "facebook/m2m100_418M"
        translate_tokenizer = M2M100Tokenizer.from_pretrained(model_name)
        translate_model = M2M100ForConditionalGeneration.from_pretrained(model_name)
        print("M2M100 Translation model loaded.")
    except Exception as e:
        print(f"Failed to load models during startup: {e}")
    
    yield
    
    # Shutdown
    pass


app = FastAPI(lifespan=lifespan)

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
        "road damage"
    ],
    "water": [
        "water supply",
        "pipeline",
        "water leakage",
        "drinking water"
    ],
    "sanitation": [
        "garbage",
        "waste collection",
        "cleanliness",
        "hygiene",
        "sanitation and hygiene",
        "sanitation & hygiene",
        "public health",
        "sanitary"
    ],
    "drainage": [
        "drainage",
        "sewage",
        "storm water",
        "drain blockage",
        "drain cleaning",
        "wastewater",
        "drainage maintenance"
    ],
    "streetlight": [
        "streetlight",
        "street lighting",
        "lamp post",
        "lighting"
    ],
    "solid_waste": [
        "solid waste",
        "waste management",
        "garbage collection",
        "waste segregation",
        "landfill",
        "municipal waste",
        "sanitation"
    ],
    "parks": [
        "parks",
        "horticulture",
        "garden",
        "tree maintenance",
        "green spaces",
        "recreation"
    ],
    "general": [
        "municipal",
        "civic",
        "department",
        "officer",
        "employee",
        "identity"
    ]
}

DEPARTMENT_ALIASES = {
    "roads": ["road", "roads department", "public works", "pwd"],
    "water": ["water supply", "water board", "water works", "jal", "drinking water"],
    "sanitation": ["sanitation & hygiene", "hygiene", "cleaning department", "swachh"],
    "drainage": ["drainage system", "drain", "sewer", "sewage", "stormwater"],
    "streetlight": ["street light", "street lighting", "electrical", "lighting department", "lamp post"],
    "solid_waste": ["solid waste management", "swm", "waste management", "garbage department"],
    "parks": ["parks & recreation", "park", "horticulture", "recreation"],
    "general": ["other", "misc", "miscellaneous", "general"]
}

ISSUE_CATEGORIES = [
    "pothole on road",
    "garbage on street",
    "broken streetlight",
    "water leakage",
    "road damage",
    "drainage blockage"
]
CIVIC_PROMPTS = [
    "A real-world outdoor public road with potholes, cracks, or damaged asphalt",
    "A real-world outdoor public area with garbage, litter, or overflowing waste",
    "A real-world outdoor streetlight pole or public lighting infrastructure",
    "A real-world outdoor public water leakage from pipelines or water flowing on roads",
    "A real-world outdoor drainage issue such as clogged drains, sewage overflow, or open manholes"

]

TRAP_PROMPTS = [
    "A screenshot of a computer screen showing civic issue reports or forms",
    "A printed document or paper with text about civic issues",
    "A photo taken indoors of a computer screen or mobile phone displaying civic content",
    "A close-up photo of a person reporting a civic issue",
    "A very blurry, dark, or corrupted image with no recognizable civic infrastructure",
    "A cartoon, drawing, or artificial image of civic problems"
]

ISSUE_CATEGORIES = CIVIC_PROMPTS + TRAP_PROMPTS

# Mapping descriptive prompts back to backend department names
PROMPT_TO_DEPT = {
    "A real-world outdoor public road with potholes, cracks, or damaged asphalt": "Roads",
    "A real-world outdoor public area with garbage, litter, or overflowing waste": "Sanitation",
    "A real-world outdoor streetlight pole or public lighting infrastructure": "Streetlight",
    "A real-world outdoor public water leakage from pipelines or water flowing on roads": "Water",
    "A real-world outdoor drainage issue such as clogged drains, sewage overflow, or open manholes": "Drainage",
    "A private indoor room with ceiling fan, indoor lighting, furniture, or curtains": "Flagged",
    "A close-up photo of a person or human face": "Flagged",
    "A photo of paper, printed text, mobile screen, or digital display": "Flagged",
    "A very blurry or dark image with no clear subject": "Flagged"
}



# ===============================
# HELPERS
# ===============================
def normalize(text: str):
    return text.lower().strip()


def canonical_department(raw_department: str):
    dep = normalize(raw_department or "")
    if dep in DEPARTMENT_PROFILES:
        return dep

    for canonical, aliases in DEPARTMENT_ALIASES.items():
        for alias in aliases:
            alias_norm = normalize(alias)
            if dep == alias_norm or alias_norm in dep or dep in alias_norm:
                return canonical

    # Common punctuation/spacing variants.
    compact = dep.replace("&", "and").replace("_", " ")
    compact = " ".join(compact.split())
    for canonical in DEPARTMENT_PROFILES.keys():
        if canonical in compact:
            return canonical

    return dep


def classify_image_from_base64(base64_str):
    try:
        import requests
        if base64_str.startswith("http"):
            response = requests.get(base64_str, timeout=10)
            image = Image.open(io.BytesIO(response.content)).convert("RGB")
        else:
            print(f"DEBUG: Image data length: {len(base64_str)}")
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            image_data = base64.b64decode(base64_str)
            print("DEBUG: Image decoded.")
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            print(f"DEBUG: Image size: {image.size}")

        # ADD: Skip obviously invalid images
        width, height = image.size
        if width < 50 or height < 50:
            print(f"DEBUG: Image too small ({width}x{height}), skipping classification")
            return None
        if width * height < 10000:  # Less than 100x100 pixels
            print(f"DEBUG: Image resolution too low ({width}x{height}), skipping classification")
            return None

        inputs = clip_processor(
            text=ISSUE_CATEGORIES,
            images=image,
            return_tensors="pt",
            padding=True
        )

        with torch.no_grad():
            outputs = clip_model(**inputs)

        print(f"DEBUG: Logits shape: {outputs.logits_per_image.shape}")
        # Use softmax to get mutually exclusive probabilities
        probs = torch.softmax(outputs.logits_per_image, dim=1)[0].detach().cpu().numpy()
        print(f"DEBUG: Probs: {probs}")

        civic_probs = probs[:len(CIVIC_PROMPTS)]
        trap_probs = probs[len(CIVIC_PROMPTS):]

        best_civic_idx = int(np.argmax(civic_probs))
        best_trap_idx = int(np.argmax(trap_probs))
        print(f"DEBUG: Best Civic: {best_civic_idx} ({civic_probs[best_civic_idx]}), Best Trap: {best_trap_idx} ({trap_probs[best_trap_idx]})")

        return {
            "civic_score": float(civic_probs[best_civic_idx]),
            "civic_prompt": CIVIC_PROMPTS[best_civic_idx],
            "trap_score": float(trap_probs[best_trap_idx]),
            "trap_prompt": TRAP_PROMPTS[best_trap_idx],
            "best_overall_prompt": ISSUE_CATEGORIES[int(np.argmax(probs))]
        }

    except Exception as e:
        print("Image Error:", e)
        return None


def classify_text(text):
    if text_model is None:
        return None
    
    norm_text = normalize(text)

    embedding = text_model.encode(norm_text)

    best_category = "Uncategorized"
    best_score = 0.0

    for dept, keywords in DEPARTMENT_PROFILES.items():

        ref_text = f"This is issue related to {dept}. " + ", ".join(keywords)

        ref_embedding = text_model.encode(ref_text)

        score = float(util.cos_sim(embedding, ref_embedding)[0][0])

        if score > best_score:
            best_score = score
            best_category = dept.capitalize()

    return {
        "category": best_category,
        "confidence": round(best_score, 2)
    }


# ===============================
# REQUEST MODELS
# ===============================
class IssueAnalysisRequest(BaseModel):
    image: str | None = None
    text: str | None = None


class OfficerScreeningRequest(BaseModel):
    text: str
    department: str
    designation: str | None = None
    document_url: str | None = None


class CandidateIssue(BaseModel):
    id: int
    text: str
    latitude: float
    longitude: float
    hours_diff: float


class DuplicateCheckRequest(BaseModel):
    new_text: str
    new_lat: float
    new_lng: float
    candidates: List[CandidateIssue]


class TranslationRequest(BaseModel):
    text: str
    target_lang: str = "en"


# ===============================
# ISSUE ANALYSIS API
# ===============================
@app.post("/analyze")
def analyze_issue(request: IssueAnalysisRequest):
    try:
        print(f"DEBUG: Request received: image_present={request.image is not None}, text='{request.text}'")

        image_result = None
        text_result = None

        # IMAGE CLASSIFICATION
        if request.image:
            print("DEBUG: Processing image...")
            image_result = classify_image_from_base64(request.image)
            print(f"DEBUG: Image result: {image_result is not None}")

        # TEXT CLASSIFICATION
        if request.text and len(request.text.strip()) >= 1:
            print(f"DEBUG: Calling classify_text with: '{request.text}'")
            text_result = classify_text(request.text)
            print(f"DEBUG: Text result: {text_result}")
        elif request.text and len(request.text.strip()) > 0:
            # Handle short text with low confidence
            text_result = {
                "category": "Uncategorized",
                "confidence": 0.1  # Low confidence for short text
            }
            print(f"DEBUG: Short text detected, using low confidence")

        # FUSION LOGIC AND FINAL DECISION
        if image_result:
            trap_score = image_result["trap_score"]
            civic_score = image_result["civic_score"]
            predicted_category = PROMPT_TO_DEPT.get(image_result["civic_prompt"], "Other")

            # Final Decision Logic (Improved)
            # Step 1: Strong trap detection (high confidence invalid content)
            if trap_score > 0.8:
                category = "FLAGGED"
            # Step 2: Civic classification (sufficient confidence)
            elif civic_score > 0.7:
                category = predicted_category
            # Step 3: Uncertain cases
            else:
                category = "REVIEW_REQUIRED"

            final_confidence = max(trap_score, civic_score)
            scene = "Indoor/Unclear" if "indoor" in image_result["trap_prompt"].lower() or trap_score > civic_score else "Outdoor"
            ai_status = "CATEGORIZED" if category not in ["FLAGGED", "REVIEW_REQUIRED"] else "FLAGGED"
            
            if category == "REVIEW_REQUIRED":
                 final_category = predicted_category # Preserve the guess but status is pending
            else:
                 final_category = category

            # Multi-line Reason Format
            reason_parts = [
                f"Scene: {scene}",
                f"Category: {final_category}",
                f"Confidence: {round(final_confidence, 2)}",
                "",
                f"Reason:"
            ]
            
            if trap_score > 0.5:
                reason_parts.append(f"- FLAGGED: High confidence detection of invalid content ({round(trap_score, 2)})")
                reason_parts.append(f"- This may be a screenshot, printed image, or photo taken indoors")
            else:
                reason_parts.append(f"- Scene detected: Civic ({round(civic_score, 2)}), Trap ({round(trap_score, 2)})")
                
            reason_parts.extend([
                f"- Key objects: {image_result['best_overall_prompt']}",
                f"- Final decision: {category}"
            ])
            
            reason = "\n".join(reason_parts)
        elif text_result:
            # Text-only classification
            final_category = text_result["category"]
            final_confidence = text_result["confidence"]
            ai_status = "CATEGORIZED" if final_confidence >= 0.7 else "FLAGGED"  # Lower threshold for text-only
            reason = (
                f"Category: {final_category}\n"
                f"Confidence: {round(final_confidence, 2)}\n\n"
                f"Reason:\n"
                f"- Text-based classification\n"
                f"- Semantic similarity score: {round(final_confidence, 2)}"
            )
        else:
            # No valid image or text - but provide better feedback
            if request.text and len(request.text.strip()) > 0:
                return {
                    "category": "Uncategorized",
                    "ai_status": "FLAGGED",
                    "ai_confidence": 0.1,
                    "ai_reason": f"Text too short for reliable classification. Please provide more details.\n\nText length: {len(request.text.strip())} characters"
                }
            else:
                return {
                    "category": "Uncategorized",
                    "ai_status": "FLAGGED",
                    "ai_confidence": 0.0,
                    "ai_reason": "No valid image/text provided. Please include a photo and/or description of the issue."
                }

        return {
            "category": final_category if final_category != "FLAGGED" else "Flagged",
            "ai_status": ai_status,
            "ai_confidence": round(final_confidence, 2),
            "ai_reason": reason
        }

    except Exception as e:
        print("ANALYSIS ERROR:", e)

        return {
            "category": "Uncategorized",
            "ai_status": "ERROR",
            "ai_confidence": 0.0,
            "ai_reason": "AI Service Error"
        }


# ===============================
# OFFICER SCREENING
# ===============================
@app.post("/screen-officer")
def screen_officer(request: OfficerScreeningRequest):

    try:
        if text_model is None:
            raise HTTPException(status_code=503, detail="Text model not available")

        department_input = normalize(request.department)
        department = canonical_department(request.department)
        extracted_text = " ".join((request.text or "").split())
        extracted_text_norm = normalize(extracted_text)

        if department not in DEPARTMENT_PROFILES:
            return {
                "ai_score": 0.0,
                "ai_result": "FLAGGED",
                "ai_reason": f"Unknown Department: {department_input}"
            }

        if len(extracted_text_norm) < 30:
            return {
                "ai_score": 0.0,
                "ai_result": "PENDING_REVIEW",
                "ai_reason": "Insufficient extracted text from document"
            }

        doc_embedding = text_model.encode(extracted_text_norm)

        expected_markers = [
            "department",
            "designation",
            "employee",
            "officer",
            "municipal",
            "government",
            "authority",
            "certificate",
            "appointment",
            "id"
        ]
        if request.designation:
            expected_markers.append(normalize(request.designation))

        department_signals = set(
            [department]
            + DEPARTMENT_PROFILES[department]
            + DEPARTMENT_ALIASES.get(department, [])
        )

        reference_lines = [
            f"Official document for {department} department officer",
            " ".join(DEPARTMENT_PROFILES[department]),
            " ".join(expected_markers)
        ]
        ref_text = " ".join(reference_lines)

        ref_embedding = text_model.encode(ref_text)

        semantic_score = float(util.cos_sim(doc_embedding, ref_embedding)[0][0])
        semantic_score = max(0.0, min(1.0, (semantic_score + 1.0) / 2.0))

        keyword_hits = 0
        all_keywords = set(list(department_signals) + expected_markers)
        for kw in all_keywords:
            if kw and kw in extracted_text_norm:
                keyword_hits += 1

        keyword_score = keyword_hits / max(1, len(all_keywords))

        text_length_score = min(len(extracted_text_norm) / 500, 1.0)

        has_department_line = (
            "department" in extracted_text_norm
            and any(sig in extracted_text_norm for sig in department_signals)
        )
        has_identity_markers = any(
            marker in extracted_text_norm
            for marker in ["id", "id no", "designation", "employee", "officer"]
        )
        has_designation_match = (
            bool(request.designation)
            and normalize(request.designation) in extracted_text_norm
        )

        signal_bonus = 0.0
        if has_department_line:
            signal_bonus += 0.12
        if has_identity_markers:
            signal_bonus += 0.04
        if has_designation_match:
            signal_bonus += 0.04

        final_score = (
            (semantic_score * 0.55)
            + (keyword_score * 0.25)
            + (text_length_score * 0.10)
            + signal_bonus
        )
        final_score = round(max(0.0, min(1.0, final_score)), 2)

        if final_score >= 0.62:
            result = "APPROVED"
            reason = "Strong department and document marker match"
        elif final_score >= 0.35:
            result = "PENDING_REVIEW"
            reason = "Moderate match, requires manual verification"
        else:
            result = "FLAGGED"
            reason = "Low relevance between document text and selected department"

        return {
            "ai_score": final_score,
            "ai_result": result,
            "ai_reason": reason
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Officer Screening Failed")


# ===============================
# DUPLICATE CHECK
# ===============================
@app.post("/check-duplicate")
def check_duplicate(request: DuplicateCheckRequest):

    try:
        if not request.candidates:
            return {
                "is_duplicate": False,
                "master_issue_id": None,
                "score": 0.0
            }

        new_embedding = text_model.encode(request.new_text)

        highest_score = 0
        best_match = None

        for candidate in request.candidates:

            cand_embedding = text_model.encode(candidate.text)

            sim = float(util.cos_sim(new_embedding, cand_embedding)[0][0])

            if sim > highest_score:
                highest_score = sim
                best_match = candidate.id

        return {
            "is_duplicate": highest_score >= 0.75,
            "master_issue_id": best_match if highest_score >= 0.75 else None,
            "score": round(highest_score, 2)
        }

    except:
        return {
            "is_duplicate": False,
            "master_issue_id": None,
            "score": 0.0
        }


@app.post("/translate")
def translate(request: TranslationRequest):
    try:
        if not request.text or len(request.text.strip()) == 0:
            return {"translated_text": "", "was_translated": False}

        detected = detect_lang(request.text)
        
        # If already in target language, return as is
        if detected == request.target_lang:
            return {
                "translated_text": request.text,
                "detected_language": detected,
                "was_translated": False
            }

        # Force language codes to M2M100 format if necessary
        # M2M100 uses standard ISO codes
        src_lang = detected
        tgt_lang = request.target_lang
        
        # Set source language
        translate_tokenizer.src_lang = src_lang
        
        encoded_text = translate_tokenizer(request.text, return_tensors="pt")
        
        # Generate translation
        generated_tokens = translate_model.generate(
            **encoded_text, 
            forced_bos_token_id=translate_tokenizer.get_lang_id(tgt_lang)
        )
        
        result = translate_tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]

        return {
            "translated_text": result,
            "detected_language": detected,
            "target_language": tgt_lang,
            "was_translated": True
        }
    except Exception as e:
        print(f"Translation Error: {e}")
        return {
            "translated_text": request.text,
            "detected_language": "unknown",
            "was_translated": False,
            "error": str(e)
        }


@app.get("/")
def health():
    return {"status": "AI Service Running"}


@app.get("/debug")
def debug():
    return {
        "text_model_loaded": text_model is not None,
        "clip_model_loaded": clip_model is not None,
        "translate_model_loaded": translate_model is not None
    }


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)