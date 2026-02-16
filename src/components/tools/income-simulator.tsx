"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { calcularIRPFMensual, calcularFonasaMensual, calcularCJPPU, TAX_CONSTANTS_2026 } from "@/lib/uruguay-taxes"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

export function IncomeSimulator() {
    const [ingresoMensual, setIngresoMensual] = useState([140000]) // Default user value

    const ingreso = ingresoMensual[0]

    // Cálculos en tiempo real
    const iva = ingreso * 0.22
    const totalFacturado = ingreso + iva

    const irpf = calcularIRPFMensual(ingreso)
    const fonasa = calcularFonasaMensual(ingreso).pagoMensualObligatorio

    // Profesionales en Caja: pagan CJPPU + Fondo + Fonasa
    const cjppuResult = calcularCJPPU()
    const cjppu = cjppuResult.cajaProfesional
    const fondo = cjppuResult.fondoSolidaridad

    const totalImpuestos = iva + irpf + fonasa + cjppu + fondo
    const liquido = totalFacturado - totalImpuestos

    // Porcentaje real de impuestos sobre lo facturado
    const presionFiscal = (totalImpuestos / totalFacturado) * 100

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-UY", {
            style: "currency",
            currency: "UYU",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Simulador de Sueldo Líquido
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Ajusta tu facturación mensual (sin IVA) para ver el impacto en tus bolsillos.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Ingreso Neto Mensual</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(ingreso)}</span>
                    </div>
                    <Slider
                        defaultValue={[140000]}
                        max={300000}
                        step={1000}
                        onValueChange={setIngresoMensual}
                        className="py-4"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Desglose de Costos</h4>
                        <div className="flex justify-between text-sm">
                            <span>IVA (Pasamanos):</span>
                            <span className="font-mono text-red-500">{formatCurrency(iva)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>IRPF (Anticipo):</span>
                            <span className="font-mono text-orange-500">{formatCurrency(irpf)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Fonasa (Mínimo):</span>
                            <span className="font-mono text-blue-500">{formatCurrency(fonasa)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Caja Profesional:</span>
                            <span className="font-mono text-purple-500">{formatCurrency(cjppu)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Fondo Solidaridad:</span>
                            <span className="font-mono text-purple-400">{formatCurrency(fondo)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-2 italic">
                            * Profesionales en Caja pagan: Caja + Fonasa
                        </div>
                    </div>

                    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-medium">Líquido Real en Mano</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(liquido)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            Presión Fiscal Real: {presionFiscal.toFixed(1)}% del total facturado.
                        </div>

                        {presionFiscal > 40 && (
                            <div className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/30 p-2 rounded">
                                ⚠️ Ojo: Estás entrando en terreno peligroso de IRPF. Considera gastos deducibles.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
