import numpy as np

# =========================
# CONFIG (IMPORTANT)
# =========================
MODEL_TYPE = "tree"  
# options: "tree" or "linear"


# =========================
# LABEL ENCODING MAPS
# =========================
DEGREE_MAP = {
    "B.Tech": 1,
    "B.Sc": 2,
    "M.Tech": 3,
    "M.Sc": 4,
    "MBA": 5,
    "MCA": 6,
}

SPECIALIZATION_MAP = {
    "CSE": 1,
    "IT": 2,
    "ECE": 3,
    "EEE": 4,
    "Data Science": 5,
    "AI": 6,
    "Mechanical": 7,
}


# =========================
# ONE-HOT CATEGORIES
# =========================
DEGREES = list(DEGREE_MAP.keys())
SPECIALIZATIONS = list(SPECIALIZATION_MAP.keys())


# =========================
# MAIN PREPROCESS FUNCTION
# =========================
def preprocess(data):
    """
    Converts raw input into final numeric feature vector
    """

    degree = data.get("degree")
    specialization = data.get("specialization")

    cgpa = data.get("cgpa", 0)
    graduation_year = data.get("graduation_year", 2024)

    # ---------- Numeric safety ----------
    try:
        cgpa = float(cgpa)
    except:
        cgpa = 0.0

    try:
        graduation_year = int(graduation_year)
    except:
        graduation_year = 2024

    # ---------- ENCODING ----------
    if MODEL_TYPE == "tree":
        features = label_encode(degree, specialization, cgpa, graduation_year)

    elif MODEL_TYPE == "linear":
        features = one_hot_encode(degree, specialization, cgpa, graduation_year)

    else:
        raise ValueError("Invalid MODEL_TYPE")

    return features


# =========================
# LABEL ENCODING (TREE MODELS)
# =========================
def label_encode(degree, specialization, cgpa, graduation_year):

    degree_encoded = DEGREE_MAP.get(degree, 0)
    specialization_encoded = SPECIALIZATION_MAP.get(specialization, 0)

    return np.array([
        degree_encoded,
        specialization_encoded,
        cgpa,
        graduation_year
    ]).reshape(1, -1)


# =========================
# ONE-HOT ENCODING (LINEAR / NN)
# =========================
def one_hot_encode(degree, specialization, cgpa, graduation_year):

    degree_vector = [1 if d == degree else 0 for d in DEGREES]
    specialization_vector = [1 if s == specialization else 0 for s in SPECIALIZATIONS]

    return np.array(
        degree_vector +
        specialization_vector +
        [cgpa, graduation_year]
    ).reshape(1, -1)

