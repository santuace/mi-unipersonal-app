"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CompanyConfig } from "@/types"
import {
    calcularFonasaMensual,
    calcularCJPPU,
    getMontoMonotributo,
    TAX_CONSTANTS_2026
} from "@/lib/uruguay-taxes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface PreviewCardProps {
    config: Partial<CompanyConfig>
}

export function PreviewCard({ config }: PreviewCardProps) {
    const [costs, setCosts] = useState({
        fonasa: 0,
        cjppu: 0,
        fondo: 0,
        monotributo: 0,
        ivaMinimo: 0,
        total: 0
    })

    useEffect(() => {
        let newCosts = {
            fonasa: 0,
            cjppu: 0,
            fondo: 0,
            monotributo: 0,
            ivaMinimo: 0,
            total: 0
        }

        // Monotributo
        if (config.regimen === 'monotributo') {
            newCosts.monotributo = getMontoMonotributo(config.categoriaMonotributo || 'm_unipersonal')
        }

        // Literal E
        else if (config.regimen === 'literal_e') {
            // IVA Minimo (aprox $5200, user prompt says $5200)
            // We should put this in constants but for now hardcode or use constant if added
            newCosts.ivaMinimo = 5200
            // Can have Caja/Fonasa too
        }

        // Servicios Personales / General / Sociedad
        // Fonasa
        if (config.regimen !== 'monotributo' && config.aportes?.fonasa) {
            // We need an assumed income to calculate Fonasa estimate? 
            // Or allow user to input estimated income?
            // The prompt says "Costos Fijos Mensuales".
            // Fonasa minimum is fixed ($5020). Percentage depends on income.
            // We'll show the MINIMUM obligatory payment as the "Fixed Cost".
            // If they earn more, they pay more, but the *fixed* commitment is the minimum.
            const fonasaCalc = calcularFonasaMensual(0, config.situacionFamiliar || 'sin_carga')
            newCosts.fonasa = fonasaCalc.pagoMensualObligatorio
        }

        // CJPPU
        if (config.regimen !== 'monotributo' && config.aportes?.cajaProfesional) {
            const cat = config.categoriaCJPPU || 10 // Default 10 if not selected? Or 1?
            // Re-read: "Base: $7.566".
            const cjppuCalc = calcularCJPPU(false, config.anioEgreso, cat)
            newCosts.cjppu = cjppuCalc.cajaProfesional
            newCosts.fondo = config.aportes?.fondoSolidaridad ? cjppuCalc.fondoSolidaridad : 0
        }

        // Sum total
        newCosts.total = newCosts.monotributo + newCosts.ivaMinimo + newCosts.fonasa + newCosts.cjppu + newCosts.fondo

        setCosts(newCosts)

    }, [config])

    const formatMoney = (amount: number) => new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 }).format(amount)

    return (
        <Card className="h-full bg-slate-50 dark:bg-slate-900 border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Resumen de Costos Fijos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">
                        {formatMoney(costs.total)}
                        <span className="text-sm font-normal text-slate-500 ml-1">/mes</span>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                        {costs.monotributo > 0 && (
                            <div className="flex justify-between">
                                <span>Monotributo</span>
                                <span className="font-medium">{formatMoney(costs.monotributo)}</span>
                            </div>
                        )}

                        {costs.ivaMinimo > 0 && (
                            <div className="flex justify-between">
                                <span>IVA Mínimo</span>
                                <span className="font-medium">{formatMoney(costs.ivaMinimo)}</span>
                            </div>
                        )}

                        {costs.fonasa > 0 && (
                            <div className="flex justify-between">
                                <span>FONASA (Mínimo)</span>
                                <span className="font-medium">{formatMoney(costs.fonasa)}</span>
                            </div>
                        )}

                        {costs.cjppu > 0 && (
                            <div className="flex justify-between">
                                <span>Caja Profesionales</span>
                                <span className="font-medium">{formatMoney(costs.cjppu)}</span>
                            </div>
                        )}

                        {costs.fondo > 0 && (
                            <div className="flex justify-between">
                                <span>Fondo Solidaridad</span>
                                <span className="font-medium">{formatMoney(costs.fondo)}</span>
                            </div>
                        )}
                    </div>

                    {config.regimen === 'general' && (
                        <div className="mt-4 p-2 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                            <strong>Nota:</strong> Además pagarás IVA (22%) e IRPF Progresivo sobre lo facturado.
                        </div>
                    )}

                    {config.regimen === 'sociedad' && (
                        <div className="mt-4 p-2 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                            <strong>Nota:</strong> Pagarás IRAE (25%) sobre la renta neta real o ficta.
                        </div>
                    )}

                </div>
            </CardContent>
        </Card>
    )
}
