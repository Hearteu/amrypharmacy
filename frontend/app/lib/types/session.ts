import { DefaultSession } from "next-auth";

export interface Session extends DefaultSession {
    user?: {
        user_id?: number;  // ✅ Add user_id
        username?: string;
        role_id?: number;  // ✅ Add role_id
        role_name?: string;
        location_id?: number;
        location?: string;
        name?: string | null
        email?: string | null
        image?: string | null
    }
}
