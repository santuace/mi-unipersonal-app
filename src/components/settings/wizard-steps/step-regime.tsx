"use client"

import { useFormContext } from "react-hook-form"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { CompanyConfig, MonotributoCategoria, RegimenTributario } from "@/types"
import { User, Briefcase, Building, Store, AlertTriangle, CheckCircle2, Info } from "lucide-react"

export function StepRegime() {
    const form = useFormContext<CompanyConfig>()
    const selectedRegimen = form.watch("regimen")

    const regimes: { value: RegimenTributario; label: string; description: string; icon: any }[] = [
        {
            value: "monotributo",
            label: "Monotributo",
            description: "Un pago único. Sin IVA ni IRPF. Ideal para pequeños emprendimientos.",
            icon: Store
        },
        {
            value: "literal_e",
            label: "Literal E (Pequeña Empresa)",
            description: "Paga IVA Mínimo fijo. Exento de IRPF/IRAE hasta cierto monto.",
            icon: CheckCircle2 // Or another icon
        },
        {
            value: "general",
            label: "Servicios Personales (Profesional)",
            description: "Régimen General. Paga IVA (22%) e IRPF Progresivo.",
            icon: User
        },
        {
            value: "sociedad",
            label: "Sociedad (SRL / SA / SAS)",
            description: "Paga IRAE (25%). Requiere contabilidad completa.",
            icon: Building
        }
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <FormField
                control={form.control}
                name="regimen"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Selecciona tu Régimen Tributario</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-1 gap-4"
                            >
                                {regimes.map((regime) => (
                                    <FormItem key={regime.value}>
                                        <FormControl>
                                            <RadioGroupItem value={regime.value} id={regime.value} className="peer sr-only" />
                                        </FormControl>
                                        <Label
                                            htmlFor={regime.value} // RadioGroupItem needs id to match label? Shadcn handles this slightly differently usually
                                            className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-950/20 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    <regime.icon className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        {regime.label}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {regime.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </Label>
                                    </FormItem>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Contextual Options & Alerts */}
            <div className="space-y-4">
                {selectedRegimen === 'monotributo' && (
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 border-l-4 border-l-green-500 animate-in fade-in zoom-in-95">
                        <FormField
                            control={form.control}
                            name="categoriaMonotributo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría de Monotributo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="m_social">MIDES Social (Aporte 0%)</SelectItem>
                                            <SelectItem value="m_unipersonal">Unipersonal (Común)</SelectItem>
                                            <SelectItem value="m_asociativa">Sociedad de Hecho (Max 2 socios)</SelectItem>
                                            <SelectItem value="m_profesional">Profesional (Sucesión indivisa)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Determina el monto mensual unificado (BPS + DGI).
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {selectedRegimen === 'literal_e' && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>IVA Mínimo</AlertTitle>
                        <AlertDescription>
                            Pagarás un fijo mensual de aprox $5.200 a DGI, independientemente de tu facturación (mientras no superes el tope anual).
                        </AlertDescription>
                    </Alert>
                )}

                {selectedRegimen === 'general' && (
                    <Alert variant="default" className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertTitle className="text-blue-800 dark:text-blue-300">Régimen General</AlertTitle>
                        <AlertDescription className="text-blue-700 dark:text-blue-400">
                            Recuerda: Si eres profesional universitario, el aporte a la Caja de Profesionales es obligatorio en este régimen.
                        </AlertDescription>
                    </Alert>
                )}

                {selectedRegimen === 'sociedad' && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Contabilidad Suficiente</AlertTitle>
                        <AlertDescription>
                            Las sociedades requieren llevar contabilidad completa y liquidar IRAE (25%) sobre la renta real. Asegúrate de tener un contador.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    )
}
