import os
import json
import joblib
import pandas as pd
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(BASE_DIR, "ml")

MODEL_PATH = os.path.join(ML_DIR, "career_model.pkl")
LE_DEGREE_PATH = os.path.join(ML_DIR, "le_degree.pkl")
LE_FIELD_PATH = os.path.join(ML_DIR, "le_field.pkl")
LE_ROLE_PATH = os.path.join(ML_DIR, "le_role.pkl")

model = None
le_degree = None
le_field = None
le_role = None


def load_models():
    global model, le_degree, le_field, le_role
    if model is None:
        model = joblib.load(MODEL_PATH)
        le_degree = joblib.load(LE_DEGREE_PATH)
        le_field = joblib.load(LE_FIELD_PATH)
        le_role = joblib.load(LE_ROLE_PATH)


def safe_encode(le, value):
    try:
        return le.transform([value])[0]
    except:
        return 0


def predict_job(data):
    load_models()

    degree_text = data.get("degree", "Unknown")
    field_text = data.get("field", "General")
    skills = data.get("skills", [])
    skill = skills[0] if skills else "General"

    cgpa = float(data.get("cgpa", 0))
    experience = int(data.get("experience", 0))
    graduation_year = int(data.get("graduation_year", 0))

    degree = safe_encode(le_degree, degree_text)
    field = safe_encode(le_field, field_text)

    X = pd.DataFrame([{
        "degree": degree,
        "field": field,
        "gpa": cgpa,
        "experience": experience,
        "graduation_year": graduation_year,
        "skill_count": len(skills)
    }])

    probs = model.predict_proba(X)[0]
    classes = model.classes_

    results = []
    for cls, prob in zip(classes, probs):
        role = le_role.inverse_transform([cls])[0]
        results.append({
            "role": role,
            "confidence": prob * 100
        })

    # ---------- SANITY RULE ----------
    for r in results:
        if degree_text.lower() == "b.tech" and field_text.lower() == "computer science":
            if r["role"].lower() == "research scientist":
                r["confidence"] -= 35
            if r["role"].lower() == "software engineer":
                r["confidence"] += 25

    for r in results:
        r["confidence"] = max(r["confidence"], 0)

    total = sum(r["confidence"] for r in results) or 1
    for r in results:
        r["confidence"] = round((r["confidence"] / total) * 100, 2)

    results.sort(key=lambda x: x["confidence"], reverse=True)

    return results[:3]
