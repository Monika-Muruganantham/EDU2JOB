from django.urls import path


from .views import (
    FlaggedItemsView,
    RegisterView,
    LoginView,
    GoogleLoginView,
    MeView,
    ProfileView,
    PredictView,
    PredictionHistoryView,
    AddCertificationView,
    AdminLoginView,
    AdminDashboardView,
    UserLogsView,
)

urlpatterns = [
    # ===== AUTH =====
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/google/", GoogleLoginView.as_view(), name="google_login"),
    path("auth/me/", MeView.as_view(), name="me"),

    # ===== USER =====
    path("auth/profile/", ProfileView.as_view(), name="profile"),
    path("auth/predict/", PredictView.as_view(), name="predict"),
    path("auth/predictions/", PredictionHistoryView.as_view(), name="prediction_history"),
    path("auth/add-certification/", AddCertificationView.as_view(), name="add_certification"),

    # ===== ADMIN API =====
    path("admin-api/login/", AdminLoginView.as_view(), name="admin_login"),
    path("admin-api/dashboard/", AdminDashboardView.as_view()),
    path("admin-api/logs/", UserLogsView.as_view()),
    path("admin-api/flagged/", FlaggedItemsView.as_view()),
]
