from django.contrib import admin
from django.contrib.auth import get_user_model

from .models import Profile, Prediction, Education

User = get_user_model()   # 👈 VERY IMPORTANT


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "degree",
        "specialization",
        "cgpa",
        "graduation_year",
    )
    list_filter = ("degree", "specialization")
    search_fields = ("user__email",)


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at")
    search_fields = ("user__email",)
    list_filter = ("created_at",)


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "degree",
        "specialization",
        "cgpa",
        "graduation_year",
    )
