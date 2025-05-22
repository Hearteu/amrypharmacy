import { signOut, signIn, getSession } from "next-auth/react"
import "next-auth";

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
        const response = await signIn("django-auth", { redirect: false, username: credentials?.username, password: credentials?.password })

        if (response && !response?.ok) {
            throw response
        }

        const session = await getSession();

        if (session?.user?.status !== "Active") {
            await signOut({ redirect: false });
            throw new Error("Account is not active.");
        }

        return response;

        return response
    } catch (e) {
        console.error(e)
        throw e
    }
}

const service = {
    login,
}

export default service