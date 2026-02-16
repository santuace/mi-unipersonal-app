import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" }, // Required to work with Middleware seamlessly if not using db strategy exclusively (though default is jwt with some adapters?) 
    // Actually, Prisma Adapter defaults to 'database' strategy. 
    // Middleware (Edge) CANNOT verify database sessions efficiently without direct DB access which it lacks.
    // So we MUST use 'jwt' strategy for middleware compatibility OR use a workaround.
    // Let's stick to 'jwt' for simplicity in this hybrid setup or ensure authConfig logic doesn't depend on db strategy tokens in middleware.
    // 'authorized' callback receives 'auth' which is session.
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            return session
        },
        async jwt({ token }) {
            return token
        }
    }
})
