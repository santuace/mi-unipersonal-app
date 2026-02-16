# Contexto del Proyecto: Personal Finance CTFO App


## File: src/types/index.ts
```typescript
export type TipoIva = 22 | 10 | 0; // Ejemplo Uruguay/España (ajustable)
export type TipoIrpf = 7 | 15 | 0; // Ejemplo retenciones

export interface Factura {
    id: string;
    fecha: Date;
    cliente: string;
    concepto: string;
    montoNeto: number; // Sin impuestos
    tipoIva: TipoIva;
    tipoIrpf: TipoIrpf;
    ivaCalculado: number;
    irpfCalculado: number;
    totalPagar: number; // Lo que recibes tras retenciones o lo que pagas + IVA?
    // Normalmente: Neto + IVA - IRPF (si es retenido) = Liquido
    // O Neto + IVA = Total Facturado

    // Asumamos:
    // Total Facturado = Neto + IVA
    // Liquido a Cobrar = Neto + IVA - IRPF (si aplica retención directa)
    // Pero el usuario dijo "sepa cuanto pagar de IVA e IRPF".
    // Así que guardamos los valores calculados para reportes.

    estado: 'pendiente' | 'cobrada' | 'anulada';
}

export interface ResumenFiscal {
    totalFacturado: number;
    totalIva: number;
    totalIrpf: number;
    periodo: string; // "MM-YYYY"
}

```

## File: src/lib/uruguay-taxes.ts
```typescript
export const TAX_CONSTANTS_2026 = {
    BPC: 6864, // Base de Prestaciones y Contribuciones estimada 2026
    CPE: 6693, // Costo Promedio Equivalente (Fonasa) mensual estimado 2026
    CJPPU_ESCALON_1_FICTO: 33068, // Sueldo ficto Escalón 1 (Valor base 2026 ajustado)
    CJPPU_TASA: 0.165, // Tasa de aporte varía, pero para Escalón 1 suele ser ~16.5% - 20.5%. Usaremos el estándar. 
    // Corrección: El aporte jubilatorio es 16.5% + otros gravámenes.
    // El usuario mencionó 20.5% en su plan original, pero el ficto era erróneo.
    // Mantendremos 16.5% para jubilatorio puro o ajustaremos si hay feedback específico.
    // Feedback de Gemini: "Para el Escalón 1, el ficto actual ronda los $33.068".
    // Asumiremos la tasa de 16.5% sobre ese ficto para Jubilación + Timbre + Seguros si aplica.
    // Dejaremos 20.5% como margen de seguridad "CTFO" conservador o lo bajamos a 16.5%?
    // La ley vieja era 16.5%. La nueva 20.410 cambia escalas. 
    // Ante duda, 16.5% es la base jubilatoria.
    FONDO_SOLIDARIDAD: 1200, // Mensual promedio
    IVA_BASIC_RATE: 0.22,
    IVA_MIN_RATE: 0.10,
}

export function calcularIVA(monto: number, tasa: number = TAX_CONSTANTS_2026.IVA_BASIC_RATE) {
    return monto * tasa
}

/**
 * Calcula el IRPF mensual estimado (anticipo)
 * @param ingresosBrutosSum Monthly sum of net income (without VAT)
 */
export function calcularIRPFMensual(ingresosBrutosMes: number) {
    // Anticipo bimestral es sobre el 70% de ingresos brutos.
    // Aquí calculamos una proyección mensual.

    const rentaComputable = ingresosBrutosMes * 0.70

    // Escala IRPF anualizada paso a mensual (aprox para estimación)
    // Franjas 2025/2026 (en BPC Mensual)
    // 0 - 7 BPC: 0%
    // 7 - 10 BPC: 10%
    // 10 - 15 BPC: 15%
    // 15 - 30 BPC: 24%
    // 30 - 50 BPC: 25%
    // 50 - 75 BPC: 27%
    // 75 - 115 BPC: 31%
    // > 115 BPC: 36%

    const BPC = TAX_CONSTANTS_2026.BPC
    let impuesto = 0
    let remanente = rentaComputable

    // Franja 1: 0 - 7 BPC (Exento)
    const franja1 = 7 * BPC
    if (remanente > franja1) {
        remanente -= franja1
    } else {
        return 0
    }

    // Franja 2: 7 - 10 BPC (10%)
    const franja2 = 3 * BPC // (10 - 7)
    const taxable2 = Math.min(remanente, franja2)
    impuesto += taxable2 * 0.10
    remanente -= taxable2
    if (remanente <= 0) return impuesto

    // Franja 3: 10 - 15 BPC (15%)
    const franja3 = 5 * BPC // (15 - 10)
    const taxable3 = Math.min(remanente, franja3)
    impuesto += taxable3 * 0.15
    remanente -= taxable3
    if (remanente <= 0) return impuesto

    // Franja 4: 15 - 30 BPC (24%)
    const franja4 = 15 * BPC // (30 - 15)
    const taxable4 = Math.min(remanente, franja4)
    impuesto += taxable4 * 0.24
    remanente -= taxable4
    if (remanente <= 0) return impuesto

    // Franja 5: 30 - 50 BPC (25%)
    const franja5 = 20 * BPC
    const taxable5 = Math.min(remanente, franja5)
    impuesto += taxable5 * 0.25
    remanente -= taxable5
    if (remanente <= 0) return impuesto

    // Franja 6: 50 - 75 BPC (27%)
    const franja6 = 25 * BPC
    const taxable6 = Math.min(remanente, franja6)
    impuesto += taxable6 * 0.27
    remanente -= taxable6
    if (remanente <= 0) return impuesto

    // Franja 7: 75 - 115 BPC (31%)
    const franja7 = 40 * BPC
    const taxable7 = Math.min(remanente, franja7)
    impuesto += taxable7 * 0.31
    remanente -= taxable7
    if (remanente <= 0) return impuesto

    // Franja 8: > 115 BPC (36%)
    impuesto += remanente * 0.36

    return impuesto
}

export function calcularFonasaMensual(ingresosBrutosMensuales: number, tieneHijos: boolean = false, tieneConyuge: boolean = false) {
    // Pago mensual obligatorio: Costo Promedio Equivalente (CPE)
    // Este es el "Flujo de Fondos" real que sale del bolsillo cada mes.

    // Costo Real (Ajuste Anual):
    // Tasa aporte personal: 
    // - 4.5% si ingresos < 2.5 BPC
    // - 6% si ingresos > 2.5 BPC
    // + 1.5% si tiene hijos
    // + 2% si tiene cónyuge

    // Si (Costo Real > Pagos CPE anualizados) -> Hay que pagar la diferencia (Cierre anual).
    // Si (Pagos CPE > Costo Real) -> Devolución de Fonasa.

    const tasaBase = 0.06 // > 2.5 BPC
    const tasaAdicional = (tieneHijos ? 0.015 : 0) + (tieneConyuge ? 0.02 : 0)
    const tasaTotal = tasaBase + tasaAdicional

    const costoRealFonasa = ingresosBrutosMensuales * tasaTotal

    // Pago minimo mensual
    const pagoMensualCPE = TAX_CONSTANTS_2026.CPE

    return {
        pagoMensualObligatorio: pagoMensualCPE, // Para el dashboard de caja (La Dolorosa mensual)
        costoRealEstimado: costoRealFonasa,     // Para saber si estoy cubierto o tendré deuda a fin de año
        diferencia: costoRealFonasa - pagoMensualCPE // Si + es deuda anual, Si - es posible devolución
    }
}

export function calcularCJPPU() {
    const aporteCaja = TAX_CONSTANTS_2026.CJPPU_ESCALON_1_FICTO * TAX_CONSTANTS_2026.CJPPU_TASA
    return {
        cajaProfesional: aporteCaja,
        fondoSolidaridad: TAX_CONSTANTS_2026.FONDO_SOLIDARIDAD,
        total: aporteCaja + TAX_CONSTANTS_2026.FONDO_SOLIDARIDAD
    }
}

```

## File: src/lib/ocr-parser.ts
```typescript

export interface ExtractedData {
    fecha?: Date;
    rut?: string;
    montoTotal?: number;
    iva?: number;
    posibleProveedor?: string;
}

export function parseInvoiceText(text: string): ExtractedData {
    const lines = text.split('\n');
    const data: ExtractedData = {};

    // 1. Buscando Fecha
    // Patrones: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
    const datePattern = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})|(\d{4})[\/\-](\d{2})[\/\-](\d{2})/;
    const dateMatch = text.match(datePattern);

    if (dateMatch) {
        // Intentar construir fecha
        try {
            if (dateMatch[1]) {
                // DD/MM/YYYY
                const day = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]) - 1;
                const year = parseInt(dateMatch[3]);
                data.fecha = new Date(year, month, day);
            } else {
                // YYYY-MM-DD
                const year = parseInt(dateMatch[4]);
                const month = parseInt(dateMatch[5]) - 1;
                const day = parseInt(dateMatch[6]);
                data.fecha = new Date(year, month, day);
            }
        } catch (e) {
            console.error("Error parsing date", e);
        }
    }

    // 2. Buscando RUT (12 dígitos, a veces con espacios o guiones)
    // UTE: 21xxxxxx001x Antel: 21xxxxxx001x
    const rutPattern = /\b21\d{10}\b/; // Simplificado para UY 21...
    const rutMatch = text.match(rutPattern);
    if (rutMatch) {
        data.rut = rutMatch[0];
    }

    // 3. Buscando Montos
    // Buscar linea con "Total" o "Importe Total" y un numero
    // Regex para moneda UY:  $ 1.234,56 o 1234.56

    // Estrategia: Buscar "Total" y tomar el primer numero que aparezca despues en la misma linea o la siguiente.
    const totalPattern = /(?:Total|TOTAL|Importe Total)[\s\S]{0,20}?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/;
    const totalMatch = text.match(totalPattern);

    if (totalMatch) {
        // Limpiar numero: quitar puntos de miles, cambiar coma decimal por punto (si es UY).
        // Asumimos formato español: 1.234,56 -> 1234.56
        let imp = totalMatch[1].replace(/\./g, '').replace(',', '.');
        data.montoTotal = parseFloat(imp);
    } else {
        // Fallback: Buscar el numero más grande en el texto (arriesgado pero útil)
        // O buscar "IVA" y calcular reverso.
    }

    // 4. Proveedor (Heurística simple por palabras clave)
    const lowerText = text.toLowerCase();
    if (lowerText.includes('ute') || lowerText.includes('usinas')) data.posibleProveedor = 'UTE';
    else if (lowerText.includes('antel')) data.posibleProveedor = 'Antel';
    else if (lowerText.includes('ose')) data.posibleProveedor = 'OSE';

    return data;
}

```

## File: src/store/invoices.ts
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Factura } from '@/types';

interface InvoiceState {
    invoices: Factura[];
    addInvoice: (invoice: Omit<Factura, 'id'>) => void;
    removeInvoice: (id: string) => void;
    updateInvoice: (id: string, invoice: Partial<Factura>) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
    persist(
        (set) => ({
            invoices: [],
            addInvoice: (invoice) =>
                set((state) => ({
                    invoices: [
                        ...state.invoices,
                        { ...invoice, id: crypto.randomUUID() },
                    ],
                })),
            removeInvoice: (id) =>
                set((state) => ({
                    invoices: state.invoices.filter((inv) => inv.id !== id),
                })),
            updateInvoice: (id, updatedInvoice) =>
                set((state) => ({
                    invoices: state.invoices.map((inv) =>
                        inv.id === id ? { ...inv, ...updatedInvoice } : inv
                    ),
                })),
        }),
        {
            name: 'invoice-storage',
        }
    )
);

```

## File: src/store/expenses.ts
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Gasto {
    id: string;
    fecha: Date;
    descripcion: string;
    proveedor: string;
    montoTotal: number;
    tasaIva: 0.22 | 0.10 | 0;
    ivaDeducible: number;
    categoria: 'Oficina' | 'Equipos' | 'Servicios' | 'Otros';
}

interface ExpenseState {
    gastos: Gasto[];
    addGasto: (gasto: Omit<Gasto, 'id' | 'ivaDeducible'>) => void;
    removeGasto: (id: string) => void;
}

export const useExpenseStore = create<ExpenseState>()(
    persist(
        (set) => ({
            gastos: [],
            addGasto: (gasto) => {
                const iva = gasto.montoTotal - (gasto.montoTotal / (1 + gasto.tasaIva));
                set((state) => ({
                    gastos: [
                        ...state.gastos,
                        {
                            ...gasto,
                            id: crypto.randomUUID(),
                            ivaDeducible: iva
                        },
                    ],
                }));
            },
            removeGasto: (id) =>
                set((state) => ({
                    gastos: state.gastos.filter((g) => g.id !== id),
                })),
        }),
        {
            name: 'expense-storage',
        }
    )
);

```

## File: src/components/dashboard/tax-summary.tsx
```typescript
"use client"

import { useInvoiceStore } from "@/store/invoices"
import { useExpenseStore } from "@/store/expenses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, PiggyBank, Landmark } from "lucide-react"
import { calcularIRPFMensual, calcularFonasaMensual, calcularCJPPU, TAX_CONSTANTS_2026 } from "@/lib/uruguay-taxes"

export function TaxSummary() {
    const invoices = useInvoiceStore((state) => state.invoices)
    const expenses = useExpenseStore((state) => state.gastos)

    // 1. Calcular Totales de Ventas
    const totalVentas = invoices.reduce(
        (acc, inv) => ({
            neto: acc.neto + inv.montoNeto,
            iva: acc.iva + inv.ivaCalculado,
            total: acc.total + inv.totalPagar,
        }),
        { neto: 0, iva: 0, total: 0 }
    )

    // 2. Calcular Totales de Compras (Gastos) para descontar IVA
    const totalCompras = expenses.reduce(
        (acc, exp) => ({
            ivaDeducible: acc.ivaDeducible + exp.ivaDeducible,
        }),
        { ivaDeducible: 0 }
    )

    // 3. Cálculos Fiscales Avanzados (Estimación Mensual Promedio para Dashboard)
    // Para ser más precisos, deberíamos filtrar por mes actual, pero el usuario quiere un snapshot general.
    // Asumiremos que el "Total Facturado" es un acumulado y haremos proyecciones o mostraremos totales acumulados.
    // SIMPLIFICACIÓN: Mostraremos los impuestos proporcionales al total facturado acumulado para dar una idea clara de "Cuánto de esta plata es mía".

    const ivaAPagar = Math.max(0, totalVentas.iva - totalCompras.ivaDeducible)

    // IRPF: Sobre el neto facturado
    // Nota: El IRPF es progresivo anual. Aquí aplicaremos la función mensual al promedio o al total como si fuera un mes "grande"?
    // Mejor: Calcular IRPF sobre el total facturado asumiento que es el ingreso del período.
    // Si facturó 140.000 un mes, el irpf es X. Si facturó 280.000 en dos meses, el irpf es 2X (aprox).
    // Usaremos el cálculo directo sobre el monto neto acumulado "como si fuera un mes" para simplificar la vista, 
    // OJO: Si acumula mucho, se pasará de franja artificialmente.
    // SOLUCIÓN "CTFO": Proyectar IRPF mensual basado en el promedio mensual si hay datos de tiempo, sino usar el total directo.
    // Para este MVP, calcularemos el IRPF de este "lote" de facturas.
    const irpfEstimado = calcularIRPFMensual(totalVentas.neto)

    // 4. Fonasa: Ajuste anual vs Pago Mensual
    // El pago es fijo (CPE), pero si facturas mucho, el "Costo Real" es mayor.
    // El CTFO debe avisarte si estás generando deuda.
    const fonasaData = calcularFonasaMensual(totalVentas.neto)
    const deudaFonasaPotencial = Math.max(0, fonasaData.diferencia)

    // Costos Fijos (BPS + CJPPU)
    // Estos son mensuales fijos independientes de la facturación.
    // Deberíamos preguntar "cuántos meses cubre esta facturación".
    // Asumiremos 1 mes para el MVP de "Foto del Momento".
    const costosFijosBPS = fonasaData.pagoMensualObligatorio // Usamos el pago caja, no el costo
    const costosFijosCJPPU = calcularCJPPU().total
    const totalCostosFijos = costosFijosBPS + costosFijosCJPPU

    // Totales
    const totalImpuestos = ivaAPagar + irpfEstimado + totalCostosFijos
    const sueldoLiquido = totalVentas.neto - irpfEstimado - totalCostosFijos
    // Nota: El IVA no es costo, es pasamanos, pero sale del "Total Cobrado".
    // Liquido "En mano" = Total Cobrado (Neto + IVA) - IVA a Pagar - IRPF - Entes
    // Liquido "En mano" = (Neto + IVA) - (IVA Ventas - IVA Compras) - IRPF - Entes
    const liquidoEnBanco = (totalVentas.neto + totalVentas.iva) - ivaAPagar - irpfEstimado - totalCostosFijos

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-UY", {
            style: "currency",
            currency: "UYU",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {/* 1. Ingresos Brutos */}
            <Card className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
                    <CardTitle className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Ingresos Brutos</CardTitle>
                    <DollarSign className="h-3.5 w-3.5 text-zinc-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-xl font-bold">{formatCurrency(totalVentas.neto)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        Sin IVA
                    </p>
                </CardContent>
            </Card>

            {/* 2. La Dolorosa (Reserva Fiscal) */}
            <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
                    <CardTitle className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Reserva Fiscal</CardTitle>
                    <Landmark className="h-3.5 w-3.5 text-red-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalImpuestos)}</div>

                    <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground mt-2 border-t pt-1.5 border-red-100 dark:border-red-900/30">
                        <div className="flex justify-between"><span>IVA DGI:</span> <span className="font-medium text-foreground">{formatCurrency(ivaAPagar)}</span></div>
                        <div className="flex justify-between"><span>IRPF:</span> <span className="font-medium text-foreground">{formatCurrency(irpfEstimado)}</span></div>
                        <div className="flex justify-between"><span>Fijos (BPS/Caja):</span> <span className="font-medium text-foreground">{formatCurrency(totalCostosFijos)}</span></div>
                    </div>

                    <div className="mt-2 text-[10px] bg-red-100/50 dark:bg-red-900/20 px-2 py-1 rounded text-red-800 dark:text-red-300">
                        {deudaFonasaPotencial > 0 ? (
                            <div className="font-medium">
                                ⚠️ Deuda Fonasa est: {formatCurrency(deudaFonasaPotencial)}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">⚠️ Apartar inmediatamente</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 3. Sueldo Líquido (A la Buchaca) */}
            <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
                    <CardTitle className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">Líquido Real</CardTitle>
                    <PiggyBank className="h-3.5 w-3.5 text-green-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(sueldoLiquido)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        Disponible para gastos personales
                    </p>
                    {totalVentas.neto > 0 && (
                        <div className="mt-2 text-[10px] bg-green-100/50 dark:bg-green-900/20 px-2 py-1 rounded text-green-800 dark:text-green-300 inline-block font-medium">
                            ✅ {((sueldoLiquido / totalVentas.neto) * 100).toFixed(1)}% de efectividad
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 4. IVA Compras (Deducible) */}
            <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
                    <CardTitle className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">IVA Compras</CardTitle>
                    <ArrowDownRight className="h-3.5 w-3.5 text-blue-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalCompras.ivaDeducible)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        Descontado de DGI
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

```

## File: src/components/invoices/invoice-form.tsx
```typescript
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useInvoiceStore } from "@/store/invoices"
import { DocumentScanner } from "@/components/ocr/document-scanner"

const formSchema = z.object({
    cliente: z.string().min(2, {
        message: "El nombre del cliente debe tener al menos 2 caracteres.",
    }),
    concepto: z.string().min(2, {
        message: "El concepto debe tener al menos 2 caracteres.",
    }),
    montoNeto: z.coerce.number().min(0.01, {
        message: "El monto debe ser mayor a 0.",
    }),
    fecha: z.date({
        message: "La fecha es requerida.",
    }).refine((date) => date !== null, {
        message: "La fecha es requerida.",
    }),
    tipoIva: z.coerce.number(),
    tipoIrpf: z.coerce.number(),
})

export function InvoiceForm() {
    const addInvoice = useInvoiceStore((state) => state.addInvoice)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            cliente: "",
            concepto: "",
            montoNeto: 0,
            tipoIva: 22,
            tipoIrpf: 7,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        const ivaCalculado = values.montoNeto * (values.tipoIva / 100)
        const irpfCalculado = values.montoNeto * (values.tipoIrpf / 100)

        // Total a cobrar (liquido) o Total Facturado?
        // Guardamos los calculos.
        // Total Pagar (Tax Liability) = IVA + IRPF? No, usually IRPF is a partial payment.
        // Let's store the calculated taxes.

        const total = values.montoNeto + ivaCalculado

        addInvoice({
            ...values,
            tipoIva: values.tipoIva as any,
            tipoIrpf: values.tipoIrpf as any,
            ivaCalculado,
            irpfCalculado,
            totalPagar: total, // Total de la factura
            estado: 'pendiente',
        })

        toast.success("Factura agregada correctamente")
        form.reset({
            cliente: "",
            concepto: "",
            montoNeto: 0,
            tipoIva: 22,
            tipoIrpf: 7,
            fecha: new Date(),
        })
    }

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Autocompletar con Factura (OCR)</label>
                <DocumentScanner onScanComplete={(data) => {
                    // Asumimos que lo escaneado es el total, despejamos IVA basico por defecto si no se detecta otra cosa
                    // O mejor: seteamos el total como neto y que el usuario ajuste.
                    if (data.montoTotal) form.setValue('montoNeto', data.montoTotal)
                    if (data.fecha) form.setValue('fecha', data.fecha)
                    // En ingreso, el 'proveedor' detectado seria el emisor (nosotros), asi que no sirve de mucho 
                    // a menos que sea una factura de compra.
                    // Pero si detectamos texto, lo podemos poner en concepto.
                    form.setValue('concepto', `Factura ${data.rut || ''}`)
                }} />
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
                    <h2 className="text-xl font-semibold mb-4">Nueva Factura</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="fecha"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Seleccionar fecha</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cliente"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre del cliente" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="concepto"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Concepto</FormLabel>
                                <FormControl>
                                    <Input placeholder="Servicios de..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="montoNeto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto Neto</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tipoIva"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IVA (%)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar IVA" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="22">22% (Básico)</SelectItem>
                                            <SelectItem value="10">10% (Mínimo)</SelectItem>
                                            <SelectItem value="0">Exento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tipoIrpf"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IRPF (%)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar IRPF" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="7">7%</SelectItem>
                                            <SelectItem value="15">15%</SelectItem>
                                            <SelectItem value="0">0%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit" className="w-full">Guardar Factura</Button>
                </form>
            </Form>
        </div >
    )
}

```

## File: src/components/expenses/expense-form.tsx
```typescript
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useExpenseStore } from "@/store/expenses"
import { DocumentScanner } from "@/components/ocr/document-scanner"

const expenseSchema = z.object({
    descripcion: z.string().min(2, "Descripción requerida"),
    proveedor: z.string().min(2, "Proveedor requerido"),
    montoTotal: z.coerce.number().min(1, "Monto debe ser mayor a 0"),
    tasaIva: z.coerce.number(),
    categoria: z.enum(['Oficina', 'Equipos', 'Servicios', 'Otros']),
    fecha: z.date(),
})

export function ExpenseForm() {
    const addGasto = useExpenseStore((state) => state.addGasto)

    const form = useForm<z.infer<typeof expenseSchema>>({
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: {
            descripcion: "",
            proveedor: "",
            montoTotal: 0,
            tasaIva: 0.22,
            categoria: 'Otros',
            fecha: new Date(),
        },
    })

    function onSubmit(values: z.infer<typeof expenseSchema>) {
        // @ts-ignore: tasaIva cast issue
        addGasto(values)
        toast.success("Gasto registrado", {
            description: `Se descontará IVA del cálculo final.`
        })
        form.reset({
            descripcion: "",
            proveedor: "",
            montoTotal: 0,
            tasaIva: 0.22,
            categoria: 'Otros',
            fecha: new Date(),
        })
    }

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Cargar Factura (OCR)</label>
                <DocumentScanner onScanComplete={(data) => {
                    if (data.montoTotal) form.setValue('montoTotal', data.montoTotal)
                    if (data.fecha) form.setValue('fecha', data.fecha)
                    if (data.posibleProveedor) form.setValue('proveedor', data.posibleProveedor)
                    if (data.rut) toast.info(`RUT Detectado: ${data.rut}`)

                    form.setValue('descripcion', `Gasto escaneado ${data.posibleProveedor || ''}`)
                }} />
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Seleccionar fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="proveedor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proveedor</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Antel, UTE, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="montoTotal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto Total (c/IVA)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="tasaIva"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tasa IVA</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="22%" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="0.22">22%</SelectItem>
                                            <SelectItem value="0.10">10%</SelectItem>
                                            <SelectItem value="0">Exento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="categoria"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Oficina">Oficina</SelectItem>
                                            <SelectItem value="Equipos">Equipos</SelectItem>
                                            <SelectItem value="Servicios">Servicios</SelectItem>
                                            <SelectItem value="Otros">Otros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                    <Input placeholder="Detalle del gasto" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full">Registrar Gasto</Button>
                </form>
            </Form>
        </div>
    )
}

```

## File: src/components/ocr/document-scanner.tsx
```typescript
"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Tesseract from 'tesseract.js'
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseInvoiceText, ExtractedData } from '@/lib/ocr-parser'
import { toast } from "sonner"

interface DocumentScannerProps {
    onScanComplete: (data: ExtractedData, text: string) => void;
}

export function DocumentScanner({ onScanComplete }: DocumentScannerProps) {
    const [isScanning, setIsScanning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState("")

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        processFile(file)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
            'application/pdf': ['.pdf'] // Tesseract supports images, for PDF we might need conversion or just stick to images for MVP
        },
        maxFiles: 1
    })

    const processFile = async (file: File) => {
        setIsScanning(true)
        setProgress(0)
        setStatus("Inicializando motor OCR...")

        const imageUrl = URL.createObjectURL(file);

        try {
            const worker = await Tesseract.createWorker('spa', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(m.progress * 100)
                        setStatus(`Escaneando: ${Math.round(m.progress * 100)}%`)
                    } else {
                        setStatus(m.status)
                    }
                },
                errorHandler: (err) => console.error(err)
            });

            const { data: { text } } = await worker.recognize(imageUrl);

            await worker.terminate();

            setStatus("Analizando datos...")
            const extracted = parseInvoiceText(text)

            toast.success("Documento procesado", {
                description: extracted.montoTotal ? `Monto detectado: $${extracted.montoTotal}` : "Revise los datos extraídos."
            })

            onScanComplete(extracted, text)

        } catch (error: any) {
            console.error(error)
            setStatus("Error")
            toast.error("Error al escanear", {
                description: error.message || "No se pudo leer el archivo. Intente con una imagen más clara."
            })
        } finally {
            URL.revokeObjectURL(imageUrl);
            setIsScanning(false)
            setProgress(100)
            if (status !== "Error") setStatus("Listo")
        }
    }

    return (
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-0">
                <div
                    {...getRootProps()}
                    className={`
                flex flex-col items-center justify-center p-8 cursor-pointer min-h-[150px]
                ${isDragActive ? 'bg-primary/5' : ''}
            `}
                >
                    <input {...getInputProps()} />

                    {isScanning ? (
                        <div className="w-full space-y-4 max-w-xs text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium">{status}</p>
                                <Progress value={progress} className="h-2" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <div className="bg-muted rounded-full p-4 w-fit mx-auto">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Arrastra tu factura aquí</p>
                                <p className="text-xs text-muted-foreground">o haz clic para seleccionar (Imagen)</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

```

## File: src/app/page.tsx
```typescript
"use client"

import { InvoiceForm } from "@/components/invoices/invoice-form"
import { InvoiceList } from "@/components/invoices/invoice-list"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { TaxSummary } from "@/components/dashboard/tax-summary"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { IncomeSimulator } from "@/components/tools/income-simulator"
import { Notifications } from "@/components/notifications/notifications"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"
import { Toaster } from "sonner"

export default function Home() {
  const [openInvoice, setOpenInvoice] = useState(false)
  const [openExpense, setOpenExpense] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      <Notifications />
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Mis Finanzas <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">CTFO</span>
            </h1>
            <p className="text-sm text-muted-foreground">Gestión fiscal inteligente (Ley 20.410)</p>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />

            <Dialog open={openExpense} onOpenChange={setOpenExpense}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 px-3">
                  <Minus className="h-3.5 w-3.5" />
                  Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Registrar Gasto Deducible</DialogTitle>
                  <DialogDescription>
                    Ingresa gastos operativos para descontar IVA.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <ExpenseForm />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-2 px-3">
                  <Plus className="h-3.5 w-3.5" />
                  Factura
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Ingresar Nueva Factura</DialogTitle>
                  <DialogDescription>
                    Completa los datos. El sistema calculará IRPF y apartados automáticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <InvoiceForm />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="dashboard" className="text-xs">Dashboard CTFO</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">Simulador</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs">Calendario</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <TaxSummary />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Ingresos Recientes</h2>
                <InvoiceList />
              </div>
              {/* Aquí podríamos poner la lista de gastos en el futuro */}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div className="max-w-2xl mx-auto">
              <IncomeSimulator />
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

```

## File: package.json
```typescript
{
  "name": "invoice-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.563.0",
    "next": "16.1.6",
    "next-themes": "^0.4.6",
    "radix-ui": "^1.4.3",
    "react": "19.2.3",
    "react-day-picker": "^9.13.2",
    "react-dom": "19.2.3",
    "react-dropzone": "^15.0.0",
    "react-hook-form": "^7.71.1",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "tesseract.js": "^7.0.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "shadcn": "^3.8.4",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  }
}

```

