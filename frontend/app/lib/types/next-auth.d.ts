
declare module "next-auth" {
    interface Session {
        user: {
            user_id: number;  // ✅ Add user_id
            username: string;
            role_id: number;  // ✅ Add role_id
            role_name: string;
            location_id: number;
            location: string;
            email?: string;
            image?: string;
        };
    }
}
