"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useExpenseStore } from "@/store/expenses"
import { DocumentScanner } from "@/components/ocr/document-scanner"

const expenseSchema = z.object({
    descripcion: z.string().min(2, "Descripción requerida"),
    proveedor: z.string().min(2, "Proveedor requerido"),
    montoTotal: z.coerce.number().min(1, "Monto debe ser mayor a 0"),
    tasaIva: z.coerce.number(),
    categoria: z.enum(['Oficina', 'Equipos', 'Servicios', 'Otros']),
    fecha: z.date(),
})

export function ExpenseForm() {
    const addGasto = useExpenseStore((state) => state.addGasto)

    const form = useForm<z.infer<typeof expenseSchema>>({
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: {
            descripcion: "",
            proveedor: "",
            montoTotal: 0,
            tasaIva: 0.22,
            categoria: 'Otros',
            fecha: new Date(),
        },
    })

    function onSubmit(values: z.infer<typeof expenseSchema>) {
        // @ts-ignore: tasaIva cast issue
        addGasto(values)
        toast.success("Gasto registrado", {
            description: `Se descontará IVA del cálculo final.`
        })
        form.reset({
            descripcion: "",
            proveedor: "",
            montoTotal: 0,
            tasaIva: 0.22,
            categoria: 'Otros',
            fecha: new Date(),
        })
    }

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Cargar Factura (OCR)</label>
                <DocumentScanner onScanComplete={(data) => {
                    if (data.montoTotal) form.setValue('montoTotal', data.montoTotal)
                    if (data.fecha) form.setValue('fecha', data.fecha)
                    if (data.posibleProveedor) form.setValue('proveedor', data.posibleProveedor)
                    if (data.rut) toast.info(`RUT Detectado: ${data.rut}`)

                    form.setValue('descripcion', `Gasto escaneado ${data.posibleProveedor || ''}`)
                }} />
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
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

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="proveedor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proveedor</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Antel, UTE, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="montoTotal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto Total (c/IVA)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="tasaIva"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tasa IVA</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="22%" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="0.22">22%</SelectItem>
                                            <SelectItem value="0.10">10%</SelectItem>
                                            <SelectItem value="0">Exento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="categoria"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Oficina">Oficina</SelectItem>
                                            <SelectItem value="Equipos">Equipos</SelectItem>
                                            <SelectItem value="Servicios">Servicios</SelectItem>
                                            <SelectItem value="Otros">Otros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                    <Input placeholder="Detalle del gasto" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full">Registrar Gasto</Button>
                </form>
            </Form>
        </div>
    )
}
