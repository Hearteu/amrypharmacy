import "next-auth";
import { getSession, signIn, signOut } from "next-auth/react";

interface Record {
    username: string;
    password: string;
}

declare module "next-auth" {
    interface User {
        status?: string;
        role_name?: string;
    }

    interface Session {
        user?: User;
    }
}

const login = async (credentials: Record | undefined) => {
    try {
        await signOut({ redirect: false })
        const response = await signIn("django-auth", {
            redirect: false,
            username: credentials?.username,
            password: credentials?.password,
        })

        if (!response || response.error) {
            throw new Error(response?.error || "Invalid username or password");
        }

        if (!response.ok) {
            throw new Error("Invalid username or password");
        }

        const session = await getSession();

        if (session?.user?.status !== "Active") {
            await signOut({ redirect: false });
            throw new Error("Account is not active.");
        }

        return response;
    } catch (e) {
        console.error(e)
        if (e instanceof Error) {
            throw e;
        }
        throw new Error("An error occurred during login");
    }
}

const service = {
    login,
}

export default service