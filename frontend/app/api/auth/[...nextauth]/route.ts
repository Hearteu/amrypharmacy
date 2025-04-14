import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios";

interface JWTTokenProps {
    token: string;
    user: string;
    role_name: string
    location_id: string;
    location: string;
    account: string;
}

export const authOptions = {
    pages: {
        signIn: '/',
        signOut: '/',
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
                // You need to provide your own logic here that takes the credentials
                // submitted and returns either a object representing a user or value
                // that is false/null if the credentials are invalid.
                // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
                // You can also use the `req` object to obtain additional parameters
                // (i.e., the request IP address)
                if (!credentials) {
                    throw new Error("Missing credentials");
                }

                const { username, password } = credentials
                try {
                    const res = await axios.post(
                        "http://127.0.0.1:8000/pharmacy/login/",
                        { username, password }
                    );
                    const user = res.data

                    // If no error and we have user data, return it
                    if (user) {
                        console.log("Return user", user)
                        return user
                    }
                } catch (e) {
                    console.error(e)
                    return null
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async jwt({ token, user, account }: JWTTokenProps) {
            if (account) {
                token.user_id = user.user_id
                token.username = user.username
                token.role_name = user.role_name
                token.location = user.location
                token.location_id = user.location_id
            }

            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    username: token.username,
                    user_id: token.user_id,
                    role_name: token.role_name,
                    location_id: token.location_id,
                    location: token.location
                }
            }
            return session
        },
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
