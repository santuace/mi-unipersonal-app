import 'dotenv/config';
import { CATALOG, PUBLICATION_HISTORY } from "./data/mock-data";
import { Context, EngineOutput, HistoryItem, Product, ScoredProduct } from "./types";
import { buildEmailHtml } from "./templates/html-builder"; // [NEW]
import { sendEmail, MailConfig } from "./mailer"; // [NEW]
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const SCORE_RULES = {
    WEATHER_MATCH: 10,
    TREND_MATCH: 25,
    PROMO: 20,
    NEW_ARRIVAL: 15,
    HIGH_STOCK: 10,
    SEASON_MATCH: 10,
    PERFORMANCE_BOOST: 15,
};

const PENALTIES = {
    RECENT_1_7: -80,
    RECENT_8_20: -40,
    RECENT_21_45: -10,
    CATEGORY_FATIGUE: -20,
};

interface DayTheme {
    name: string;
    keywords: string[];
    description: string;
    type: 'EVENT' | 'WEATHER' | 'SEASON';
}

// --- Helper Functions ---

function getDynamicContext(): Context {
    const today = new Date();
    const month = today.getMonth(); // 0-11

    // Determine season (Southern Hemisphere approximation)
    let season: 'Verano' | 'Otoño' | 'Invierno' | 'Primavera' = 'Verano';
    if (month >= 2 && month <= 4) season = 'Otoño';
    else if (month >= 5 && month <= 7) season = 'Invierno';
    else if (month >= 8 && month <= 10) season = 'Primavera';

    // Simple randomization for variety without external APIs
    const weatherOptions = ['soleado', 'lluvioso', 'nublado'];
    const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

    // Rotate trends based on day of week to guarantee variety
    const baseTrends = ['mochilas', 'tuppers', 'pilotines', 'termos', 'ventiladores', 'juegos', 'mascotas', 'hogar'];
    const dayOfWeek = today.getDay();
    // Offset array by day of week to get a different slice of trends each day
    const activeTrends = [...baseTrends, ...baseTrends].slice(dayOfWeek, dayOfWeek + 4);

    // Keep Vuelta a Clases active in Feb/March
    const events = (month === 1 || month === 2) ? ['vuelta_a_clases'] : [];

    return {
        fecha: today,
        estacion: season,
        clima: {
            descripcion: weather,
            temp_max: 25, // Mock temps
            temp_min: 15
        },
        tendencias: activeTrends,
        eventos_cercanos: events
    };
}

function determineTheme(context: Context): DayTheme {
    if (context.eventos_cercanos.includes('vuelta_a_clases')) {
        const keywords = ['escolar', 'mochilas', 'arte', 'estudio', 'niños', 'merienda'];
        // [New] Contextual blending: If raining, add rain gear to school theme
        if (context.clima.descripcion === 'lluvioso') {
            keywords.push('lluvia', 'impermeable', 'paraguas', 'botas');
        }
        return {
            name: "Vuelta a Clases",
            keywords: keywords,
            description: "Equípate para el comienzo de clases con las mejores ofertas.",
            type: 'EVENT'
        };
    }
    if (context.clima.descripcion === 'lluvioso') {
        return {
            name: "Día de Lluvia",
            keywords: ['lluvia', 'impermeable', 'casa', 'juegos', 'tortas_fritas', 'películas', 'ropa_seca'],
            description: "Todo lo que necesitas para un día gris: protección y entretenimiento en casa.",
            type: 'WEATHER'
        };
    }
    return {
        name: `Esenciales de ${context.estacion}`,
        keywords: [context.estacion.toLowerCase(), 'aire_libre', 'paseo'],
        description: `Disfruta del ${context.estacion} con nuestra selección especial.`,
        type: 'SEASON'
    };
}

function calculateScore(product: Product, context: Context, history: HistoryItem[]): ScoredProduct {
    let score = 0;
    const reasons: string[] = [];

    const weatherKeywords = [context.clima.descripcion];
    if (context.clima.descripcion === 'lluvioso') weatherKeywords.push('lluvia', 'impermeable', 'paraguas');

    if (product.tags?.some(tag => weatherKeywords.includes(tag.toLowerCase()))) {
        score += SCORE_RULES.WEATHER_MATCH;
        reasons.push(`Clima (+${SCORE_RULES.WEATHER_MATCH})`);
    }

    if (product.tags?.some(tag => context.tendencias.includes(tag.toLowerCase()))) {
        score += SCORE_RULES.TREND_MATCH;
        reasons.push(`Tendencia (+${SCORE_RULES.TREND_MATCH})`);
    }

    if (product.promo) {
        score += SCORE_RULES.PROMO;
        reasons.push(`Promo (+${SCORE_RULES.PROMO})`);
    }
    if (product.novedad) {
        score += SCORE_RULES.NEW_ARRIVAL;
        reasons.push(`Novedad (+${SCORE_RULES.NEW_ARRIVAL})`);
    }
    if (product.stock > 50) {
        score += SCORE_RULES.HIGH_STOCK;
        reasons.push(`Stock (+${SCORE_RULES.HIGH_STOCK})`);
    }

    const lastPublished = history.find(h => h.sku === product.sku);
    if (lastPublished) {
        const daysAgo = Math.floor((context.fecha.getTime() - lastPublished.fecha_publicacion.getTime()) / (1000 * 3600 * 24));
        if (daysAgo <= 7) {
            score += PENALTIES.RECENT_1_7;
            reasons.push(`Reciente (${PENALTIES.RECENT_1_7})`);
        }
    }

    return { ...product, score, reasons };
}

function selectProducts(scoredProducts: ScoredProduct[], theme: DayTheme): ScoredProduct[] {
    const thematicCandidates = scoredProducts.filter(p =>
        p.estado === 'ACTIVO' &&
        p.stock > 0 &&
        p.tags?.some(tag => theme.keywords.includes(tag.toLowerCase()))
    );

    thematicCandidates.sort((a, b) => b.score - a.score);

    const selected: ScoredProduct[] = [];
    const usedSubcategories = new Map<string, number>(); // Track count per subcat

    // Pass 1: Try to pick diverse items first (max 1 per subcategory)
    for (const candidate of thematicCandidates) {
        if (selected.length >= 5) break;

        const subcat = candidate.subcategoria || 'General';
        const count = usedSubcategories.get(subcat) || 0;

        if (count === 0) {
            addItem(candidate);
        }
    }

    // Pass 2: Fill remaining slots with duplicates if needed (max 2 per subcategory now)
    if (selected.length < 5) {
        for (const candidate of thematicCandidates) {
            if (selected.length >= 5) break;
            if (selected.some(s => s.sku === candidate.sku)) continue; // Already selected

            const subcat = candidate.subcategoria || 'General';
            const count = usedSubcategories.get(subcat) || 0;

            if (count < 2) { // Relaxed limit
                addItem(candidate);
            }
        }
    }

    // Pass 3: Desperation mode (Fill with anything thematic)
    if (selected.length < 5) {
        for (const candidate of thematicCandidates) {
            if (selected.length >= 5) break;
            if (selected.some(s => s.sku === candidate.sku)) continue;
            addItem(candidate);
        }
    }

    function addItem(candidate: ScoredProduct) {
        const roleIndex = selected.length;
        const roles = ['Anchor', 'Solver', 'Contextual', 'Commercial', 'Complementary'];
        candidate.role = roles[roleIndex] as any;
        candidate.suggested_angle = `${theme.name}: ${candidate.role}`;

        selected.push(candidate);
        const subcat = candidate.subcategoria || 'General';
        usedSubcategories.set(subcat, (usedSubcategories.get(subcat) || 0) + 1);
    }

    return selected;
}

// --- Main Execution ---

// --- Creative Subject Helper ---
function generateCreativeSubject(themeName: string): string {
    const greetings = [
        "Buen día capos! 👋",
        "Arriba gente! 🚀",
        "Che, mirá lo que tenemos hoy 👀",
        "Buenas buenas! ✨",
        "Hoy se rompe todo 🔥",
        "Sale ese surtido? 📦",
        "Arrancamo' con todo 💪",
        "Atención equipo! 📢",
        "Lo que estabas esperando 😎"
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return `${randomGreeting} Hoy sale: ${themeName}`;
}

async function runEngine() {
    console.log(">>> Iniciando Motor Editorial v3 (Visual + Mailer)...");

    const dynamicContext = getDynamicContext();
    const theme = determineTheme(dynamicContext);
    console.log(`>>> TEMA DEL DÍA: ${theme.name} (${theme.type})`);
    console.log(`>>> CLIMA: ${dynamicContext.clima.descripcion} | TENDENCIAS: ${dynamicContext.tendencias.join(', ')}`);

    const scoredProducts = CATALOG.map(p => calculateScore(p, dynamicContext, PUBLICATION_HISTORY));
    const selected = selectProducts(scoredProducts, theme);

    if (selected.length < 5) {
        console.warn(`WARNING: Solo se encontraron ${selected.length} productos para el tema ${theme.name}.`);
    }

    // --- Output Generation ---

    // 1. Generate HTML
    const htmlEmail = buildEmailHtml(selected, theme, dynamicContext);

    // 2. Save Preview locally
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const previewPath = path.join(outputDir, 'preview.html');
    fs.writeFileSync(previewPath, htmlEmail);
    console.log(`\n✅ HTML Generado: ${previewPath}`);
    console.log(`   (Abre este archivo en tu navegador para ver el diseño)`);

    // 3. Automation Logic (Check for --send flag)
    const args = process.argv.slice(2);
    if (args.includes('--send')) {
        console.log("\n🚀 Iniciando envío de email...");

        let mailConfig: MailConfig;
        let isTestAccount = false;

        if (process.env.SMTP_HOST) {
            mailConfig = {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
                from: process.env.EMAIL_FROM || '"Uruimporta AI" <ai@uruimporta.com>',
                to: process.env.EMAIL_TO || 'editorial@uruimporta.com'
            };
        } else {
            console.log("⚠️  No se detectaron credenciales en .env.");
            console.log("🪄  Generando cuenta de prueba temporal (Ethereal Email)...");

            try {
                // Generate test SMTP service account from ethereal.email
                // Only needed if you don't have a real mail account for testing
                const testAccount = await nodemailer.createTestAccount();

                mailConfig = {
                    host: testAccount.smtp.host,
                    port: testAccount.smtp.port,
                    user: testAccount.user,
                    pass: testAccount.pass,
                    from: '"Uruimporta AI Test" <ai@test.com>',
                    to: 'designer@test.com'
                };
                isTestAccount = true;
                console.log(`✅ Cuenta de prueba creada: ${testAccount.user}`);
            } catch (err) {
                console.error("Error creando cuenta de prueba:", err);
                return;
            }
        }

        try {
            const transporter = nodemailer.createTransport({
                host: mailConfig.host,
                port: mailConfig.port,
                secure: mailConfig.port === 465,
                auth: {
                    user: mailConfig.user,
                    pass: mailConfig.pass,
                },
            });

            const creativeSubject = generateCreativeSubject(theme.name);
            console.log(`📝 Asunto generado: "${creativeSubject}"`);

            const info = await transporter.sendMail({
                from: mailConfig.from,
                to: mailConfig.to,
                subject: creativeSubject,
                html: htmlEmail,
            });

            console.log("📧 Proceso de envío finalizado con éxito.");
            console.log("📨 Message ID: %s", info.messageId);

            if (isTestAccount) {
                console.log("\n✨ VISUALIZAR EMAIL ENVIADO AQUÍ:");
                console.log(nodemailer.getTestMessageUrl(info));
                console.log("   (Click en el link para ver cómo llegó el correo al destinatario)");
            }

        } catch (error) {
            console.error("❌ Falló el envío del email:", error);
        }

    } else {
        console.log("\nℹ️  Modo Preview. Para enviar el email, ejecuta con la flag --send");
    }
}

runEngine();
