from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.operations.models import PetrolExpense, Labour, Attendance
from apps.finance.models import Settlement, Transaction
from .serializers import (
    PetrolExpenseSerializer, 
    LabourSerializer, 
    AttendanceSerializer, 
    SettlementSerializer, 
    TransactionSerializer,
    UserSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return User.objects.all()
        return User.objects.filter(id=user.id)

class PetrolExpenseViewSet(viewsets.ModelViewSet):
    queryset = PetrolExpense.objects.all()
    serializer_class = PetrolExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return PetrolExpense.objects.all()
        return PetrolExpense.objects.filter(partner=user)

    def perform_create(self, serializer):
        serializer.save(partner=self.request.user)

class LabourViewSet(viewsets.ModelViewSet):
    queryset = Labour.objects.all()
    serializer_class = LabourSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return Labour.objects.all()
        return Labour.objects.none()

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return Attendance.objects.all()
        return Attendance.objects.filter(profile=user)

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        user = request.user
        # Logic for check-in
        return Response({"status": "checked in"}, status=status.HTTP_201_CREATED)

class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.all()
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return Settlement.objects.all()
        return Settlement.objects.filter(partner=user)

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return Transaction.objects.all()
        return Transaction.objects.none()
