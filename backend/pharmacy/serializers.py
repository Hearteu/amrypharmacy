from rest_framework import serializers

from .models import Person, Product, Sale


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['person_id', 'name', 'address', 'contact', 'email']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'quantity_in_stock']

class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = ['id', 'product', 'quantity_sold', 'date_sold', 'total_price']
