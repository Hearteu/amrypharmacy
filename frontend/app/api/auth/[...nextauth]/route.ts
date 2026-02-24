import axios from "axios";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions = {
    pages: {
        signIn: '/',
        signOut: '/',
        error: '/',
    },
    providers: [
        CredentialsProvider({
            id: "django-auth",
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials) {
                    return null;
                }

                const { username, password } = credentials

                // Server-side: call Django directly (not through Nginx/public URL)
                const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8001/pharmacy";

                try {
                    const res = await axios.post(
                        `${BACKEND_URL}/login/`,
                        { username, password }
                    );
                    const user = res.data

                    if (user) {
                        return user
                    }
                    return null
                } catch (e) {
                    console.error("Auth error:", e)
                    return null
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async jwt({ token, user, account }: any) {
            if (account) {
                token.user_id = user.user_id
                token.username = user.username
                token.role_name = user.role_name
                token.location = user.location
                token.location_id = user.location_id
                token.status = user.status
            }

            return token
        },
        async session({ session, token }: any) {
            if (token) {
                session.user = {
                    username: token.username,
                    user_id: token.user_id,
                    role_name: token.role_name,
                    location_id: token.location_id,
                    location: token.location,
                    status: token.status
                }
            }
            return session
        },
    },
} as any

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };

