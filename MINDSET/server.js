import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import officeParser from 'officeparser';
// pdf-parse will be loaded dynamically to support Vercel ESM bundler

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Path resolution
const staticPath = path.resolve('public');

// Initialize Gemini
// Using the same API key provided in DASHBOARDCAMARA for this MVP
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyC6eGFIfbhRENV5QpLLjC1gDQCyhkNJLi0";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const model = 'gemini-2.5-flash';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Set up static files only for local dev (Vercel natively serves /public)
if (!process.env.VERCEL) {
    app.use(express.static(staticPath));
}

// Set up file upload using memory storage
const upload = multer({ storage: multer.memoryStorage() });

// --- API Endpoints ---

// 1. Prompt Architect Gem Endpoint
app.post('/api/optimize-prompt', async (req, res) => {
    const { idea } = req.body;

    if (!idea) {
        return res.status(400).json({ error: 'La idea inicial es requerida.' });
    }

    const systemInstruction = `
        Eres un **Prompt Architect Gem** altamente especializado en la generación de imágenes. 
        Tu objetivo es transformar la idea inicial del usuario en un prompt detallado, técnico y optimizado para modelos de Imagen (como Midjourney o Stable Diffusion).

        Debes devolver la respuesta estrictamente con la siguiente estructura, utilizando negritas y saltos de línea para facilitar la lectura. No agregues nada fuera de la estructura.

        **1. Concepto Básico:** [Descripción concisa del sujeto/escena, qué se ve].
        **2. Estilo/Render:** [Detalles de la técnica, artista o tipo de render (ej: 3D render, Óleo de Van Gogh, Hyperrealistic photo, Cinematography)].
        **3. Composición/Iluminación:** [Aspectos técnicos (ej: 16:9, Luz volumétrica, Bokeh, Ultra-detallado, Enfoque nítido)].
        **4. Prompt Optimizado (Gem):** [EL PROMPT FINAL COMPLETO en INGLÉS, listo para copiar y pegar, usando comas para separar los elementos técnicos].
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: idea,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        res.json({ optimizedPrompt: response.text });
    } catch (error) {
        console.error('Error al optimizar el prompt con Gemini:', error);
        res.status(500).json({ error: 'Fallo en la comunicación con la API de Gemini.' });
    }
});

// 2. Client Vault Document Upload and Analysis
app.post('/api/upload-client-doc', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo.' });
    }

    try {
        let extractedText = '';
        const mimeType = req.file.mimetype;
        const originalName = req.file.originalname.toLowerCase();

        console.log(`Processing file: ${originalName} (${mimeType})`);

        if (mimeType === 'application/pdf') {
            const { default: pdfParse } = await import('pdf-parse');
            const pdfData = await pdfParse(req.file.buffer);
            extractedText = pdfData.text;
        } else if (originalName.endsWith('.csv') || originalName.endsWith('.txt')) {
            extractedText = req.file.buffer.toString('utf8');
        } else {
            try {
                // Use officeparser for doc, docx, ppt, pptx, xls, xlsx, etc.
                const ast = await officeParser.parseOffice(req.file.buffer);
                extractedText = ast.toText();
            } catch (officeErr) {
                console.warn(`officeparser falló con ${originalName}, intentando leer como texto plano...`, officeErr);
                // Fallback for types like .key which might not be supported but might contain some readable text chars
                extractedText = req.file.buffer.toString('utf8').replace(/[^\x20-\x7E\n]/g, '');
            }
        }

        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({ error: 'No se pudo extraer texto del documento subido.' });
        }

        const systemInstruction = `
            Eres un analizador estratégico avanzado para MINDSET AI. Tu objetivo es leer el texto extraído de un documento de cliente y sintetizarlo en un formato útil para ser guardado como perfil de marca ("Pilares Estratégicos" y "Tono de la Marca").
            Mantén un resumen conciso pero exhaustivo, enfocado en:
            - A qué se dedica la marca y cuál es su propuesta de valor.
            - Su público objetivo y demografía si se menciona.
            - Sus productos, servicios o RTBs (Reasons to Believe) principales.
            - Cualquier lineamiento de voz, tono visual o restricciones mencionadas.

            Devuelve tu respuesta escrita para que se integre elegantemente en un campo de texto plano de la base de datos del cliente.
            No saludes. Sé estructurado usando viñetas.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: `TEXTO EXTRAÍDO DEL DOCUMENTO:\n"${extractedText.substring(0, 30000)}"`, // Limitar a ~30k caracteres para seguridad
            config: {
                systemInstruction: systemInstruction,
            },
        });

        res.json({ synthesis: response.text });

    } catch (error) {
        console.error('Error procesando el documento del cliente:', error);
        res.status(500).json({ error: 'Ocurrió un error al procesar o analizar el documento.' });
    }
});

// Helper for Base64 images
function imagePart(base64Data, mimeType) {
    return {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
}

// 2. Multimodal / General Generation Endpoint (Brief, PNT, Analizador)
app.post('/api/generate', async (req, res) => {
    const { prompt, imageBase64, imageMimeType } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'El prompt es requerido.' });
    }

    let contents = [];

    // Add image portion if it exists (for the Analyzer Module)
    if (imageBase64 && imageMimeType) {
        try {
            contents.push(imagePart(imageBase64, imageMimeType));
        } catch (e) {
            console.error('Error al parsear imagen:', e);
            return res.status(500).json({ error: 'Error al procesar la imagen enviada.' });
        }
    }

    contents.push(prompt);

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
        });

        res.json({ text: response.text });
    } catch (error) {
        console.error('Error en generación general:', error);
        res.status(500).json({ error: error.message });
    }
});

// ---- INTELLIGENCE FEED ----

// News Feed: AI-curated articles returned as structured JSON cards
app.get('/api/news', async (req, res) => {
    const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `Hoy es ${today}. Actúa como un editor senior de una revista especializada en Inteligencia Artificial, Marketing y Creatividad para agencias de publicidad latinoamericanas.

    Genera EXACTAMENTE 6 artículos de noticias recientes (de las últimas 3-4 semanas) sobre IA aplicada a la publicidad, el marketing, la creatividad o las grandes tecnológicas. Deben ser noticias reales, actuales o eventos que hayan ocurrido recientemente que sean de alto impacto.

    Devuelve EXCLUSIVAMENTE un JSON válido con este formato, sin texto extra ni markdown:
    {
        "generated_at": "Fecha de hoy en formato legible",
        "articles": [
            {
                "id": 1,
                "headline": "Titular periodístico impactante y específico de la noticia real",
                "category": "UNA de estas opciones: IA Generativa | Marketing | Creatividad | Big Tech | Modelos de IA | Regulación",
                "read_time": 3,
                "source_name": "Nombre del medio o empresa fuente (ej: TechCrunch, Reuters, OpenAI Blog, The Verge)",
                "source_url": "URL directa al artículo original si la conocés con certeza, o null si no estás seguro",
                "summary": "Párrafo de 2-3 oraciones describiendo la noticia con precisión y contexto específico. Menciona compañías, cifras o nombres reales cuando los haya.",
                "marketing_impact": "1-2 oraciones sobre el impacto directo en decisiones de marketing o publicidad.",
                "key_takeaway": "Una frase corta y accionable para un profesional de agencia (máx 15 palabras).",
                "sentiment": "positive | neutral | disruptive"
            }
        ]
    }

    IMPORTANTE: Los titulares deben ser específicos y referirse a noticias o eventos concretos, no genéricos. Ordénalos del más impactante al menos impactante.`;

    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        let raw = response.text.trim();
        raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
        const data = JSON.parse(raw);
        res.json(data);
    } catch (error) {
        console.error('Error en Intelligence Feed:', error);
        res.status(500).json({ error: 'No se pudo generar el feed de noticias.' });
    }
});

// ---- STRATEGIC INSIGHTS LAB ENDPOINTS ----

// 3. Focus Group Virtual
app.post('/api/focus-group', async (req, res) => {
    const { avatars, idea, clientContext } = req.body;
    if (!avatars || !idea) {
        return res.status(400).json({ error: 'Avatars e idea son requeridos.' });
    }

    const avatarListStr = avatars.map(a => `- ${a.name} (${a.profile}): Tono personal según su perfil.`).join('\n        ');

    const clientBlock = clientContext
        ? `\n        CONTEXTO DE MARCA (para evaluar fit):\n        - Cliente: ${clientContext.name}\n        - Tono de marca: ${clientContext.guidelines || 'No especificado'}\n        - Pilares: ${clientContext.pillars || 'No especificados'}\n        Los panelistas deben evaluar qué tan bien encaja la idea con este posicionamiento de marca.`
        : '';

    const prompt = `
        Eres el coordinador de un Focus Group de investigación de mercado.
        Simula un debate entre ${avatars.length} panelistas con personalidades distintas sobre la siguiente idea de campaña:

        IDEA: "${idea}"
        ${clientBlock}

        PANELISTAS:
        ${avatarListStr}

        INSTRUCCIONES CRUCIALES:
        - Genera al menos 2 intervenciones por panelista (${avatars.length * 2} intervenciones mínimo, ordenadas cronológicamente).
        - Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura, sin texto extra, sin markdown, sin explicaciones:
        {
            "debate": [
                { "speaker": "nombre_del_avatar", "message": "texto de la intervención" }
            ],
            "sentiment_report": {
                "overall_verdict": "texto del veredicto general",
                "score": número_del_0_al_10,
                "positives": ["punto positivo 1", "punto positivo 2"],
                "negatives": ["punto negativo 1", "punto negativo 2"],
                "recommendation": "recomendación final de acción"
            }
        }
    `;

    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        let raw = response.text.trim();
        // Strip markdown code fences if present
        raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
        const data = JSON.parse(raw);
        res.json(data);
    } catch (error) {
        console.error('Error en Focus Group:', error);
        res.status(500).json({ error: 'Error al generar el Focus Group. Intenta de nuevo.' });
    }
});

// 4. Archetype Wheel
app.post('/api/archetypes', async (req, res) => {
    const { clientName, guidelines, pillars } = req.body;
    if (!clientName) {
        return res.status(400).json({ error: 'Nombre del cliente requerido.' });
    }

    const prompt = `
        Eres un estratega de branding experto en los 12 arquetipos de Jung aplicados a marcas.
        Analiza la siguiente información de marca y asigna un score del 0 al 100 para cada uno de los 12 arquetipos.
        Solo puede haber UN arquetipo dominante (score > 70). Los demás deben distribuirse de forma realista.
        
        CLIENTE: ${clientName}
        GUIDELINES: ${guidelines || 'No especificadas'}
        PILARES: ${pillars || 'No especificados'}
        
        Devuelve EXCLUSIVAMENTE un JSON válido sin texto extra, sin markdown:
        {
            "dominant": "Nombre del Arquetipo Dominante",
            "summary": "Párrafo de 2 frases explicando la personalidad de marca",
            "scores": {
                "El Inocente": 0,
                "El Sabio": 0,
                "El Explorador": 0,
                "El Héroe": 0,
                "El Forajido": 0,
                "El Mago": 0,
                "El Tipo Regular": 0,
                "El Amante": 0,
                "El Bufón": 0,
                "El Cuidador": 0,
                "El Creador": 0,
                "El Gobernante": 0
            }
        }
    `;

    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        let raw = response.text.trim();
        raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
        const data = JSON.parse(raw);
        res.json(data);
    } catch (error) {
        console.error('Error en Archetypes:', error);
        res.status(500).json({ error: 'Error al generar los arquetipos.' });
    }
});

// 5. Trend Forecaster
app.post('/api/trend-forecast', async (req, res) => {
    const { category, clientContext } = req.body;
    if (!category) {
        return res.status(400).json({ error: 'Categoría requerida.' });
    }

    const clientBlock = clientContext
        ? `\n        CLIENTE QUE USA EL ANÁLISIS: ${clientContext.name}. Sus pilares son: ${clientContext.pillars || 'no especificados'}. Orientá los consejos estratégicos específicamente para este cliente.`
        : '';

    const prompt = `
        Eres un futurólogo estratégico especializado en tecnología e inteligencia artificial aplicada al marketing.
        Para la categoría de negocio: "${category}", crea 3 escenarios narrativos distintos para los próximos 18 meses, considerando el impacto de la IA.
        ${clientBlock}

        Devuelve EXCLUSIVAMENTE un JSON válido sin texto extra, sin markdown:
        {
            "optimist": {
                "title": "Título provocador del escenario optimista",
                "narrative": "2-3 frases describiendo el mejor escenario posible.",
                "strategic_tip": "Consejo de acción concreto para aprovechar este escenario."
            },
            "chaotic": {
                "title": "Título del escenario caótico",
                "narrative": "2-3 frases describiendo el escenario de máxima disrupción y confusión.",
                "strategic_tip": "Consejo para sobrevivir y diferenciarse en el caos."
            },
            "disruptive": {
                "title": "Título del escenario disruptivo",
                "narrative": "2-3 frases describiendo una transformación radical del mercado.",
                "strategic_tip": "Consejo para liderar la disrupción antes de que sea demasiado tarde."
            }
        }
    `;

    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        let raw = response.text.trim();
        raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
        const data = JSON.parse(raw);
        res.json(data);
    } catch (error) {
        console.error('Error en Trend Forecast:', error);
        res.status(500).json({ error: 'Error al generar el pronóstico.' });
    }
});

// 6. Competitor Mind-Reader
app.post('/api/competitor-analysis', async (req, res) => {
    const { competitors, axis, clientContext } = req.body;
    if (!competitors) {
        return res.status(400).json({ error: 'Lista de competidores requerida.' });
    }

    const clientBlock = clientContext
        ? `\n        MARCA QUE REALIZA EL ANÁLISIS: ${clientContext.name} (${clientContext.guidelines || ''}). Sus pilares son: ${clientContext.pillars || 'no especificados'}. La conclusión de "Oportunidad de Oro" debe estar específicamente orientada a cómo ${clientContext.name} puede aprovechar las brechas detectadas.`
        : '';

    const prompt = `
        Eres un estratega competitivo con acceso al conocimiento público y de mercado.
        Analiza los siguientes competidores y genera una "Matriz de Brechas Estratégicas" que compare su Promesa de Marca (lo que dicen) vs. su Realidad Percibida (lo que los consumidores experimentan).
        ${clientBlock}

        COMPETIDORES: ${competitors}
        EJE DE ANÁLISIS: ${axis || 'Percepción general de marca'}

        Para cada competidor, identifica:
        1. Su promesa de marca central.
        2. La realidad percibida por el consumidor.
        3. El GAP o brecha de credibilidad.
        4. Una oportunidad de ataque para una marca retadora.

        Responde con una tabla en formato Markdown bien estructurada, con una introducción de 1 frase y una conclusión final de "Oportunidad de Oro" para la marca que usará este análisis.
    `;

    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        res.json({ text: response.text });
    } catch (error) {
        console.error('Error en Competitor Analysis:', error);
        res.status(500).json({ error: 'Error al analizar competidores.' });
    }
});

// Catch-all route for SPA navigation (optional if using pure hash routing, but good practice)
app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// Start the server (only locally)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 MINDSET AI Backend Server running on http://localhost:${PORT}`);
    });
}
export default app;
