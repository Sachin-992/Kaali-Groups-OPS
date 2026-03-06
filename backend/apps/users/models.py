from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('delivery_partner', 'Delivery Partner'),
        ('labour', 'Labour'),
        ('manager', 'Manager'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=15, blank=True)
    avatar_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name
