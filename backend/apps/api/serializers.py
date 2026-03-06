from rest_framework import serializers
from apps.users.models import User, Profile
from apps.operations.models import PetrolExpense, Labour, Attendance
from apps.finance.models import Settlement, Transaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 'avatar_url')

class PetrolExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PetrolExpense
        fields = '__all__'

class LabourSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Labour
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

class SettlementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settlement
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
