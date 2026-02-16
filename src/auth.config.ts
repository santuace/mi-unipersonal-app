import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
    providers: [
        Google({
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/calendar.events"
                }
            }
        }),
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
