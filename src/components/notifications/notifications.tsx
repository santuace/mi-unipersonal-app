"use client"

import { useEffect } from "react"
import { useInvoiceStore } from "@/store/invoices"
import { toast } from "sonner"
import { addMonths, setDate } from "date-fns"
import { TAX_CONSTANTS_2026 } from "@/lib/uruguay-taxes"

export function Notifications() {
    const invoices = useInvoiceStore((state) => state.invoices)

    useEffect(() => {
        const today = new Date()
        const currentDay = today.getDate()

        // Alertas Proactivas (48hs antes)

        // 1. BPS (Fonasa) - Vence el 15 (o próximo hábil)
        // Alerta entre 13 y 15
        if (currentDay >= 13 && currentDay <= 15) {
            toast.warning("Vencimiento BPS (Fonasa)", {
                description: `Recuerda pagar el anticipo mensual (~$${TAX_CONSTANTS_2026.CPE_MINIMO}) antes del 15.`,
                duration: 8000,
                id: 'bps-alert'
            })
        }

        // 2. DGI (IVA/IRPF) - Vence el 25 (Bimestral o Mensual)
        // Asumimos mensual para alerta general
        if (currentDay >= 23 && currentDay <= 25) {
            // Calcular IVA a pagar del mes anterior (aprox con facturas)
            // Esto es solo un recordatorio visual.
            toast.error("Vencimiento DGI (IVA/IRPF)", {
                description: `Prepara la declaración jurada. Vence el día 25.`,
                duration: 8000,
                id: 'dgi-alert'
            })
        }

        // 3. CJPPU (Caja) - Vence el 30/31
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
        if (currentDay >= lastDayOfMonth - 2) {
            toast.info("Vencimiento Caja Profesional", {
                description: `No te olvides del aporte a la Caja antes de fin de mes.`,
                duration: 8000,
                id: 'cjppu-alert'
            })
        }

    }, [invoices])

    return null
}
