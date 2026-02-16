"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
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
import { useInvoiceStore } from "@/store/invoices"
import { DocumentScanner } from "@/components/ocr/document-scanner"

import { TipoIva } from "@/types"

const formSchema = z.object({
    cliente: z.string().min(2, {
        message: "El nombre del cliente debe tener al menos 2 caracteres.",
    }),
    concepto: z.string().min(2, {
        message: "El concepto debe tener al menos 2 caracteres.",
    }),
    montoNeto: z.coerce.number().min(0.01, {
        message: "El monto debe ser mayor a 0.",
    }),
    fecha: z.date({
        message: "La fecha es requerida.",
    }).refine((date) => date !== null, {
        message: "La fecha es requerida.",
    }),
    tipoIva: z.coerce.number().refine((val) => [22, 10, 0].includes(val), {
        message: "Tipo de IVA inválido",
    }),
    retencionIrpf: z.boolean().default(false),
})

export function InvoiceForm() {
    const addInvoice = useInvoiceStore((state) => state.addInvoice)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            cliente: "",
            concepto: "",
            montoNeto: 0,
            tipoIva: 22,
            retencionIrpf: false,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        const ivaCalculado = values.montoNeto * (values.tipoIva / 100)
        // IRPF Retention is fixed at 7% if applicable for standard invoices
        const montoRetencion = values.retencionIrpf ? values.montoNeto * 0.07 : 0

        // Total Facturado (Net + IVA)
        // Note: The store expects 'totalPagar' to be the invoiced amount.
        // The cash received would be 'total - montoRetencion'.
        const total = values.montoNeto + ivaCalculado

        addInvoice({
            ...values,
            tipoIva: values.tipoIva as TipoIva,
            retencionIrpf: values.retencionIrpf,
            ivaCalculado,
            montoRetencion,
            totalPagar: total,
            estado: 'pendiente',
        })

        toast.success("Factura agregada correctamente")
        form.reset({
            cliente: "",
            concepto: "",
            montoNeto: 0,
            tipoIva: 22,
            retencionIrpf: false,
            fecha: new Date(),
        })
    }

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Autocompletar con Factura (OCR)</label>
                <DocumentScanner onScanComplete={(data) => {
                    // Asumimos que lo escaneado es el total, despejamos IVA basico por defecto si no se detecta otra cosa
                    // O mejor: seteamos el total como neto y que el usuario ajuste.
                    if (data.montoTotal) form.setValue('montoNeto', data.montoTotal)
                    if (data.fecha) form.setValue('fecha', data.fecha)
                    // En ingreso, el 'proveedor' detectado seria el emisor (nosotros), asi que no sirve de mucho 
                    // a menos que sea una factura de compra.
                    // Pero si detectamos texto, lo podemos poner en concepto.
                    form.setValue('concepto', `Factura ${data.rut || ''}`)
                }} />
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
                    <h2 className="text-xl font-semibold mb-4">Nueva Factura</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <FormField
                            control={form.control}
                            name="cliente"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre del cliente" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="concepto"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Concepto</FormLabel>
                                <FormControl>
                                    <Input placeholder="Servicios de..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="montoNeto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto Neto</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tipoIva"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IVA (%)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar IVA" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="22">22% (Básico)</SelectItem>
                                            <SelectItem value="10">10% (Mínimo)</SelectItem>
                                            <SelectItem value="0">Exento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="retencionIrpf"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border p-4 shadow-sm bg-muted/20">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="h-5 w-5"
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none flex-1">
                                    <FormLabel className="text-base font-medium">
                                        Aplicar Retención IRPF (7%)
                                    </FormLabel>
                                    <FormDescription className="text-sm text-muted-foreground">
                                        Marcar si el cliente es agente de retención (ej. grandes empresas).
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full">Guardar Factura</Button>
                </form>
            </Form>
        </div >
    )
}
