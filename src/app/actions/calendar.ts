"use server"

import { auth } from "@/auth"
import { syncTaxEvents } from "@/lib/google-calendar"

export async function syncCalendarAction() {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autorizado" }

    try {
        const result = await syncTaxEvents(session.user.id)
        return { success: true, count: result.count }
    } catch (error: any) {
        console.error("Sync error:", error)
        return { error: error.message || "Error al sincronizar" }
    }
}
