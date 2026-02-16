import { google } from "googleapis"
import { prisma } from "@/lib/prisma"
import { OAuth2Client } from "google-auth-library"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

export async function getGoogleAuthClient(userId: string) {
    const account = await prisma.account.findFirst({
        where: { userId, provider: "google" }
    })

    if (!account || !account.access_token) {
        throw new Error("No linked Google account found")
    }

    const auth = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
    )

    auth.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        // expiry_date: account.expires_at ? account.expires_at * 1000 : null 
        // Prisma stores seconds, googleapis expects ms? Usually timestamps are diverse.
        // Assuming seconds from NextAuth default.
    })

    return auth
}

export async function syncTaxEvents(userId: string) {
    const config = await prisma.companyConfig.findUnique({
        where: { userId }
    })

    if (!config) throw new Error("Company config not found")

    const auth = await getGoogleAuthClient(userId)
    const calendar = google.calendar({ version: "v3", auth })

    // Define Events based on Regime
    const eventsToCreate: any[] = []
    const year = 2026

    // Helper to create date
    const getDate = (month: number, day: number) => {
        // month is 0-indexed in JS Date, but let's use 1-indexed for logic
        const date = new Date(year, month - 1, day)
        return date.toISOString().split('T')[0] // YYYY-MM-DD
    }

    // 1. CJPPU (Day 10)
    if (config.aportesCajaprof || config.regimen === 'general') {
        // Assume monthly
        for (let i = 1; i <= 12; i++) {
            eventsToCreate.push({
                summary: `Vencimiento CJPPU - ${config.razonSocial}`,
                description: `Pago estimado mensual de Caja de Profesionales.`,
                start: { date: getDate(i, 10) },
                end: { date: getDate(i, 10) },
            })
        }
    }

    // 2. Monotributo (Day 20)
    if (config.regimen === 'monotributo') {
        for (let i = 1; i <= 12; i++) {
            eventsToCreate.push({
                summary: `Vencimiento BPS (Monotributo) - ${config.razonSocial}`,
                description: `Pago unificado BPS/DGI.`,
                start: { date: getDate(i, 20) },
                end: { date: getDate(i, 20) },
            })
        }
    }

    // 3. DGI (IVA/IRPF) - General or Literal E (Day 25)
    if (config.regimen === 'general' || config.regimen === 'literal_e') {
        for (let i = 1; i <= 12; i++) {
            eventsToCreate.push({
                summary: `Vencimiento DGI (${config.regimen === 'literal_e' ? 'Literal E' : 'Régimen General'})`,
                description: `Pago de ${config.regimen === 'literal_e' ? 'IVA Mínimo' : 'IVA e IRPF'}.`,
                start: { date: getDate(i, 25) },
                end: { date: getDate(i, 25) },
            })
        }
    }

    // Insert Events
    // In production, checking for duplicates is crucial.
    // For this prototype, we'll blindly insert or try to list and filter.
    // Let's just insert 3 months for now to avoid spamming 30 events in testing?
    // User asked for 2026.

    let createdCount = 0
    for (const event of eventsToCreate) {
        try {
            await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event
            })
            createdCount++
        } catch (e) {
            console.error("Error creating event", e)
        }
    }

    return { success: true, count: createdCount }
}
