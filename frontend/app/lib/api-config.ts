/**
 * Centralized API configuration.
 *
 * Every fetch / axios call in the app should use `API_URL` instead of
 * a hardcoded "http://127.0.0.1:8000/pharmacy".
 *
 * For production, just change NEXT_PUBLIC_API_URL in .env.local:
 *   NEXT_PUBLIC_API_URL=https://hearteu02.com/pharmacy/api
 */

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/pharmacy";
