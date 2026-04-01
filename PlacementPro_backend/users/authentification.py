from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.exceptions import TokenBackendError
from django.conf import settings
from .models import User


class CustomJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            backend = TokenBackend(
                algorithm='HS256',
                signing_key=settings.SECRET_KEY
            )
            data = backend.decode(token, verify=True)
            user_id = int(data.get('user_id'))
            user = User.objects.get(id=user_id)
            return (user, token)
        except (TokenBackendError, User.DoesNotExist, ValueError):
            raise AuthenticationFailed("Token invalide ou expiré.")