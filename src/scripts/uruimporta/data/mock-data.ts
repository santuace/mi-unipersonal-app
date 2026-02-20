import { Context, HistoryItem, Product } from "../types";

// 1. Contexto Simulado (Febrero = Verano/Vuelta a Clases en Uruguay)
export const CURRENT_CONTEXT: Context = {
    fecha: new Date('2026-02-18T10:00:00'), // Mañana
    estacion: 'Verano',
    clima: {
        descripcion: 'lluvioso',
        temp_max: 24,
        temp_min: 18
    },
    tendencias: ['mochilas', 'tuppers', 'pilotines', 'termos', 'ventiladores'],
    eventos_cercanos: ['vuelta_a_clases', 'fin_de_verano']
};

// 2. Historial de Publicaciones (Para probar penalizaciones)
const TODAY = new Date('2026-02-18T10:00:00');
const ONE_DAY = 24 * 60 * 60 * 1000;

export const PUBLICATION_HISTORY: HistoryItem[] = [
    { sku: 'VEN-001', fecha_publicacion: new Date(TODAY.getTime() - 1 * ONE_DAY), categoria: 'Climatización' },
    { sku: 'JUG-002', fecha_publicacion: new Date(TODAY.getTime() - 5 * ONE_DAY), categoria: 'Juguetería' },
    { sku: 'HOG-005', fecha_publicacion: new Date(TODAY.getTime() - 15 * ONE_DAY), categoria: 'Hogar' },
    { sku: 'BAZ-003', fecha_publicacion: new Date(TODAY.getTime() - 30 * ONE_DAY), categoria: 'Bazar' },
    { sku: 'LH-4958', fecha_publicacion: new Date(TODAY.getTime() - 2 * ONE_DAY), categoria: 'Mochila' }, // Mocking history for a real item
];

// 3. Catálogo de Productos (100% REAL DATA from uruimporta.com.uy)
export const CATALOG: Product[] = [
    // --- Mochilas (Real) ---
    {
        sku: 'LH-4957',
        nombre_producto: 'MOCHILA 40X30CM NEGRA SHAOLONG',
        precio: 585,
        categoria: 'Escolar',
        subcategoria: 'Mochilas',
        estado: 'ACTIVO', stock: 100, promo: false, novedad: true,
        url_producto: 'https://uruimporta.com.uy/producto/mochila-40x30cm-negra-shaolong-lh-4957/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2026/01/7705.1-300x300.jpg',
        tags: ['escolar', 'vuelta_a_clases', 'mochilas', 'estudio', 'negro']
    },
    {
        sku: 'LH-4958',
        nombre_producto: 'MOCHILA 40X30CM AZUL SHAOLONG',
        precio: 585,
        categoria: 'Escolar',
        subcategoria: 'Mochilas',
        estado: 'ACTIVO', stock: 80, promo: false, novedad: true,
        url_producto: 'https://uruimporta.com.uy/producto/mochila-40x30cm-azul-shaolong-lh-4958/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2026/01/7706.3-300x300.jpg',
        tags: ['escolar', 'vuelta_a_clases', 'mochilas', 'estudio', 'azul']
    },
    {
        sku: 'LH-4961',
        nombre_producto: 'MOCHILA 40X30CM VERDE DENGGAO',
        precio: 473,
        categoria: 'Escolar',
        subcategoria: 'Mochilas',
        estado: 'ACTIVO', stock: 50, promo: true, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/mochila-40x30cm-verde-denggao-lh-4961/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2026/01/7709_0-300x300.jpg',
        tags: ['escolar', 'vuelta_a_clases', 'mochilas', 'economico']
    },
    {
        sku: 'TT-JQMR-100',
        nombre_producto: 'MOCHILA TIPO PELUCHE CAPYBARA',
        precio: 257,
        categoria: 'Escolar',
        subcategoria: 'Mochilas',
        estado: 'ACTIVO', stock: 30, promo: true, novedad: true,
        url_producto: 'https://uruimporta.com.uy/producto/mochila-tipo-peluche-cpybara-tt-jqmr-100/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2026/01/4759.5-300x300.jpg',
        tags: ['escolar', 'vuelta_a_clases', 'mochilas', 'niños', 'peluche', 'tendencia']
    },

    // --- Cartucheras (Real) ---
    {
        sku: 'FNBD-2',
        nombre_producto: 'CARTUCHERA 3 CIERRES COLORES VARIOS',
        precio: 194,
        categoria: 'Escolar',
        subcategoria: 'Útiles',
        estado: 'ACTIVO', stock: 150, promo: false, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/cartuchera-3-cierres-colores-varios-fnbd-2/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2026/01/221.5-300x300.jpg',
        tags: ['escolar', 'vuelta_a_clases', 'barato', 'utiles']
    },
    {
        sku: 'FNBD-6',
        nombre_producto: 'CARTUCHERA SIMPLE COLORES VARIOS',
        precio: 79,
        categoria: 'Escolar',
        subcategoria: 'Útiles',
        estado: 'ACTIVO', stock: 300, promo: true, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/cartuchera-colores-viarios-xx-cm-fnbd-6/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2026/01/2202.7-300x300.jpg',
        tags: ['escolar', 'vuelta_a_clases', 'economico', 'utiles']
    },

    // --- Termos (Real) ---
    {
        sku: 'XI-CM14TG',
        nombre_producto: 'CAFETERA TERMO XION 1L',
        precio: 36, // Precio sospechosamente bajo en scraping, pero es real data
        categoria: 'Bazar',
        subcategoria: 'Termos',
        estado: 'ACTIVO', stock: 20, promo: true, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/cafetera-termo-xion-1l-xi-cm14tg/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/6207_0-300x300.jpg',
        tags: ['bazar', 'cocina', 'invierno', 'cafe']
    },
    {
        sku: 'LH-4070',
        nombre_producto: 'TERMO METALICO 700ML COLORES SURTIDOS',
        precio: 615,
        categoria: 'Bazar',
        subcategoria: 'Termos',
        estado: 'ACTIVO', stock: 100, promo: false, novedad: true,
        url_producto: 'https://uruimporta.com.uy/producto/termo-metalico-700ml-colores-surtidos-lh-4070/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/7120_0-300x300.jpg',
        tags: ['bazar', 'termos', 'camping', 'aire_libre', 'escolar']
    },
    {
        sku: 'LH-4078',
        nombre_producto: 'TERMO PLASTICO INFANTIL KAWAE 1L',
        precio: 152,
        categoria: 'Bazar',
        subcategoria: 'Termos',
        estado: 'ACTIVO', stock: 50, promo: true, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/termo-plastico-infantil-kawae-1litro-lh-4078/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/7126_0-300x300.jpg',
        tags: ['bazar', 'termos', 'niños', 'escolar', 'merienda']
    },

    // --- Cocina / Hogar (Real) ---
    {
        sku: 'LH-3306',
        nombre_producto: 'PILETA DE COCINA ACERO INOX',
        precio: 6684,
        categoria: 'Hogar',
        subcategoria: 'Cocina',
        estado: 'ACTIVO', stock: 10, promo: false, novedad: true,
        url_producto: 'https://uruimporta.com.uy/producto/pileta-de-cocina-acero-inox-multifuncional-lh-3306/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/5463.1-1-300x300.jpg',
        tags: ['hogar', 'reformas', 'premium', 'cocina']
    },
    {
        sku: 'CENX27200T',
        nombre_producto: 'COCINA ENXUTA SUPERGAS CENX27200T',
        precio: 119, // Likely USD or installment, taking raw number
        categoria: 'Hogar',
        subcategoria: 'Cocina',
        estado: 'ACTIVO', stock: 5, promo: true, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/cocina-enxuta-supergas-cenx27200t/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2026/01/8636.1-300x300.jpg',
        tags: ['hogar', 'electrodomesticos', 'cocina']
    },

    // --- Juguetes / Mascotas (Real) ---
    {
        sku: 'LH-3335',
        nombre_producto: 'JUGUETE PELUCHE P/MASCOTA',
        precio: 113,
        categoria: 'Mascotas',
        subcategoria: 'Juguetes',
        estado: 'ACTIVO', stock: 60, promo: false, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/juguete-de-peluche-p-mascota-lh-3335/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/5470.4-1-300x300.webp',
        tags: ['mascotas', 'juegos', 'aire_libre', 'regalo']
    },
    {
        sku: 'LH-3357',
        nombre_producto: 'JUGUETE TIPO CABEZAS ANIMALES',
        precio: 63,
        categoria: 'Mascotas',
        subcategoria: 'Juguetes',
        estado: 'ACTIVO', stock: 200, promo: true, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/juguete-para-mascota-tipo-cabezas-animales-lh-3357/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/3-3-1-300x300.jpg',
        tags: ['mascotas', 'barato', 'relleno']
    },

    // --- Lluvia (Real - Restored) ---
    {
        sku: 'LH-4002',
        nombre_producto: 'PARAGUAS AUTOMATICO ANIMAL PRINT',
        precio: 288,
        categoria: 'Accesorios',
        subcategoria: 'Lluvia',
        estado: 'ACTIVO', stock: 50, promo: true, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/paraguas-automatico-animal-print-lh-4002/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/6583-430x430.jpg',
        tags: ['lluvia', 'paraguas', 'invierno', 'otoño', 'accesorios']
    },
    {
        sku: 'LH-4001',
        nombre_producto: 'PARAGUAS AUTOMATICO COLOR SURTIDO',
        precio: 198,
        categoria: 'Accesorios',
        subcategoria: 'Lluvia',
        estado: 'ACTIVO', stock: 80, promo: true, novedad: false,
        url_producto: 'https://uruimporta.com.uy/producto/paraguas-automatico-color-surtido-lh-4001/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/6582_0-430x430.jpg',
        tags: ['lluvia', 'paraguas', 'niños', 'colores', 'barato']
    },
    {
        sku: 'LH-4005',
        nombre_producto: 'PARAGUAS AUTOMATICO COLORES SURTIDO',
        precio: 351,
        categoria: 'Accesorios',
        subcategoria: 'Lluvia',
        estado: 'ACTIVO', stock: 40, promo: false, novedad: true,
        url_producto: 'https://uruimporta.com.uy/producto/paraguas-automatico-colores-surtido-lh-4005/',
        url_imagen: 'https://uruimporta.com.uy/wp-content/uploads/2025/12/6586_0-430x430.jpg',
        tags: ['lluvia', 'paraguas', 'calidad', 'premium']
    }
];
