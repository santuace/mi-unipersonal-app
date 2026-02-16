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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Info } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CompanyConfig } from "@/types"

export function StepIdentity() {
    const form = useFormContext<CompanyConfig>()

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Razón Social */}
                <FormField
                    control={form.control}
                    name="razonSocial"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre / Razón Social <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="Tu Nombre o Empresa S.A." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* RUT */}
                <FormField
                    control={form.control}
                    name="rut"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>RUT Uruguay <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="21..."
                                    {...field}
                                    onChange={(e) => {
                                        // Simple number filtering
                                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 12)
                                        field.onChange(value)
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                Debe tener 12 dígitos y comenzar con '21'.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Fecha Inicio */}
                <FormField
                    control={form.control}
                    name="fechaInicio"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Inicio de Actividades</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal w-full",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Seleccionar fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Año Egreso */}
                <FormField
                    control={form.control}
                    name="anioEgreso"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Año de Egreso Universitario</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal w-full",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>No aplica / Sin título</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Determina pago de Fondo de Solidaridad.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}
