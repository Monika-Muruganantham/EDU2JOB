from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Profile,
    Prediction,
    Certification,
    PredictionHistory,
)

# -------------------------------------------------
# CONSTANTS
# -------------------------------------------------
ALLOWED_DEGREES = [
    "B.Tech", "B.Sc", "M.Sc", "MCA", "MBA", "BBA",
    "B.COM", "M.TECH", "BCA", "BA", "MA"
]

ALLOWED_SPECIALIZATIONS = [
    "CSE", "ECE", "IT", "Data Science", "AI",
    "Mechanical", "Physics", "Chemistry", "EEE",
    "Statistics", "Geography", "cyber security",
    "Maths", "English"
]

# -------------------------------------------------
# PROFILE SERIALIZER
# -------------------------------------------------
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "degree",
            "specialization",
            "cgpa",
            "graduation_year",
            "university",
            "skills",
        ]

    def validate_degree(self, value):
        if value not in ALLOWED_DEGREES:
            raise serializers.ValidationError("Invalid degree")
        return value

    def validate_specialization(self, value):
        if value not in ALLOWED_SPECIALIZATIONS:
            raise serializers.ValidationError("Invalid specialization")
        return value

    def validate_cgpa(self, value):
        if not 0 <= value <= 10:
            raise serializers.ValidationError("CGPA must be between 0 and 10")
        return value

    def validate_graduation_year(self, value):
        from datetime import datetime
        current_year = datetime.now().year
        if value < 2000 or value > current_year + 6:
            raise serializers.ValidationError("Invalid graduation year")
        return value


# -------------------------------------------------
# USER SERIALIZER
# -------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile",
        ]


# -------------------------------------------------
# REGISTER SERIALIZER
# -------------------------------------------------
class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("name", "email", "password")

    def create(self, validated_data):
        name = validated_data.pop("name")
        password = validated_data.pop("password")

        user = User(
            username=validated_data["email"],
            email=validated_data["email"],
            first_name=name,
        )
        user.set_password(password)
        user.save()
        return user


# -------------------------------------------------
# PREDICTION SERIALIZER
# -------------------------------------------------
class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = ["id", "education", "prediction", "created_at"]


# -------------------------------------------------
# EDUCATION INPUT SERIALIZER (NON-MODEL)
# -------------------------------------------------
class EducationSerializer(serializers.Serializer):
    degree = serializers.CharField()
    specialization = serializers.CharField()
    cgpa = serializers.FloatField()
    graduation_year = serializers.IntegerField()

    def validate_cgpa(self, value):
        if not 0 <= value <= 10:
            raise serializers.ValidationError("Invalid CGPA")
        return value

    def validate_graduation_year(self, value):
        if value < 2000 or value > 2030:
            raise serializers.ValidationError("Invalid graduation year")
        return value


# -------------------------------------------------
# CERTIFICATION SERIALIZER
# -------------------------------------------------
class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = [
            "id",
            "certification_name",
            "issued_by",
            "certificate_file",
        ]


# -------------------------------------------------
# PREDICTION HISTORY SERIALIZER (FIXED)
# -------------------------------------------------
from rest_framework import serializers
from .models import PredictionHistory


class PredictionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionHistory
        fields = "__all__"


# =========================
# ADMIN REGISTER
# =========================
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

class AdminRegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    admin_code = serializers.CharField(write_only=True)

    def validate_admin_code(self, value):
        if value != "ADMIN123":
            raise serializers.ValidationError("Invalid admin code")
        return value

    def create(self, validated_data):
        validated_data.pop("admin_code")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_staff=True,
            is_superuser=True
        )
        return user



# =========================
# ADMIN LOGIN
# =========================
class AdminLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            username=data["username"],
            password=data["password"]
        )

        if not user or not user.is_staff:
            raise serializers.ValidationError("Invalid admin credentials")

        refresh = RefreshToken.for_user(user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserLog, FlaggedItem


# ----------------------------
# USER SERIALIZER (for admin)
# ----------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_superuser"]


# ----------------------------
# USER LOG SERIALIZER
# ----------------------------
class UserLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = UserLog
        fields = "__all__"


# ----------------------------
# FLAGGED ITEM SERIALIZER
# ----------------------------
class FlaggedItemSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = FlaggedItem
        fields = "__all__"

