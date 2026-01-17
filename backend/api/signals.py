from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserLog


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    UserLog.objects.create(
        user=user,
        action="User logged in"
    )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    UserLog.objects.create(
        user=user,
        action="User logged out"
    )
