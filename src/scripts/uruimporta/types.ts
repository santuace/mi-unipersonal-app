
export interface Product {
    sku: string;
    nombre_producto: string;
    precio: number;
    categoria: string;
    subcategoria?: string; // Optional for finer grain control
    estado: 'ACTIVO' | 'INACTIVO' | 'AGOTADO';
    stock: number;
    promo: boolean;
    novedad: boolean;
    url_producto: string;
    url_imagen: string;
    marca?: string;
    // Additional attributes for scoring logic
    tags?: string[]; // e.g., 'verano', 'lluvia', 'escolar', 'frio'
}

export interface Context {
    fecha: Date;
    clima: {
        descripcion: string; // 'soleado', 'lluvioso', 'frio', 'caluroso'
        temp_max: number;
        temp_min: number;
    };
    tendencias: string[]; // e.g., 'termos', 'ventiladores', 'mochilas'
    eventos_cercanos: string[]; // e.g., 'vuelta_a_clases', 'cyber_lunes'
    estacion: 'Verano' | 'Otoño' | 'Invierno' | 'Primavera';
}

export interface HistoryItem {
    sku: string;
    fecha_publicacion: Date;
    categoria?: string;
    tipo_de_pieza?: string;
    score_historico?: number;
}

export interface ScoredProduct extends Product {
    score: number;
    reasons: string[]; // Why it got this score (positive and negative)
    role?: 'Anchor' | 'Solver' | 'Contextual' | 'Commercial' | 'Complementary';
    suggested_angle?: string;
    suggested_piece?: string;
}

export interface EngineOutput {
    selected_products: ScoredProduct[];
    email_content: string;
    technical_summary: {
        top_trends: string[];
        considered_weather: string;
        penalized_products_count: number;
        boosted_categories: string[];
    };
}
