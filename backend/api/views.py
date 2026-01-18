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


from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Token missing"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10  
            )

            email = idinfo.get("email")
            name = idinfo.get("name", "")

            if not email:
                return Response(
                    {"error": "Email not available"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.filter(email=email).first()

            if not user:
                user = User.objects.create_user(
                username=email.split("@")[0],
                email=email,
                first_name=name,
                password=User.objects.make_random_password(),
    )


            
            Profile.objects.get_or_create(user=user)

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except ValueError:
            return Response(
                {"error": "Invalid Google token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "email": request.user.email,
            "username": request.user.username,
        })


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
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Feedback
from .serializers import FeedbackSerializer

class FeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(
                {"message": "Feedback submitted successfully"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

from django.contrib.auth import authenticate
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
            "is_admin": True   
        }, status=status.HTTP_200_OK)


from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status

from .models import UserLog, FlaggedItem, PredictionHistory, Certification
from .serializers import UserLogSerializer, FlaggedItemSerializer, UserSerializer

User = get_user_model()

from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status

from api.models import UserLog, FlaggedItem, PredictionHistory, Certification
from api.serializers import UserLogSerializer, FlaggedItemSerializer, UserSerializer

User = get_user_model()


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


class UserLogsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        logs = UserLog.objects.all().order_by("-timestamp")
        serializer = UserLogSerializer(logs, many=True)
        return Response(serializer.data)



class FlaggedItemsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        items = FlaggedItem.objects.all().order_by("-created_at")
        serializer = FlaggedItemSerializer(items, many=True)
        return Response(serializer.data)
class RetrainModelView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        
        return Response({"message": "Model retrained successfully"})
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import PredictionHistory, FlaggedItem

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def flag_prediction(request, prediction_id):
    """
    User can flag a prediction with a reason.
    """
    try:
        prediction = PredictionHistory.objects.get(id=prediction_id, user=request.user)
    except PredictionHistory.DoesNotExist:
        return Response({"error": "Prediction not found"}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get("reason", "")
    if not reason:
        return Response({"error": "Reason is required"}, status=status.HTTP_400_BAD_REQUEST)

    FlaggedItem.objects.create(
        user=request.user,
        prediction=prediction,
        reason=reason
    )

    return Response({"message": "Prediction flagged successfully"}, status=201)
