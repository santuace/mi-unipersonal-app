import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StoreHydrator } from "@/components/dashboard/store-hydrator"
import { CompanyConfig } from "@/types"
import { DashboardUI } from "@/components/dashboard/dashboard-ui"
import { Notifications } from "@/components/notifications/notifications"

export default async function Home() {
  const session = await auth()

  if (!session?.user?.id) {
    // Should be handled by middleware, but safe fallback
    redirect("/login")
  }

  const userConfig = await prisma.companyConfig.findUnique({
    where: { userId: session.user.id }
  })

  // If no config found, redirect to onboarding wizard
  if (!userConfig) {
    redirect("/wizard")
  }

  // Transform Prisma result to match CompanyConfig type
  // Prisma `companyConfig` matches structure mostly but we need to ensure types align
  // e.g. anioEgreso stored as Int in DB, maybe Date in store?
  // Store expects `anioEgreso` as Date | undefined. schema has Int.
  // We need to adapt.
  const serializedConfig: CompanyConfig = {
    razonSocial: userConfig.razonSocial,
    rut: userConfig.rut,
    fechaInicio: userConfig.fechaInicio,
    anioEgreso: userConfig.anioEgreso ? new Date(userConfig.anioEgreso, 0, 1) : undefined, // Convert Year Int to Date
    regimen: userConfig.regimen as any,
    categoriaMonotributo: userConfig.categoriaMonotributo as any,
    categoriaCJPPU: userConfig.categoriaCJPPU || 10,
    situacionFamiliar: userConfig.situacionFamiliar as any,
    aportes: {
      fonasa: userConfig.aportesFonasa,
      cajaProfesional: userConfig.aportesCajaprof,
      fondoSolidaridad: userConfig.aportesFondo
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <StoreHydrator config={serializedConfig} />
      <Notifications />
      <DashboardContent />
    </main>
  )
}

function DashboardContent() {
  // Extract the original content into a client component or keep it here if it doesn't need "use client"
  // Wait, the original content used `useState` (openInvoice, openExpense).
  // So the original `Home` was a Client Component ("use client" at top).
  // I can't make a Client Component async.
  // I must separate the Server Logic (Home) from the Client Logic (DashboardUI).
  // I will rename the original Default Export to `DashboardUI` and make `Home` the server component.
  // BUT `src/app/page.tsx` must default export the server component.
  // So I need to move the current implementation to `src/components/dashboard/dashboard-ui.tsx` and import it here.
  return (
    <DashboardUI />
  )
}
