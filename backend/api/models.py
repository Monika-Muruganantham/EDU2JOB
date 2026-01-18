from django.db import models
from django.conf import settings
from django.contrib.auth.models import User

# -------------------------------------------------
# SAFE ENCRYPTED FIELD IMPORT
# -------------------------------------------------
try:
    from .fields import EncryptedTextField
except Exception:
    EncryptedTextField = models.TextField


# -------------------------------------------------
# PROFILE MODEL
# -------------------------------------------------
class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    degree = models.CharField(max_length=50, default="select")
    specialization = models.CharField(max_length=50, default="select")
    cgpa = models.FloatField(default=0.0)
    graduation_year = models.IntegerField(default=0)

    university = EncryptedTextField(default="options")
    skills = EncryptedTextField(default="")

    def __str__(self):
        return f"{self.user.username} Profile"


# -------------------------------------------------
# EDUCATION MODEL
# -------------------------------------------------
class Education(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="educations"
    )

    degree = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    university = models.CharField(max_length=150)
    cgpa = models.FloatField()
    graduation_year = models.IntegerField()

    # ML PROCESSED FIELDS
    cgpa_normalized = models.FloatField(default=0.0)
    degree_encoded = models.IntegerField(default=0)
    specialization_encoded = models.IntegerField(default=0)
    years_to_graduate = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.degree}"


# -------------------------------------------------
# LEGACY PREDICTION MODEL (DO NOT DELETE)
# -------------------------------------------------
class Prediction(models.Model):
    """
    ⚠️ Legacy model – kept to avoid import errors
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="predictions",
        null=True,
        blank=True
    )

    education = models.JSONField(default=dict, blank=True)
    prediction = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return "Legacy Prediction"


# -------------------------------------------------
# ACTIVE PREDICTION HISTORY
# -------------------------------------------------
class PredictionHistory(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="prediction_history"
    )

    degree = models.CharField(max_length=100)
    field = models.CharField(max_length=100)
    cgpa = models.FloatField()
    experience = models.IntegerField(default=0)
    graduation_year = models.IntegerField()
    prediction = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


# -------------------------------------------------
# CERTIFICATION MODEL
# -------------------------------------------------
class Certification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certifications"
    )

    certification_name = models.CharField(max_length=255)
    issued_by = models.CharField(max_length=255)

    certificate_file = models.FileField(
        upload_to="certificates/",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.certification_name
class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=100)
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# -------------------------------------------------
# USER LOG MODEL (ADMIN DASHBOARD)
# -------------------------------------------------
class UserLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="logs"
    )

    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action}"


# -------------------------------------------------
# FLAGGED ITEM MODEL (ADMIN DASHBOARD)
# -------------------------------------------------
class FlaggedItem(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="flagged_items"
    )

    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Flagged by {self.user.username}"
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

class ModelRetrainView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response({"message": "No file uploaded"}, status=400)

        # 👉 Here you would retrain ML model
        # For now, we simulate training
        print("Training file received:", file.name)

        return Response({
            "message": "Model retrained successfully"
        })
