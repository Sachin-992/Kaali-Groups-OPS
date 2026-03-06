from django.db import models
from django.conf import settings

class Settlement(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    partner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settlements')
    date = models.DateField()
    cod_collected = models.DecimalField(max_digits=10, decimal_places=2)
    petrol_expense = models.DecimalField(max_digits=10, decimal_places=2)
    other_expenses = models.DecimalField(max_digits=10, decimal_places=2)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Settlement {self.partner.username} - {self.date}"

class Transaction(models.Model):
    TYPE_CHOICES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField()
    reference_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.type} - {self.category} - ₹{self.amount}"
