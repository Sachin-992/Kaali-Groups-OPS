from django.db import models
from django.conf import settings

class PetrolExpense(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    partner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='petrol_expenses')
    date = models.DateField()
    bunk_name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    vehicle_number = models.CharField(max_length=20)
    km_reading = models.IntegerField(null=True, blank=True)
    bill_image_url = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.partner.username} - {self.date} - ₹{self.amount}"

class Labour(models.Model):
    TYPE_CHOICES = (
        ('agrifresh', 'TN 24 Agrifresh'),
        ('import_export', 'Import/Export'),
        ('hotel', 'Hotel Serving'),
        ('packing', 'Packing Staff'),
        ('loading', 'Loading/Unloading'),
    )
    WAGE_CHOICES = (
        ('daily', 'Daily'),
        ('monthly', 'Monthly'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='labour_profile')
    labour_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    wage_type = models.CharField(max_length=20, choices=WAGE_CHOICES)
    wage_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='active')

    def __str__(self):
        return f"{self.user.username} - {self.labour_type}"

class Attendance(models.Model):
    labour = models.ForeignKey(Labour, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='present')

    class Meta:
        unique_together = ('labour', 'date')

    def __str__(self):
        return f"{self.labour.user.username} - {self.date}"
