import { signOut, signIn } from "next-auth/react"

const login = async (credentials: Record<"username" | "password", string> | undefined) => {
    try {
        await signOut({ redirect: false })
        const response = await signIn("django-auth", { redirect: false, username: credentials?.username, password: credentials?.password })

        if (response && !response?.ok) {
            throw response
        }

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