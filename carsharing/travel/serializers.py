from rest_framework import serializers

from user.serializer import UserSerializer
from .models import Travel

class TravelSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)
    passengers = UserSerializer(many=True, read_only=True)
    class Meta:
        model = Travel
        fields = ['id', 'host', 'passengers' ,'origin', 'destination', 'start_date', 'estimated_duration', 'price', 'stops', 'status', 'total_seats']
