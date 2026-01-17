import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib

# =================================================
# PATHS
# =================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CSV_PATH = os.path.join(BASE_DIR, "career_dataset.csv")

MODEL_PATH = os.path.join(BASE_DIR, "career_model.pkl")
LE_DEGREE_PATH = os.path.join(BASE_DIR, "le_degree.pkl")
LE_FIELD_PATH = os.path.join(BASE_DIR, "le_field.pkl")
LE_ROLE_PATH = os.path.join(BASE_DIR, "le_role.pkl")

print("Loading dataset from:", CSV_PATH)

# =================================================
# LOAD DATA
# =================================================
df = pd.read_csv(CSV_PATH)

# =================================================
# REQUIRED COLUMNS CHECK
# =================================================
REQUIRED_COLUMNS = [
    "degree",
    "field",
    "gpa",
    "experience",
    "graduation_year",
    "skills",
    "target_role",
]

missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
if missing:
    raise ValueError(f"❌ Missing columns in CSV: {missing}")

# =================================================
# CLEAN DATA
# =================================================
df["skills"] = df["skills"].fillna("")
df["experience"] = df["experience"].fillna(0)
df["gpa"] = df["gpa"].fillna(df["gpa"].median())

# =================================================
# 🚫 ALLOWED ROLES (HARD FILTER)
# =================================================
ALLOWED_ROLES = [
    "Data Scientist",
    "Software Engineer",
    "Web Developer",
    "ML Engineer",
    "Mechanical Engineer",
    "Civil Engineer",
    "Electrical Engineer",
    "Business Analyst",
    "System Analyst",
    "AI Specialist",
]

df = df[df["target_role"].isin(ALLOWED_ROLES)].reset_index(drop=True)

print("🎯 Roles used for training:")
print(df["target_role"].value_counts())

# =================================================
# ENCODERS
# =================================================
le_degree = LabelEncoder()
le_field = LabelEncoder()
le_role = LabelEncoder()

df["degree"] = le_degree.fit_transform(df["degree"])
df["field"] = le_field.fit_transform(df["field"])
df["target_role"] = le_role.fit_transform(df["target_role"])

# =================================================
# SKILLS → NUMERIC FEATURE
# =================================================
df["skill_count"] = df["skills"].apply(
    lambda x: len([s for s in str(x).split(",") if s.strip()])
)

# =================================================
# FEATURES / TARGET
# =================================================
FEATURE_COLUMNS = [
    "degree",
    "field",
    "gpa",
    "experience",
    "graduation_year",
    "skill_count",
]

X = df[FEATURE_COLUMNS]
y = df["target_role"]

# =================================================
# TRAIN / TEST SPLIT
# =================================================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

# =================================================
# MODEL (STABLE + NO OVERFITTING)
# =================================================
model = RandomForestClassifier(
    n_estimators=250,
    max_depth=14,
    min_samples_split=5,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1,
)

model.fit(X_train, y_train)

# =================================================
# EVALUATION
# =================================================
accuracy = model.score(X_test, y_test)
print(f"\n✅ Model accuracy: {accuracy:.4f}")

# =================================================
# SAVE MODEL & ENCODERS
# =================================================
joblib.dump(model, MODEL_PATH)
joblib.dump(le_degree, LE_DEGREE_PATH)
joblib.dump(le_field, LE_FIELD_PATH)
joblib.dump(le_role, LE_ROLE_PATH)

print("\n💾 Model and encoders saved successfully")

# =================================================
# DEBUG: ROLE MAPPING
# =================================================
print("\n🔎 Role label mapping:")
for i, role in enumerate(le_role.classes_):
    print(f"{i} → {role}")

# =================================================
# DEBUG: SAMPLE PREDICTION
# =================================================
sample = X_test.iloc[[0]]
pred = model.predict(sample)[0]
probs = model.predict_proba(sample)[0]

print("\n🧪 SAMPLE INPUT:")
print(sample)

print("\n🧠 Predicted role:", le_role.inverse_transform([pred])[0])

print("\n📊 TOP 3 PREDICTIONS:")
for cls, prob in sorted(
    zip(model.classes_, probs),
    key=lambda x: x[1],
    reverse=True,
)[:3]:
    print(le_role.inverse_transform([cls])[0], "→", round(prob * 100, 2))
