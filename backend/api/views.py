import json
import traceback

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .permissions import IsAdminUserOnly


from .models import (
    Profile,
    Prediction,
    PredictionHistory,
    Certification,
    Education,
)
from .serializers import (
    RegisterSerializer,
    ProfileSerializer,
    CertificationSerializer,
    EducationSerializer,
)
from .predictor import predict_job
from .utils import preprocess

User = get_user_model()

# =========================
# REGISTER
# =========================
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        Profile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=status.HTTP_201_CREATED,
        )


# =========================
# LOGIN
# =========================
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"error": "Email and password required"}, status=400)

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=401)

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=200,
        )


# =========================
# GOOGLE LOGIN
# =========================
# views.py
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

GOOGLE_CLIENT_ID = "876042599156-56lm39mktcqufeo37dq6v1m4glvhsl3a.apps.googleusercontent.com"

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response({"error": "Token missing"}, status=400)

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                GOOGLE_CLIENT_ID
            )

            email = idinfo["email"]
            name = idinfo.get("name", "")

            user, created = User.objects.get_or_create(
                username=email,
                defaults={"email": email, "first_name": name}
            )

            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "email": user.email,
                    "username": user.username
                }
            })

        except ValueError:
            return Response({"error": "Invalid Google token"}, status=400)



# =========================
# ✅ ME VIEW (FIXES YOUR ERROR)
# =========================
class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "email": request.user.email,
            "username": request.user.username,
        })


# =========================
# PROFILE
# =========================
class ProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response(ProfileSerializer(profile).data)

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# =========================
# CERTIFICATION
# =========================
class CertificateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        certifications = Certification.objects.filter(user=request.user)
        return Response(CertificationSerializer(certifications, many=True).data)

    def post(self, request):
        serializer = CertificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response({"message": "Certification added"}, status=201)


class AddCertificationView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = CertificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response({"message": "Certification added successfully"}, status=201)


# =========================
# PREDICTION
# =========================
class PredictView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        try:
            data = request.data

            input_data = {
                "degree": data.get("degree", ""),
                "field": data.get("specialization", ""),
                "cgpa": float(data.get("cgpa", 0)),
                "graduation_year": int(data.get("graduation_year", 0)),
                "experience": int(data.get("experience", 0)),
            }

            predictions = predict_job(input_data)

            formatted = [
                {
                    "role": item.get("role"),
                    "confidence": float(item.get("confidence", 0)),
                }
                for item in predictions
            ]

            Prediction.objects.create(
                user=request.user,
                education=input_data,
                prediction=formatted,
            )

            PredictionHistory.objects.create(
                user=request.user,
                degree=input_data["degree"],
                field=input_data["field"],
                cgpa=input_data["cgpa"],
                experience=input_data["experience"],
                graduation_year=input_data["graduation_year"],
                prediction=json.dumps(formatted),
            )

            return Response({"top_roles": formatted}, status=200)

        except Exception as e:
            print("Prediction Error:", str(e))
            traceback.print_exc()
            return Response({"error": "Prediction failed"}, status=500)


# =========================
# EDUCATION
# =========================
class SaveEducationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EducationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        processed = preprocess(serializer.validated_data)

        Education.objects.update_or_create(
            user=request.user,
            defaults=processed,
        )

        return Response({"message": "Education saved"}, status=201)


# =========================
# PREDICTION HISTORY
# =========================
class PredictionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = PredictionHistory.objects.filter(
            user=request.user
        ).order_by("-created_at")

        history = []
        for record in records:
            preds = json.loads(record.prediction)
            top = preds[0]

            history.append({
                "role": top["role"],
                "confidence": top["confidence"],
                "created_at": record.created_at.isoformat(),
            })

        return Response(history)

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAdminUser,
)
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PredictionHistory, Certification


# ===========================
# ADMIN REGISTER (SUPERADMIN ONLY)
# ===========================
class AdminRegisterView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superadmin can create admin"},
                status=status.HTTP_403_FORBIDDEN,
            )

        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if not all([username, email, password]):
            return Response(
                {"error": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        admin.is_staff = True
        admin.save()

        return Response(
            {"message": "Admin created successfully"},
            status=status.HTTP_201_CREATED,
        )


# ===========================
# ADMIN LOGIN (JWT ONLY)
# ===========================
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_staff:
            return Response(
                {"error": "Not an admin"},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_admin": True   # 🔥 THIS LINE FIXES EVERYTHING
        }, status=status.HTTP_200_OK)


from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status

from .models import UserLog, FlaggedItem, PredictionHistory, Certification
from .serializers import UserLogSerializer, FlaggedItemSerializer, UserSerializer

User = get_user_model()

# =====================================================
# ADMIN DASHBOARD (COUNTS)
# =====================================================
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status

from api.models import UserLog, FlaggedItem, PredictionHistory, Certification
from api.serializers import UserLogSerializer, FlaggedItemSerializer, UserSerializer

User = get_user_model()

# ===========================
# ADMIN DASHBOARD
# ===========================
class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        return Response(
            {
                "total_users": User.objects.filter(is_staff=False).count(),
                "total_admins": User.objects.filter(is_staff=True).count(),
                "total_predictions": PredictionHistory.objects.count(),
                "total_logs": UserLog.objects.count(),
                "flagged_count": FlaggedItem.objects.count(),
                "total_certifications": Certification.objects.count(),
            },
            status=status.HTTP_200_OK,
        )


# ===========================
# USER LOGS
# ===========================
class UserLogsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        logs = UserLog.objects.all().order_by("-timestamp")
        serializer = UserLogSerializer(logs, many=True)
        return Response(serializer.data)


# ===========================
# FLAGGED ITEMS
# ===========================
class FlaggedItemsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        items = FlaggedItem.objects.all().order_by("-created_at")
        serializer = FlaggedItemSerializer(items, many=True)
        return Response(serializer.data)
