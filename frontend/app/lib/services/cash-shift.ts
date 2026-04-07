import { API_URL } from "../api-config";

export interface CashShift {
  shift_id: number;
  user_id: number;
  location_id: number | null;
  start_time: string;
  end_time: string | null;
  starting_cash: number;
  ending_cash: number | null;
  status: 'OPEN' | 'CLOSED';
}

export interface CashMovement {
  movement_id: number;
  shift_id: number;
  user_id: number;
  movement_type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  reason: string;
  timestamp: string;
}

export const fetchActiveShift = async (userId: number): Promise<CashShift | null> => {
  try {
    const response = await fetch(`${API_URL}/cash-shifts/?user_id=${userId}&status=OPEN`);
    if (!response.ok) throw new Error("Failed to fetch shift");
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error fetching active shift:", error);
    return null;
  }
};

export const startShift = async (data: { user_id: number; location_id: number; starting_cash: number }): Promise<CashShift> => {
  const response = await fetch(`${API_URL}/cash-shifts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "open",
      user_id: data.user_id,
      location_id: data.location_id,
      starting_cash: data.starting_cash
    }),
  });
  if (!response.ok) throw new Error("Failed to start shift");
  return response.json();
};

export const endShift = async (shiftId: number, endingCash: number): Promise<CashShift> => {
  const response = await fetch(`${API_URL}/cash-shifts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "close",
      shift_id: shiftId,
      ending_cash: endingCash
    }),
  });
  if (!response.ok) throw new Error("Failed to end shift");
  return response.json();
};

export const addCashMovement = async (data: { shift_id: number; user_id: number; movement_type: string; amount: number; reason: string }): Promise<CashMovement> => {
  const response = await fetch(`${API_URL}/cash-movements/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to add cash movement");
  return response.json();
};
