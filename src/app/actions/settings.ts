"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CompanyConfig } from "@/types"
import { revalidatePath } from "next/cache"

export async function saveCompanySettings(data: CompanyConfig) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "No autorizado" }
    }

    try {
        // Ensure user exists (since we are using hardcoded credentials with ID "1")
        const userExists = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: session.user.id,
                    name: session.user.name || "Admin",
                    email: session.user.email || "admin@example.com"
                }
            })
        }
        await prisma.companyConfig.upsert({
            where: {
                userId: session.user.id
            },
            update: {
                razonSocial: data.razonSocial,
                rut: data.rut,
                fechaInicio: new Date(data.fechaInicio),
                anioEgreso: data.anioEgreso ? parseInt(data.anioEgreso.toString()) : null,
                regimen: data.regimen,
                categoriaMonotributo: data.categoriaMonotributo,
                categoriaCJPPU: data.categoriaCJPPU,
                aportesFonasa: data.aportes.fonasa,
                aportesCajaprof: data.aportes.cajaProfesional,
                aportesFondo: data.aportes.fondoSolidaridad,
                situacionFamiliar: data.situacionFamiliar
            },
            create: {
                userId: session.user.id,
                razonSocial: data.razonSocial,
                rut: data.rut,
                fechaInicio: new Date(data.fechaInicio),
                anioEgreso: data.anioEgreso ? parseInt(data.anioEgreso.toString()) : null,
                regimen: data.regimen,
                categoriaMonotributo: data.categoriaMonotributo,
                categoriaCJPPU: data.categoriaCJPPU,
                aportesFonasa: data.aportes.fonasa,
                aportesCajaprof: data.aportes.cajaProfesional,
                aportesFondo: data.aportes.fondoSolidaridad,
                situacionFamiliar: data.situacionFamiliar
            }
        })

        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Error saving settings:", error)
        return { error: "Error al guardar la configuración" }
    }
}
