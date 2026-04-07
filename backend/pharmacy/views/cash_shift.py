from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from ..models import CashShift, User, Location

class CashShiftView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        status_param = request.query_params.get('status')
        shifts = CashShift.objects.all().order_by('-start_time')
        if user_id:
            shifts = shifts.filter(user_id=user_id)
        if status_param:
            shifts = shifts.filter(status=status_param)
        data = []
        for shift in shifts:
            data.append({
                'shift_id': shift.shift_id,
                'user': shift.user.username,
                'user_id': shift.user.user_id,
                'location': shift.location.location,
                'location_id': shift.location.location_id,
                'start_time': shift.start_time,
                'end_time': shift.end_time,
                'starting_cash': str(shift.starting_cash),
                'expected_ending_cash': str(shift.expected_ending_cash) if shift.expected_ending_cash else None,
                'ending_cash': str(shift.ending_cash) if shift.ending_cash else None,
                'status': shift.status
            })
        return Response({'shifts': data}, status=status.HTTP_200_OK)

    def post(self, request):
        user_id = request.data.get('user_id')
        location_id = request.data.get('location_id')
        starting_cash = request.data.get('starting_cash', 0)

        try:
            user = User.objects.get(user_id=user_id)
            location = Location.objects.get(location_id=location_id)
        except (User.DoesNotExist, Location.DoesNotExist):
            return Response({'error': 'Invalid user or location'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for open shifts for this user
        existing = CashShift.objects.filter(user=user, status='OPEN').first()
        if existing:
            return Response({'error': 'User already has an open shift', 'shift_id': existing.shift_id}, status=status.HTTP_400_BAD_REQUEST)

        shift = CashShift.objects.create(
            user=user,
            location=location,
            starting_cash=starting_cash,
            status='OPEN'
        )

        return Response({'message': 'Shift opened', 'shift_id': shift.shift_id}, status=status.HTTP_201_CREATED)

    def put(self, request, shift_id=None):
        if not shift_id:
            shift_id = request.data.get('shift_id')
        try:
            shift = CashShift.objects.get(shift_id=shift_id)
        except CashShift.DoesNotExist:
            return Response({'error': 'Shift not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action') # 'CLOSE'
        if action == 'CLOSE':
            shift.end_time = timezone.now()
            shift.ending_cash = request.data.get('ending_cash', 0)
            shift.expected_ending_cash = request.data.get('expected_ending_cash', 0)
            shift.status = 'CLOSED'
            shift.save()
            return Response({'message': 'Shift closed successfully'}, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
