from user.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.hashers import make_password
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializer import RegisterUserSerializer, MyTokenObtainPairSerializer, UserSerializer
# Create your views here.

@api_view(['GET'])
def get_user_by_id(request, id):
    user = User.objects.get(id=id)
    seriaizer = UserSerializer(user, many=False)
    return Response(seriaizer.data)

@api_view(['POST'])
def register(request):
    data = request.data
    user = User.objects.create(
        username = data['username'],
        email = data['email'],
        name = data['name'],
        last_name = data['last_name'],
        password = make_password(data['password'])
    )
    serializer = RegisterUserSerializer(user, many=False)
    return Response(serializer.data)


class LoginView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

