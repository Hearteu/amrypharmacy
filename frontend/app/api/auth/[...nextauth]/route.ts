import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios";

export const authOptions = {
    providers: [
        CredentialsProvider({
            id: "django-auth",
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                // You need to provide your own logic here that takes the credentials
                // submitted and returns either a object representing a user or value
                // that is false/null if the credentials are invalid.
                // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
                // You can also use the `req` object to obtain additional parameters
                // (i.e., the request IP address)
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
        async jwt({ token, user, account }) {
            if (account) {
                token.user_id = user.user_id
                token.username = user.username
            }

            return token
        },
        async session({ session, token }) {
            session.user = { username: token.username, user_id: token.user_id }
            return session
        }
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
