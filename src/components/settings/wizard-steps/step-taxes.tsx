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
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { CompanyConfig } from "@/types"
import { Info, AlertCircle, University } from "lucide-react"

export function StepTaxes() {
    const form = useFormContext<CompanyConfig>()

    // Watch fields for conditional logic
    const regimen = form.watch("regimen")
    const anioEgreso = form.watch("anioEgreso")
    const isMonotributo = regimen === 'monotributo'
    const isProfesional = regimen === 'general' // Servicios Personales

    // Logic for Fondo Solidaridad visibility
    const showFondoOption = !!anioEgreso && (new Date().getFullYear() - new Date(anioEgreso).getFullYear()) >= 5

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

            {/* FONASA */}
            {!isMonotributo && (
                <div className="space-y-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">FONASA (Seguro de Salud)</FormLabel>
                            <FormDescription>
                                Cobertura médica para vos y tu familia.
                            </FormDescription>
                        </div>
                        <FormField
                            control={form.control}
                            name="aportes.fonasa"
                            render={({ field }) => (
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            )}
                        />
                    </div>

                    {form.watch("aportes.fonasa") && (
                        <FormField
                            control={form.control}
                            name="situacionFamiliar"
                            render={({ field }) => (
                                <FormItem className="animate-in fade-in slide-in-from-top-2">
                                    <FormLabel>Tasa de Aporte (Según situación familiar)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="sin_carga">Sin hijos ni cónyuge (4.5%)</SelectItem>
                                            <SelectItem value="con_hijos">Con hijos (6%)</SelectItem>
                                            <SelectItem value="con_conyuge_hijos">Con cónyuge e hijos (6.5%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
            )}

            {/* CJPPU (Caja Profesional) */}
            {!isMonotributo && (
                <div className="space-y-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Caja de Profesionales (CJPPU)</FormLabel>
                            <FormDescription>
                                {isProfesional
                                    ? "Obligatorio para Servicios Personales Profesionales."
                                    : "Opcional si no ejerces como profesional independiente."}
                            </FormDescription>
                        </div>
                        <FormField
                            control={form.control}
                            name="aportes.cajaProfesional"
                            render={({ field }) => (
                                <FormControl>
                                    <Switch
                                        checked={isProfesional ? true : field.value}
                                        disabled={isProfesional} // Locked if Profesional
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            )}
                        />
                    </div>

                    {(form.watch("aportes.cajaProfesional") || isProfesional) && (
                        <>
                            <FormField
                                control={form.control}
                                name="categoriaCJPPU"
                                render={({ field }) => (
                                    <FormItem className="animate-in fade-in slide-in-from-top-2">
                                        <FormLabel>Categoría CJPPU (Escala Promedio)</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            defaultValue={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona categoría (1-10)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                                    <SelectItem key={num} value={num.toString()}>
                                                        Categoría {num} {num === 1 ? "(Base)" : ""} {num === 10 ? "(Máxima)" : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Afecta el monto mensual fijo. Base $7.566 (Cat 1).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Alert Context - Profesional < 1985 */}
                            {isProfesional && (
                                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 text-amber-800 dark:text-amber-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Importante</AlertTitle>
                                    <AlertDescription>
                                        Recordá que por ser profesional nacido antes de 1985 (si aplica), tu escala obligatoria podría ser la Categoría 10 ($21.000+).
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Fondo de Solidaridad */}
            {/* Only show if Egreso > 5 years (calculated loosely) and not Monotributo */}
            {!isMonotributo && showFondoOption && (
                <div className="space-y-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <FormField
                        control={form.control}
                        name="aportes.fondoSolidaridad"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Fondo de Solidaridad (Adicional)
                                    </FormLabel>
                                    <FormDescription>
                                        Corresponde si egresaste hace más de 5 años y tu carrera dura 5 años o más.
                                        (Monto duplicado si corresponde adicional).
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
            )}

            {/* Info Message if Monotributo */}
            {isMonotributo && (
                <Alert>
                    <University className="h-4 w-4" />
                    <AlertTitle>Régimen Simplificado</AlertTitle>
                    <AlertDescription>
                        Como Monotributista, tus aportes a BPS y DGI están unificados en la cuota fija. No pagas CJPPU ni Fondo (salvo excepciones muy específicas).
                    </AlertDescription>
                </Alert>
            )}

        </div>
    )
}
