"use client"

import Image from "next/image"

import { InvoiceForm } from "@/components/invoices/invoice-form"
import { InvoiceList } from "@/components/invoices/invoice-list"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { ExpenseList } from "@/components/expenses/expense-list"
import { TaxSummary } from "@/components/dashboard/tax-summary"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { IncomeSimulator } from "@/components/tools/income-simulator"
import { Notifications } from "@/components/notifications/notifications"
import { CompanyWizard } from "@/components/settings/company-wizard"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"
import { Toaster } from "sonner"

export function DashboardUI() {
    const [openInvoice, setOpenInvoice] = useState(false)
    const [openExpense, setOpenExpense] = useState(false)

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-4">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex flex-col items-start gap-1">
                        <Image
                            src="/logo-ox.png"
                            alt="Logo Estudio"
                            width={150}
                            height={40}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                        <span>Mi Unipersonal</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">Gestión fiscal inteligente (Ley 20.410)</p>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />

                    <Dialog open={openExpense} onOpenChange={setOpenExpense}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 px-3">
                                <Minus className="h-3.5 w-3.5" />
                                Gasto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Registrar Gasto Deducible</DialogTitle>
                                <DialogDescription>
                                    Ingresa gastos operativos para descontar IVA.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-2">
                                <ExpenseForm />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8 gap-2 px-3">
                                <Plus className="h-3.5 w-3.5" />
                                Factura
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Ingresar Nueva Factura</DialogTitle>
                                <DialogDescription>
                                    Completa los datos. El sistema calculará IRPF y apartados automáticamente.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-2">
                                <InvoiceForm />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <Tabs defaultValue="dashboard" className="space-y-4">
                <TabsList className="h-9">
                    <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
                    <TabsTrigger value="tools" className="text-xs">Simulador</TabsTrigger>
                    <TabsTrigger value="calendar" className="text-xs">Calendario</TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs">Configuración</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <TaxSummary />
                    <div className="grid gap-4">
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Ingresos Recientes</h2>
                            <InvoiceList />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Gastos Deducibles (IVA Compras)</h2>
                            <ExpenseList />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tools" className="space-y-4">
                    <div className="max-w-2xl mx-auto">
                        <IncomeSimulator />
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                    <CalendarView />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <CompanyWizard />
                </TabsContent>
            </Tabs>

            <footer className="mt-12 py-6 text-center text-xs text-muted-foreground border-t">
                <p className="whitespace-pre-line leading-relaxed">
                    {`⚠️ IMPORTANTE: Estos cálculos son estimativos.
            Consulte con un contador matriculado antes de realizar declaraciones juradas oficiales.
            Última actualización: Febrero 2026`}
                </p>
            </footer>
        </div>
    )
}
