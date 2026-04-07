from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from ..models import CashMovement, CashShift

class CashMovementView(APIView):
    def get(self, request):
        shift_id = request.query_params.get('shift_id')
        if shift_id:
            movements = CashMovement.objects.filter(shift_id=shift_id).order_by('-timestamp')
        else:
            movements = CashMovement.objects.all().order_by('-timestamp')

        data = []
        for mv in movements:
            data.append({
                'movement_id': mv.movement_id,
                'shift_id': mv.shift.shift_id,
                'movement_type': mv.movement_type,
                'amount': str(mv.amount),
                'reason': mv.reason,
                'timestamp': mv.timestamp
            })
        return Response({'movements': data}, status=status.HTTP_200_OK)

    def post(self, request):
        shift_id = request.data.get('shift_id')
        movement_type = request.data.get('movement_type') # 'IN' or 'OUT'
        amount = request.data.get('amount')
        reason = request.data.get('reason')

        try:
            shift = CashShift.objects.get(shift_id=shift_id)
        except CashShift.DoesNotExist:
            return Response({'error': 'Shift not found'}, status=status.HTTP_404_NOT_FOUND)

        if shift.status != 'OPEN':
            return Response({'error': 'Cannot add movement to closed shift'}, status=status.HTTP_400_BAD_REQUEST)

        movement = CashMovement.objects.create(
            shift=shift,
            movement_type=movement_type,
            amount=amount,
            reason=reason
        )

        return Response({'message': 'Movement recorded', 'movement_id': movement.movement_id}, status=status.HTTP_201_CREATED)
