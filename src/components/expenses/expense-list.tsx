"use client"

import { useExpenseStore } from "@/store/expenses"
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
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

export function ExpenseList() {
    const { gastos, removeGasto } = useExpenseStore()
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return null // O un skeleton
    }


    if (!gastos || gastos.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No hay gastos registrados.</p>
            </div>
        )
    }

    const handleDelete = (id: string) => {
        removeGasto(id)
        setExpenseToDelete(null)
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
                        <TableHead className="text-xs whitespace-nowrap">Proveedor</TableHead>
                        <TableHead className="text-xs whitespace-nowrap max-w-[150px]">Descripción</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Categoría</TableHead>
                        <TableHead className="text-right text-xs whitespace-nowrap">Monto Total</TableHead>
                        <TableHead className="text-right text-xs whitespace-nowrap">IVA Deducible</TableHead>
                        <TableHead className="w-[50px] text-center text-xs">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {gastos.map((gasto) => (
                        <TableRow key={gasto.id}>
                            <TableCell className="text-xs whitespace-nowrap">{format(new Date(gasto.fecha), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell className="font-medium text-xs whitespace-nowrap">{gasto.proveedor}</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate" title={gasto.descripcion}>{gasto.descripcion}</TableCell>
                            <TableCell className="text-xs">
                                <Badge variant="outline" className="text-[10px] font-normal">
                                    {gasto.categoria}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs whitespace-nowrap">{formatCurrency(gasto.montoTotal)}</TableCell>
                            <TableCell className="text-right text-xs text-blue-600 font-medium whitespace-nowrap">
                                {formatCurrency(gasto.ivaDeducible)}
                            </TableCell>
                            <TableCell className="text-center">
                                <Dialog open={expenseToDelete === gasto.id} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            onClick={() => setExpenseToDelete(gasto.id)}
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
                                                Estás a punto de borrar el gasto de <strong>{gasto.proveedor}</strong> por <strong>{formatCurrency(gasto.montoTotal)}</strong>.
                                                <br />Se eliminará el descuento de IVA asociado.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="gap-2 sm:gap-0">
                                            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>Cancelar</Button>
                                            <Button variant="destructive" onClick={() => handleDelete(gasto.id)}>Eliminar Gasto</Button>
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
