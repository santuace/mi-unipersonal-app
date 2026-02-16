"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarEvent, EventType, useCalendarEventStore } from "@/store/calendar-events"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface EventDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDate: Date | null
    existingEvent?: CalendarEvent | null
}

export function EventDialog({ open, onOpenChange, selectedDate, existingEvent }: EventDialogProps) {
    const { addEvent, updateEvent, removeEvent } = useCalendarEventStore()

    const [titulo, setTitulo] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [tipo, setTipo] = useState<EventType>("personal")
    const [monto, setMonto] = useState<string>("")

    // Reset form when dialog opens/closes or when editing
    useEffect(() => {
        if (open) {
            if (existingEvent) {
                setTitulo(existingEvent.titulo)
                setDescripcion(existingEvent.descripcion || "")
                setTipo(existingEvent.tipo)
                setMonto(existingEvent.monto?.toString() || "")
            } else {
                setTitulo("")
                setDescripcion("")
                setTipo("personal")
                setMonto("")
            }
        }
    }, [open, existingEvent])

    const handleSave = () => {
        if (!titulo.trim()) return
        if (!selectedDate) return

        const eventData = {
            titulo: titulo.trim(),
            descripcion: descripcion.trim() || undefined,
            fecha: selectedDate,
            tipo,
            monto: monto ? parseFloat(monto) : undefined,
            completado: existingEvent?.completado || false
        }

        if (existingEvent) {
            updateEvent(existingEvent.id, eventData)
        } else {
            addEvent(eventData)
        }

        onOpenChange(false)
    }

    const handleDelete = () => {
        if (existingEvent) {
            removeEvent(existingEvent.id)
            onOpenChange(false)
        }
    }

    if (!selectedDate) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {existingEvent ? "Editar Evento" : "Agregar Evento"}
                    </DialogTitle>
                    <DialogDescription>
                        {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="titulo">Título *</Label>
                        <Input
                            id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ej: Reunión con contador"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo</Label>
                        <Select value={tipo} onValueChange={(value) => setTipo(value as EventType)}>
                            <SelectTrigger id="tipo">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Detalles adicionales (opcional)"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monto">Monto estimado (opcional)</Label>
                        <Input
                            id="monto"
                            type="number"
                            value={monto}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonto(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    {existingEvent && (
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="mr-auto"
                        >
                            Eliminar
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={!titulo.trim()}>
                            {existingEvent ? "Guardar" : "Agregar"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
