from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate, TruncMonth
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import POS, POSItem, Drug, Product
from datetime import datetime, timedelta

class SalesAnalytics(APIView):
    def get(self, request):
        try:
            # Query params for filtering
            days = int(request.GET.get('days', 7))
            branch_id = request.GET.get('branch_id')
            
            start_date = datetime.now() - timedelta(days=days)
            
            # Base queryset
            sales_qs = POS.objects.filter(sale_date__gte=start_date)
            
            # If we need actual branch filtering, we look at StockTransaction or POS location
            # For now, let's look at the orders
            
            # 1. Daily Sales Trend
            daily_sales = (
                sales_qs.annotate(date=TruncDate('sale_date'))
                .values('date')
                .annotate(
                    total=Sum(F('items__price') * F('items__quantity_sold')),
                    count=Count('pos_id', distinct=True)
                )
                .order_by('date')
            )

            # 2. Top Selling Products
            top_products = (
                POSItem.objects.filter(pos__sale_date__gte=start_date)
                .values('product__product_name')
                .annotate(
                    total_qty=Sum('quantity_sold'),
                    revenue=Sum(F('price') * F('quantity_sold'))
                )
                .order_by('-total_qty')[:5]
            )

            # 3. Customer Type Distribution
            customer_types = (
                sales_qs.values('order_type')
                .annotate(count=Count('pos_id'))
                .order_by('-count')
            )

            # 4. Total Stats
            total_stats = sales_qs.aggregate(
                revenue=Sum(F('items__price') * F('items__quantity_sold')),
                orders=Count('pos_id', distinct=True)
            )

            return Response({
                "daily_sales": daily_sales,
                "top_products": top_products,
                "customer_types": customer_types,
                "summary": total_stats
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
