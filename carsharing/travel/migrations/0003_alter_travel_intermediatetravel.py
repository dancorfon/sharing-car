# Generated by Django 4.2.8 on 2024-06-24 14:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('travel', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='travel',
            name='intermediateTravel',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
    ]
