import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
    providers: [
        Credentials({
            credentials: {
                username: { label: "Usuario", type: "text" },
                password: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                // Simple hardcoded user for now
                // In production, you'd check against a database
                if (credentials?.username === "admin" && credentials?.password === "admin123") {
                    return {
                        id: "1",
                        name: "Administrador",
                        email: "admin@unipersonal.com"
                    }
                }
                return null
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname === "/"
            const isOnSettings = nextUrl.pathname.startsWith("/settings")
            const isOnWizard = nextUrl.pathname === "/wizard"
            const isOnLogin = nextUrl.pathname === "/login"

            if (isOnDashboard || isOnSettings || isOnWizard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }

            if (isOnLogin) {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/", nextUrl))
                }
                return true
            }

            return true
        },
    },
} satisfies NextAuthConfig
