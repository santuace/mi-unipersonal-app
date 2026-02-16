
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
