"use client"

import { useInvoiceStore } from "@/store/invoices"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"

export function InvoiceList() {
    const { invoices, removeInvoice } = useInvoiceStore()
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)

    if (invoices.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No hay facturas registradas.</p>
            </div>
        )
    }

    const handleDelete = (id: string) => {
        removeInvoice(id)
        setInvoiceToDelete(null)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-UY", {
            style: "currency",
            currency: "UYU",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="rounded-md border bg-card overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-xs whitespace-nowrap">Fecha</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Cliente</TableHead>
                        <TableHead className="text-xs whitespace-nowrap max-w-[150px]">Concepto</TableHead>
                        <TableHead className="text-right text-xs whitespace-nowrap">Monto Neto</TableHead>
                        <TableHead className="text-right text-xs whitespace-nowrap">IVA</TableHead>
                        <TableHead className="text-right text-xs whitespace-nowrap">Retención (7%)</TableHead>
                        <TableHead className="text-right text-xs whitespace-nowrap">Total Facturado</TableHead>
                        <TableHead className="w-[50px] text-center text-xs">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                            <TableCell className="text-xs whitespace-nowrap">{format(new Date(invoice.fecha), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell className="font-medium text-xs whitespace-nowrap">{invoice.cliente}</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate" title={invoice.concepto}>{invoice.concepto}</TableCell>
                            <TableCell className="text-right text-xs whitespace-nowrap">{formatCurrency(invoice.montoNeto)}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(invoice.ivaCalculado)}</TableCell>
                            <TableCell className="text-right text-xs text-red-500 whitespace-nowrap">
                                {invoice.retencionIrpf ? (
                                    <span title="Retención aplicada">
                                        -{formatCurrency(invoice.montoRetencion || 0)}
                                        <span className="ml-1 text-[10px] text-muted-foreground/70">(Ret.)</span>
                                    </span>
                                ) : "-"}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold whitespace-nowrap">{formatCurrency(invoice.totalPagar)}</TableCell>
                            <TableCell className="text-center">
                                <Dialog open={invoiceToDelete === invoice.id} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            onClick={() => setInvoiceToDelete(invoice.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                                <AlertTriangle className="h-5 w-5" />
                                                ¿Confirmar eliminación?
                                            </DialogTitle>
                                            <DialogDescription className="py-2">
                                                Estás a punto de borrar la factura de <strong>{invoice.cliente}</strong> por un monto de <strong>{formatCurrency(invoice.totalPagar)}</strong>. Esta acción no se puede deshacer.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="gap-2 sm:gap-0">
                                            <Button variant="outline" onClick={() => setInvoiceToDelete(null)}>Cancelar</Button>
                                            <Button variant="destructive" onClick={() => handleDelete(invoice.id)}>Eliminar Factura</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
