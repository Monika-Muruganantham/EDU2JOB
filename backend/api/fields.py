# your_app/fields.py

from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet
import json

fernet = Fernet(settings.ENCRYPTION_KEY)


def encrypt_value(value):
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        value = json.dumps(value)
    return fernet.encrypt(str(value).encode()).decode()


def decrypt_value(value):
    if value is None:
        return None
    decrypted = fernet.decrypt(value.encode()).decode()
    try:
        return json.loads(decrypted)
    except Exception:
        return decrypted


class EncryptedTextField(models.TextField):
    """
    Automatically encrypts before saving
    and decrypts when reading from DB
    """

    def get_prep_value(self, value):
        if value is not None:
            return encrypt_value(value)
        return value

    def from_db_value(self, value, expression, connection):
        if value is not None:
            return decrypt_value(value)
        return value

    def to_python(self, value):
        if value is not None and isinstance(value, str):
            try:
                return decrypt_value(value)
            except Exception:
                return value
        return value
