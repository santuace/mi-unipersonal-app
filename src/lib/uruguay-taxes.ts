import { SituacionFamiliar } from "@/types"

export const TAX_CONSTANTS_2026 = {
    BPC: 6864, // Base de Prestaciones y Contribuciones estimada 2026
    CPE_MINIMO: 5020, // FONASA Mínimo Obligatorio 2026 (sin hijos ni pareja)
    CJPPU_ESCALON_10_MONTO: 7566, // Caja Profesional Escala 10 - Monto fijo mensual 2026
    CJPPU_ESCALON_10_ABATIDO: 6828, // Opción con fictos abatidos
    FONDO_SOLIDARIDAD: 1200, // Mensual promedio
    IVA_BASIC_RATE: 0.22,
    IVA_MIN_RATE: 0.10,
    MONOTRIBUTO_CATEGORIAS: {
        m_social: 1860,
        m_unipersonal: 3450,
        m_asociativa: 5600,
        m_profesional: 7600
    },
    CJPPU_ESCALAS: [
        7566,  // Cat 1 (Base)
        8900,  // Cat 2
        10200, // Cat 3
        11500, // Cat 4
        12900, // Cat 5
        14300, // Cat 6
        15800, // Cat 7
        17400, // Cat 8
        19100, // Cat 9
        21000  // Cat 10
    ]
}

export function calcularIVA(monto: number, tasa: number = TAX_CONSTANTS_2026.IVA_BASIC_RATE) {
    return monto * tasa
}

// ... (IRPF remains same)

export function getMontoMonotributo(categoria: keyof typeof TAX_CONSTANTS_2026.MONOTRIBUTO_CATEGORIAS = 'm_unipersonal') {
    return TAX_CONSTANTS_2026.MONOTRIBUTO_CATEGORIAS[categoria] || 0
}

export function getMontoCJPPU(categoria: number = 10) {
    // categoria 1-10. Array index 0-9.
    const index = Math.max(0, Math.min(categoria - 1, 9))
    return TAX_CONSTANTS_2026.CJPPU_ESCALAS[index]
}

export function calcularFonasaMensual(ingresosBrutosMensuales: number, situacion: SituacionFamiliar = 'sin_carga') {
    // Tasas segun situación familiar
    // - Sin hijos ni pareja: 4.5%
    // - Con hijos: 6%
    // - Con cónyuge e hijos: 6.5%

    let tasaTotal = 0.045
    if (situacion === 'con_hijos') tasaTotal = 0.06
    if (situacion === 'con_conyuge_hijos') tasaTotal = 0.065

    const baseFonasa = ingresosBrutosMensuales * 0.70 // 70% de facturación
    const costoCalculado = baseFonasa * tasaTotal

    // El pago mensual es el mayor entre el calculado y el mínimo
    const pagoMensualObligatorio = Math.max(costoCalculado, TAX_CONSTANTS_2026.CPE_MINIMO)

    return {
        pagoMensualObligatorio,
        costoCalculado,
        minimoLegal: TAX_CONSTANTS_2026.CPE_MINIMO,
        diferencia: 0
    }
}

export function calcularCJPPU(usarAbatido: boolean = false, anioEgreso?: Date, categoria: number = 10) {
    // Monto según categoría (Default 10 si no se especifica, para compatibilidad con código anterior que asumía Escala 10)
    // Pero el Wizard pasará la categoría elegida.
    // Si 'usarAbatido' is true, we might need a separate scale, but for MVP we ignore it or assume Scale 1 is abatido-like?
    // Let's stick to the Scale array.

    const montoMensual = getMontoCJPPU(categoria)

    // Fondo de Solidaridad
    let fondoSolidaridad = TAX_CONSTANTS_2026.FONDO_SOLIDARIDAD

    if (anioEgreso) {
        const hoy = new Date()
        const aniosDesdeEgreso = hoy.getFullYear() - anioEgreso.getFullYear()

        // Menos de 5 años: Exento
        if (aniosDesdeEgreso < 5) {
            fondoSolidaridad = 0
        }
        // Entre 5 y 10 años: 50%
        else if (aniosDesdeEgreso < 10) {
            fondoSolidaridad = fondoSolidaridad * 0.5
        }
        // > 10 años: 100%
    }

    return {
        cajaProfesional: montoMensual,
        fondoSolidaridad: fondoSolidaridad,
        total: montoMensual + fondoSolidaridad
    }
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


// ============================================
// UTILIDADES DE CICLO BIMESTRAL
// ============================================

export interface BimestreInfo {
    numero: number           // 0-5 (0=Ene-Feb, 1=Mar-Abr, ...)
    nombre: string          // "Ene-Feb", "Mar-Abr", etc
    mesInicio: number       // 0-11 (mes inicial del bimestre)
    mesFin: number          // 0-11 (mes final del bimestre)
    anio: number            // Año del bimestre
}

/**
 * Determina el bimestre actual basado en una fecha
 * En Uruguay, IVA e IRPF se pagan bimestralmente
 */
export function getBimestreActual(fecha: Date = new Date()): BimestreInfo {
    const mes = fecha.getMonth() // 0-11
    const anio = fecha.getFullYear()
    const bimestre = Math.floor(mes / 2) // 0-5

    const nombres = ['Ene-Feb', 'Mar-Abr', 'May-Jun', 'Jul-Ago', 'Sep-Oct', 'Nov-Dic']

    return {
        numero: bimestre,
        nombre: nombres[bimestre],
        mesInicio: bimestre * 2,
        mesFin: bimestre * 2 + 1,
        anio
    }
}

/**
 * Calcula la fecha del próximo vencimiento de IVA/IRPF
 * Vence el día 25 de los meses impares (Enero, Marzo, Mayo, Julio, Septiembre, Noviembre)
 */
export function getProximoVencimiento(fecha: Date = new Date()): Date {
    const mesActual = fecha.getMonth() // 0-11
    const anioActual = fecha.getFullYear()
    const diaActual = fecha.getDate()

    // Meses impares: 0 (Enero), 2 (Marzo), 4 (Mayo), 6 (Julio), 8 (Sep), 10 (Nov)
    const mesesVencimiento = [0, 2, 4, 6, 8, 10]

    // Encontrar el próximo mes de vencimiento
    let proximoMes = mesesVencimiento.find(m => {
        if (m > mesActual) return true
        if (m === mesActual && diaActual < 25) return true
        return false
    })

    // Si no hay próximo vencimiento en este año, el próximo es enero del año siguiente
    if (proximoMes === undefined) {
        return new Date(anioActual + 1, 0, 25) // 25 de enero del año siguiente
    }

    return new Date(anioActual, proximoMes, 25)
}

/**
 * Verifica si una factura pertenece a un bimestre específico
 */
export function facturaEnBimestre(fechaFactura: Date, bimestre: BimestreInfo): boolean {
    const mesFactura = fechaFactura.getMonth()
    const anioFactura = fechaFactura.getFullYear()

    return anioFactura === bimestre.anio &&
        mesFactura >= bimestre.mesInicio &&
        mesFactura <= bimestre.mesFin
}

/**
 * Calcula días restantes hasta el próximo vencimiento
 */
export function diasHastaVencimiento(fecha: Date = new Date()): number {
    const proximoVencimiento = getProximoVencimiento(fecha)
    const hoy = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) // Reset time to midnight
    const vencimiento = new Date(proximoVencimiento.getFullYear(), proximoVencimiento.getMonth(), proximoVencimiento.getDate())

    const diff = vencimiento.getTime() - hoy.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ============================================
// DATOS DEL USUARIO (Hardcoded para MVP)
// ============================================
export const TAX_USER_DATA = {
    RUT: "220674720013",
    CI: "3.921.045-8",
    digitoRUT: 3
}

// ============================================
// VENCIMIENTOS AUTOMÁTICOS PARA CALENDARIO
// ============================================

export interface TaxDeadline {
    fecha: Date
    tipo: 'iva-irpf' | 'bps-cjppu'
    descripcion: string
}

/**
 * Fechas exactas de vencimiento DGI 2026 para Servicios Personales (Bimestral)
 * Fuente: Calendario DGI 2026 (Resolución 2284/025)
 * Estos vencimientos no dependen del dígito para Servicios Personales (Regla General)
 */
export function getVencimientosIvaIrpf(anio: number = new Date().getFullYear()): TaxDeadline[] {
    // Si no es 2026, devolvemos estimación general (25 de meses impares)
    if (anio !== 2026) {
        const mesesImpares = [0, 2, 4, 6, 8, 10]
        return mesesImpares.map(mes => ({
            fecha: new Date(anio, mes, 25),
            tipo: 'iva-irpf' as const,
            descripcion: 'Pago Bimensual IVA Fijo / IRPF (Estimado)'
        }))
    }

    // Fechas Exactas 2026
    const fechas = [
        new Date(2026, 0, 26),  // Ene 26 (Nov-Dic 25)
        new Date(2026, 2, 25),  // Mar 25 (Ene-Feb 26)
        new Date(2026, 4, 25),  // May 25 (Mar-Abr 26)
        new Date(2026, 6, 27),  // Jul 27 (May-Jun 26) - Lunes (25 fue sábado)
        new Date(2026, 8, 25),  // Sep 25 (Jul-Ago 26)
        new Date(2026, 10, 25), // Nov 25 (Sep-Oct 26)
    ]

    return fechas.map(fecha => ({
        fecha,
        tipo: 'iva-irpf' as const,
        descripcion: 'Pago Bimensual IVA Fijo / IRPF'
    }))
}

/**
 * Vencimientos CJPPU (Caja Profesionales)
 * Vence el último día hábil del mes siguiente al cargo.
 */
export function getVencimientosCJPPU(anio: number = new Date().getFullYear()): TaxDeadline[] {
    // Generar vencimientos para los 12 meses
    // Enero se paga a fin de Febrero, etc.
    const deadlines: TaxDeadline[] = []

    for (let mes = 0; mes < 12; mes++) {
        // Fin de mes del mes actual (que corresponde al pago del mes anterior)
        // Ejemplo: Estamos en Febrero 2026. Vence el pago de Enero.
        // La fecha de vencimiento es el último día de Febrero.
        // new Date(anio, mes + 1, 0) da el último día del mes 'mes'

        const fechaVencimiento = new Date(anio, mes + 1, 0) // Último día del mes

        deadlines.push({
            fecha: fechaVencimiento,
            tipo: 'bps-cjppu' as const,
            descripcion: 'Vencimiento CJPPU (Fondo + Caja)'
        })
    }

    return deadlines
}

/**
 * Vencimientos BPS (Fonasa Servicios Personales)
 * Vencimiento aproximado: 25 de cada mes (para el mes anterior)
 */
export function getVencimientosBPS(anio: number = new Date().getFullYear()): TaxDeadline[] {
    const meses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

    return meses.map(mes => ({
        fecha: new Date(anio, mes, 25), // Mantener 25 como referencia segura
        tipo: 'bps-cjppu' as const,
        descripcion: 'Vencimiento Fonasa'
    }))
}

/**
 * Obtiene todos los vencimientos fiscales para un año
 */
export function getAllTaxDeadlines(anio: number = new Date().getFullYear()): TaxDeadline[] {
    return [
        ...getVencimientosIvaIrpf(anio),
        ...getVencimientosCJPPU(anio),
        ...getVencimientosBPS(anio)
    ]
}
