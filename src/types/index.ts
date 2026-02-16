export type TipoIva = 22 | 10 | 0;

export interface Factura {
    id: string;
    fecha: Date;
    cliente: string;
    concepto: string;
    montoNeto: number;
    tipoIva: TipoIva;
    retencionIrpf: boolean; // Si aplica retención (7%)
    ivaCalculado: number;
    montoRetencion: number; // Monto retenido (Neto * 0.07)
    totalPagar: number; // Total Facturado (Neto + IVA). Lo recibido es Total - Retención.
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
