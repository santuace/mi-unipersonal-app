import { Context, ScoredProduct } from "../types";

interface DayTheme {
    name: string;
    keywords: string[];
    description: string;
    type: 'EVENT' | 'WEATHER' | 'SEASON';
}

export function buildEmailHtml(selectedProducts: ScoredProduct[], theme: DayTheme, context: Context): string {
    const dateStr = context.fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Basic CSS for compatibility
    const styles = `
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #1a1a1a; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
        .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.8; }
        .intro { padding: 30px 20px; text-align: center; background-color: #fce7f3; color: #831843; border-bottom: 4px solid #db2777; }
        .intro h2 { margin: 0 0 10px; font-size: 24px; font-weight: bold; }
        .product-card { padding: 20px; border-bottom: 1px solid #eeeeee; display: flex; align-items: flex-start; gap: 15px; }
        .product-image { width: 120px; height: 120px; background-color: #fff; object-fit: contain; border: 1px solid #eee; border-radius: 8px; flex-shrink: 0; }
        .product-details { flex: 1; }
        .role-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
        .role-Anchor { background-color: #ef4444; color: white; }
        .role-Solver { background-color: #3b82f6; color: white; }
        .role-Contextual { background-color: #10b981; color: white; }
        .role-Commercial { background-color: #f59e0b; color: white; }
        .role-Complementary { background-color: #6366f1; color: white; }
        .product-title { margin: 0 0 5px; font-size: 16px; font-weight: bold; }
        .product-price { font-size: 18px; font-weight: bold; color: #db2777; margin: 5px 0; }
        .product-reason { font-size: 12px; color: #666; font-style: italic; background: #f9fafb; padding: 5px; border-radius: 4px; display: inline-block; }
        .cta-button { display: inline-block; padding: 8px 16px; background-color: #1a1a1a; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold; margin-top: 10px; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #999; }
    `;

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Uruimporta Daily Selection</title>
        <style>${styles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Uruimporta</h1>
                <p>Selección Diaria Inteligente</p>
                <p style="font-size: 12px; margin-top: 10px;">${dateStr}</p>
            </div>

            <div class="intro">
                <h2>${theme.name}</h2>
                <p style="font-size: 13px; margin-top: 5px; opacity: 0.9;">Estrategia: ${context.clima.descripcion} | Tendencias: ${context.tendencias.slice(0, 3).join(', ')}</p>
            </div>
    `;

    selectedProducts.forEach((p, index) => {
        // Use real image URL from data
        const imgUrl = p.url_imagen;

        html += `
            <div class="product-card">
                <img src="${imgUrl}" alt="${p.nombre_producto}" class="product-image" />
                <div class="product-details">
                    <span class="role-badge role-${p.role}">${p.role}</span>
                    <h3 class="product-title">#${index + 1} ${p.nombre_producto}</h3>
                    <div class="product-price">$${p.precio}</div>
                    <div class="product-reason">💡 ${p.suggested_angle}</div>
                    <div style="margin-top: 5px; font-size: 12px; color: #555;">
                       Match: ${p.tags?.filter(t => theme.keywords.includes(t)).join(', ')}
                    </div>
                    <a href="${p.url_producto}" class="cta-button">VER PRODUCTO</a>
                </div>
            </div>
        `;
    });

    html += `
            <div class="footer">
                <p>Generado automáticamente por Motor Editorial AI v2.0</p>
                <p>Uruimporta Retail S.A. | Estación: ${context.estacion}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return html;
}
