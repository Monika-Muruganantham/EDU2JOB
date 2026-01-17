import pandas as pd
import random

TOTAL_ROWS = 20000

degrees = ["BTech", "BSc", "MTech", "MCA", "MBA"]
fields = ["CSE", "IT", "ECE", "Mechanical", "Civil", "EEE", "Data Science", "AI/ML", "HR"]

skill_bank = {
    "CSE": ["python", "java", "dsa", "sql"],
    "IT": ["html", "css", "js", "react"],
    "Data Science": ["python", "ml", "sql", "statistics"],
    "AI/ML": ["python", "ml", "deep learning"],
    "ECE": ["signals", "embedded", "c"],
    "EEE": ["power systems", "circuits"],
    "Mechanical": ["solidworks", "design"],
    "Civil": ["autocad", "construction"],
    "HR": ["communication", "recruitment"]
}

def generate_gpa():
    return round(random.uniform(5.5, 9.8), 2)

def generate_experience(year):
    return max(0, 2025 - year)

data = []

for _ in range(TOTAL_ROWS):
    degree = random.choice(degrees)
    field = random.choice(fields)
    graduation_year = random.randint(2018, 2025)
    gpa = generate_gpa()
    experience = generate_experience(graduation_year)

    skills = ",".join(random.sample(skill_bank[field], k=2))

    # 🎯 STRICT ROLE LOGIC (NO PRODUCT MANAGER)
    if field in ["Data Science", "AI/ML"]:
        target_role = "Data Scientist" if gpa >= 7.5 else "Software Engineer"

    elif field in ["CSE", "IT"]:
        target_role = "Software Engineer" if gpa >= 8 else "Web Developer"

    elif field in ["ECE", "EEE"]:
        target_role = "Electrical Engineer"

    elif field == "Mechanical":
        target_role = "Mechanical Engineer"

    elif field == "Civil":
        target_role = "Civil Engineer"

    elif field == "HR":
        target_role = "Business Analyst"

    data.append([
        degree, field, gpa, experience, graduation_year, skills, target_role
    ])

df = pd.DataFrame(
    data,
    columns=[
        "degree",
        "field",
        "gpa",
        "experience",
        "graduation_year",
        "skills",
        "target_role",
    ],
)

df.to_csv("career_dataset.csv", index=False)
print(f"✅ {TOTAL_ROWS} rows generated successfully")
