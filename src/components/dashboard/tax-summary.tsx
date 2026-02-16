"use client"

import { useInvoiceStore } from "@/store/invoices"
import { useExpenseStore } from "@/store/expenses"
import { useCompanyStore } from "@/store/company"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, PiggyBank, Landmark, Calendar, Clock } from "lucide-react"
import {
    calcularIRPFMensual,
    calcularFonasaMensual,
    calcularCJPPU,
    getBimestreActual,
    getProximoVencimiento,
    diasHastaVencimiento,
    getMontoMonotributo,
    getMontoCJPPU
} from "@/lib/uruguay-taxes"
import { format, isSameMonth } from "date-fns"
import { es } from "date-fns/locale"

import { useMemo } from "react"

export function TaxSummary() {
    const invoices = useInvoiceStore((state) => state.invoices)
    const expenses = useExpenseStore((state) => state.gastos)
    const { regimen, aportes, situacionFamiliar, anioEgreso, categoriaMonotributo, categoriaCJPPU: catCJPPU } = useCompanyStore()

    // ============================================
    // CONTEXTO TEMPORAL (Vencimientos: Bimestre / Datos: Mes)
    // ============================================
    const bimestreActual = getBimestreActual()
    const proximoVencimiento = getProximoVencimiento()
    const diasRestantes = diasHastaVencimiento()
    const hoy = new Date()

    // Usar useMemo para cálculos costosos
    const { totalVentas, totalCompras, calculosFiscales } = useMemo(() => {
        // Filtrar facturas del MES actual
        const facturasMes = invoices.filter(inv =>
            isSameMonth(new Date(inv.fecha), hoy)
        )

        // Filtrar gastos del MES actual
        const gastosMes = expenses.filter(exp =>
            isSameMonth(new Date(exp.fecha), hoy)
        )

        // 1. Calcular Totales de Ventas del Mes
        const ventas = facturasMes.reduce(
            (acc, inv) => ({
                neto: acc.neto + inv.montoNeto,
                iva: acc.iva + inv.ivaCalculado,
                retencion: acc.retencion + (inv.montoRetencion || 0),
                total: acc.total + inv.totalPagar,
                count: acc.count + 1
            }),
            { neto: 0, iva: 0, retencion: 0, total: 0, count: 0 }
        )

        // 2. Calcular Totales de Compras (Gastos) del Mes
        const compras = gastosMes.reduce(
            (acc, exp) => ({
                ivaDeducible: acc.ivaDeducible + exp.ivaDeducible,
            }),
            { ivaDeducible: 0 }
        )

        // 3. Cálculos Fiscales Mensuales

        // --- LOGICA MONOTRIBUTO ---
        if (regimen === 'monotributo') {
            const montoMonotributo = getMontoMonotributo(categoriaMonotributo)
            return {
                totalVentas: ventas,
                totalCompras: compras,
                calculosFiscales: {
                    ivaAPagar: 0,
                    irpfEstimado: 0,
                    costosCJPPU: 0,
                    costosFondo: 0,
                    costosFonasa: 0,
                    montoMonotributo,
                    totalAportesFijos: montoMonotributo,
                    totalReserva: Math.max(0, montoMonotributo - ventas.retencion),
                    sueldoLiquido: ventas.neto - montoMonotributo
                }
            }
        }

        // --- RESTO DE REGIMENES ---

        // IVA
        // Si es Literal E, paga IVA Mínimo fijo (aprox 5200).
        let ivaAPagar = Math.max(0, ventas.iva - compras.ivaDeducible)
        let costoIVA_Minimo = 0

        if (regimen === 'literal_e') {
            ivaAPagar = 0 // No paga IVA por facturación
            costoIVA_Minimo = 5200 // Estimado 2024/25. Deberíamos moverlo a constants.
            // Literal E paga este fijo a DGI.
        }

        // IRPF
        // Si es Literal E, no paga IRPF, el fijo cubre DGI.
        let irpfEstimado = calcularIRPFMensual(ventas.neto)
        if (regimen === 'literal_e') {
            irpfEstimado = 0
        }

        // Costos Reales: Caja + Fonasa + Fondo
        const fechaEgreso = anioEgreso ? new Date(anioEgreso) : undefined
        // Pass categoriaCJPPU if available
        const cjppuResult = calcularCJPPU(false, fechaEgreso, catCJPPU || 10)

        // Aplicamos flags de configuración
        const costosCJPPU = aportes?.cajaProfesional ? cjppuResult.cajaProfesional : 0
        const costosFondo = aportes?.fondoSolidaridad ? cjppuResult.fondoSolidaridad : 0

        // Fonasa
        const fonasaResult = calcularFonasaMensual(ventas.neto, situacionFamiliar)
        const costosFonasa = aportes?.fonasa ? fonasaResult.pagoMensualObligatorio : 0

        const totalAportesFijos = costosCJPPU + costosFonasa + costosFondo + costoIVA_Minimo

        // Reserva Fiscal Total
        // Para Literal E, el "IVA Mínimo" es parte de la reserva fiscal.
        // Para Regimen General, es IVA a Pagar + IRPF + Fijos.
        const totalReserva = Math.max(0, (ivaAPagar + irpfEstimado + totalAportesFijos) - ventas.retencion)

        // Sueldo Líquido Real
        const sueldoLiquido = ventas.neto - irpfEstimado - totalAportesFijos - ivaAPagar

        return {
            totalVentas: ventas,
            totalCompras: compras,
            calculosFiscales: {
                ivaAPagar,
                irpfEstimado,
                costosCJPPU,
                costosFondo,
                costosFonasa,
                costoIVA_Minimo, // Return this to display if needed
                totalAportesFijos,
                totalReserva,
                sueldoLiquido
            }
        }
    }, [invoices, expenses, regimen, aportes, situacionFamiliar, anioEgreso, categoriaMonotributo, catCJPPU])

    const { ivaAPagar, irpfEstimado, costosCJPPU, costosFondo, costosFonasa, totalReserva, sueldoLiquido, montoMonotributo, costoIVA_Minimo } = calculosFiscales

    // Función auxiliar para fechas
    const currentMonthLabel = format(hoy, "MMMM yyyy", { locale: es })

    const formatCurrency = (amount: number | undefined) => {
        return new Intl.NumberFormat("es-UY", {
            style: "currency",
            currency: "UYU",
            maximumFractionDigits: 0,
        }).format(amount || 0)
    }

    return (
        <div className="space-y-3">
            {/* Context Banner */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/30">
                <CardContent className="p-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <div>
                                <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-tight">
                                    Resumen Mensual: {currentMonthLabel}
                                </div>
                                <div className="text-[10px] text-blue-700 dark:text-blue-300">
                                    Bimestre: {bimestreActual.nombre} • Facturas mes: {totalVentas.count}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <div className="text-right">
                                <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                                    Vence: {format(proximoVencimiento, "d 'de' MMMM", { locale: es })}
                                </div>
                                <Badge
                                    variant={diasRestantes <= 7 ? "destructive" : diasRestantes <= 15 ? "default" : "secondary"}
                                    className="text-[10px] h-4 px-1.5"
                                >
                                    {diasRestantes} días restantes
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard Cards */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {/* 1. Ingresos Brutos */}
                <Card className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
                        <CardTitle className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Ingresos Brutos</CardTitle>
                        <DollarSign className="h-3.5 w-3.5 text-zinc-500" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">{formatCurrency(totalVentas.neto)}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Sin IVA (Mensual)
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Reserva Fiscal */}
                <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
                        <CardTitle className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Reserva Fiscal</CardTitle>
                        <Landmark className="h-3.5 w-3.5 text-red-500" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalReserva)}</div>

                        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground mt-1.5 border-t pt-1 border-red-100 dark:border-red-900/30">
                            {regimen === 'monotributo' ? (
                                <div className="flex justify-between font-medium text-red-700 dark:text-red-300">
                                    <span>Monotributo Unificado:</span>
                                    <span>{formatCurrency(montoMonotributo)}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between"><span>IVA (Pasamanos):</span> <span className="font-medium text-foreground">{formatCurrency(ivaAPagar)}</span></div>

                                    {regimen === 'literal_e' && (
                                        <div className="flex justify-between"><span>IVA Mínimo (DGI):</span> <span className="font-medium text-foreground">{formatCurrency(costoIVA_Minimo)}</span></div>
                                    )}

                                    <div className="flex justify-between"><span>IRPF Mensual:</span> <span className="font-medium text-foreground">{formatCurrency(irpfEstimado)}</span></div>

                                    <div className="mt-1 border-t border-red-50 dark:border-red-900/10 pt-0.5 font-semibold text-[9px] uppercase tracking-tighter text-red-800 dark:text-red-400">
                                        Aportes Fijos Obligatorios
                                    </div>
                                    {aportes?.cajaProfesional && (
                                        <div className="flex justify-between pl-1"><span>- Caja Profesional:</span> <span className="font-medium text-foreground">{formatCurrency(costosCJPPU)}</span></div>
                                    )}
                                    {aportes?.fonasa && (
                                        <div className="flex justify-between pl-1"><span>- Fonasa (Mínimo):</span> <span className="font-medium text-foreground">{formatCurrency(costosFonasa)}</span></div>
                                    )}
                                    {aportes?.fondoSolidaridad && (
                                        <div className="flex justify-between pl-1"><span>- Fondo Solidaridad:</span> <span className="font-medium text-foreground">{formatCurrency(costosFondo)}</span></div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="mt-1.5 text-[10px] bg-red-100/50 dark:bg-red-950/30 px-2 py-0.5 rounded text-red-800 dark:text-red-200 font-medium">
                            <div className="flex items-center gap-1">⚠️ Apartar este mes</div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Sueldo Líquido */}
                <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
                        <CardTitle className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">Líquido Real</CardTitle>
                        <PiggyBank className="h-3.5 w-3.5 text-green-500" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(sueldoLiquido)}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Ya descontados Costos e IRPF
                        </p>
                        {totalVentas.neto > 0 && (
                            <div className="mt-1.5 text-[10px] bg-green-100/50 dark:bg-green-950/30 px-2 py-0.5 rounded text-green-800 dark:text-green-200 inline-block font-medium">
                                ✅ {((sueldoLiquido / totalVentas.neto) * 100).toFixed(1)}% de rentabilidad
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. IVA Compras */}
                <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
                        <CardTitle className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">IVA Compras</CardTitle>
                        <ArrowDownRight className="h-3.5 w-3.5 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalCompras.ivaDeducible)}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Mensual descontado
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
