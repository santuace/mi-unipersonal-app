"use client"

import { useCompanyStore } from "@/store/company"
import { CompanyConfig } from "@/types"
import { useEffect, useRef } from "react"

interface StoreHydratorProps {
    config: CompanyConfig
}

export function StoreHydrator({ config }: StoreHydratorProps) {
    const { setConfig } = useCompanyStore()
    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current && config) {
            // Transform date strings back to Date objects if needed, 
            // though serialization across server components might pass them as strings/Date depending on Next version.
            // Prisma returns Dates.
            setConfig({
                ...config,
                fechaInicio: new Date(config.fechaInicio),
                anioEgreso: config.anioEgreso ? new Date(config.anioEgreso.toString()) : undefined // logic for year -> date if store expects date
            })
            initialized.current = true
        }
    }, [config, setConfig])

    return null
}
