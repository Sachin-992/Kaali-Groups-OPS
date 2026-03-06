# Django Reference Implementation for Kaali Groups Ops

# requirements.txt
# django
# djangorestframework
# django-cors-headers
# psycopg2-binary
# python-dotenv

# kaali_ops/settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': 'YOUR_SUPABASE_PASSWORD',
        'HOST': 'db.eexdqxdasxkbhwfmtmeg.supabase.co',
        'PORT': '5432',
    }
}

# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('delivery_partner', 'Delivery Partner'),
        ('labour', 'Labour'),
        ('manager', 'Manager'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=15, blank=True)

# operations/models.py
class PetrolExpense(models.Model):
    partner = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    bunk_name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    vehicle_number = models.CharField(max_length=20)
    km_reading = models.IntegerField(null=True, blank=True)
    bill_image_url = models.URLField()
    status = models.CharField(max_length=20, default='pending')

# finance/models.py
class Settlement(models.Model):
    partner = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    cod_collected = models.DecimalField(max_digits=10, decimal_places=2)
    petrol_expense = models.DecimalField(max_digits=10, decimal_places=2)
    other_expenses = models.DecimalField(max_digits=10, decimal_places=2)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
