from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    PetrolExpenseViewSet, 
    LabourViewSet, 
    AttendanceViewSet, 
    SettlementViewSet, 
    TransactionViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'petrol', PetrolExpenseViewSet)
router.register(r'labour', LabourViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'settlements', SettlementViewSet)
router.register(r'transactions', TransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
