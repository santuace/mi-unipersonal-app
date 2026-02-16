"use client"

import { useInvoiceStore } from "@/store/invoices"
import { useCalendarEventStore } from "@/store/calendar-events"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EventDialog } from "@/components/calendar/event-dialog"
import { useState } from "react"
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { getAllTaxDeadlines } from "@/lib/uruguay-taxes"
import { CalendarDays, CheckCircle2, Circle, RefreshCw, Loader2 } from "lucide-react"
import { syncCalendarAction } from "@/app/actions/calendar"
import { toast } from "sonner"

export function CalendarView() {
    const invoices = useInvoiceStore((state) => state.invoices)
    const { events, toggleCompleted } = useCalendarEventStore()
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [isSyncing, setIsSyncing] = useState(false)

    // Get automatic tax deadlines for current year
    const currentYear = new Date().getFullYear()
    const taxDeadlines = getAllTaxDeadlines(currentYear)

    // ... (rest of getEventsForDate, getAllEventDates) ...
    // Note: I need to preserve the helper functions. Since I can't selectively keep them without copying 100 lines, 
    // I will try to target the top part (imports + verified Start) and the render part separately?
    // replace_file_content allows replacing a block.
    // I will replace from "use client" to the end of `CardHeader` to insert the button.

    // Actually, I can replace just the Component Start to add State, and then CardHeader to add Button.
    // But `replace_file_content` is single contiguous block.
    // I'll replace the top part including imports and component start.

    // Wait, I can't define handleSync if I split.
    // I'll rewrite the component start (imports + function start + handleSync).

    const unreplacedHelpers1 = `    // Combine all events for selected date
    const getEventsForDate = (date: Date | undefined) => {
        if (!date) return []

        const allEvents = []

        // Add tax deadlines
        const matchingDeadlines = taxDeadlines.filter(deadline =>
            isSameDay(deadline.fecha, date)
        )
        allEvents.push(...matchingDeadlines.map(d => ({
            tipo: d.tipo,
            titulo: d.descripcion,
            descripcion: undefined,
            isAutomatic: true,
            fecha: d.fecha
        })))

        // Add custom events
        const customEvents = events.filter(event =>
            isSameDay(new Date(event.fecha), date)
        )
        allEvents.push(...customEvents.map(e => ({
            ...e,
            isAutomatic: false
        })))

        return allEvents
    }

    // Get all dates that have events
    const getAllEventDates = () => {
        const dates = [
            ...taxDeadlines.map(d => d.fecha),
            ...events.map(e => new Date(e.fecha))
        ]
        return dates
    }

    const eventDates = getAllEventDates()
    const selectedDateEvents = getEventsForDate(selectedDate)

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date)
        // Don't auto-open dialog, only when clicking "Add Event" button
    }

    const handleAddEvent = () => {
        setSelectedEvent(null)
        setDialogOpen(true)
    }

    const handleEditEvent = (event: any) => {
        if (event.isAutomatic) return // Can't edit automatic events
        setSelectedEvent(event)
        setDialogOpen(true)
    }

    const getEventColor = (tipo: string) => {
        switch (tipo) {
            case 'iva-irpf':
                return 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
            case 'bps-cjppu':
                return 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
            case 'personal':
                return 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
            default:
                return 'bg-gray-100 dark:bg-gray-950/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-800'
        }
    }

    // Calcular fechas por tipo para el resaltado
    const datesByType = {
        ivaIrpf: [
            ...taxDeadlines.filter(d => d.tipo === 'iva-irpf').map(d => d.fecha),
            ...events.filter(e => e.tipo === 'iva-irpf').map(e => new Date(e.fecha))
        ],
        bpsCjppu: [
            ...taxDeadlines.filter(d => d.tipo === 'bps-cjppu').map(d => d.fecha),
            ...events.filter(e => e.tipo === 'bps-cjppu').map(e => new Date(e.fecha))
        ],
        personal: events.filter(e => e.tipo === 'personal').map(e => new Date(e.fecha)),
        otro: events.filter(e => e.tipo === 'otro').map(e => new Date(e.fecha)),
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-UY", {
            style: "currency",
            currency: "UYU",
            maximumFractionDigits: 0,
        }).format(amount)
    }
    
    // New Handler
    const handleSync = async () => {
        setIsSyncing(true)
        const result = await syncCalendarAction()
        
        if (result.error) {
            toast.error("Error al sincronizar", { 
                description: result.error.includes("No authorized") ? "Debes iniciar sesión con Google." : result.error 
            })
        } else {
            toast.success("Sincronización Exitosa", {
                description: \`Se crearon/verificaron \${result.count} eventos en tu Google Calendar.\`
            })
        }
        setIsSyncing(false)
    }
`
    // Since replace_file_content works best with precise range.
    // I will just replace the imports and start of function, and inject handleSync there?
    // Then replace CardHeader separate?
    // No, I can't easily inject a function in the middle without replacing the whole block or finding a good anchor.
    // The anchor "const formatCurrency = ..." is good.
    // I will add handleSync after formatCurrency.


    // Combine all events for selected date
    const getEventsForDate = (date: Date | undefined) => {
        if (!date) return []

        const allEvents = []

        // Add tax deadlines
        const matchingDeadlines = taxDeadlines.filter(deadline =>
            isSameDay(deadline.fecha, date)
        )
        allEvents.push(...matchingDeadlines.map(d => ({
            tipo: d.tipo,
            titulo: d.descripcion,
            descripcion: undefined,
            isAutomatic: true,
            fecha: d.fecha
        })))

        // Add custom events
        const customEvents = events.filter(event =>
            isSameDay(new Date(event.fecha), date)
        )
        allEvents.push(...customEvents.map(e => ({
            ...e,
            isAutomatic: false
        })))

        return allEvents
    }

    // Get all dates that have events
    const getAllEventDates = () => {
        const dates = [
            ...taxDeadlines.map(d => d.fecha),
            ...events.map(e => new Date(e.fecha))
        ]
        return dates
    }

    const eventDates = getAllEventDates()
    const selectedDateEvents = getEventsForDate(selectedDate)

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date)
        // Don't auto-open dialog, only when clicking "Add Event" button
    }

    const handleAddEvent = () => {
        setSelectedEvent(null)
        setDialogOpen(true)
    }

    const handleEditEvent = (event: any) => {
        if (event.isAutomatic) return // Can't edit automatic events
        setSelectedEvent(event)
        setDialogOpen(true)
    }

    const getEventColor = (tipo: string) => {
        switch (tipo) {
            case 'iva-irpf':
                return 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
            case 'bps-cjppu':
                return 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
            case 'personal':
                return 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
            default:
                return 'bg-gray-100 dark:bg-gray-950/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-800'
        }
    }

    // Calcular fechas por tipo para el resaltado
    const datesByType = {
        ivaIrpf: [
            ...taxDeadlines.filter(d => d.tipo === 'iva-irpf').map(d => d.fecha),
            ...events.filter(e => e.tipo === 'iva-irpf').map(e => new Date(e.fecha))
        ],
        bpsCjppu: [
            ...taxDeadlines.filter(d => d.tipo === 'bps-cjppu').map(d => d.fecha),
            ...events.filter(e => e.tipo === 'bps-cjppu').map(e => new Date(e.fecha))
        ],
        personal: events.filter(e => e.tipo === 'personal').map(e => new Date(e.fecha)),
        otro: events.filter(e => e.tipo === 'otro').map(e => new Date(e.fecha)),
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-UY", {
            style: "currency",
            currency: "UYU",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const handleSync = async () => {
        setIsSyncing(true)
        const result = await syncCalendarAction()

        if (result.error) {
            toast.error("Error al sincronizar", {
                description: result.error.includes("No authorized") ? "Debes iniciar sesión con Google." : result.error
            })
        } else {
            toast.success("Sincronización Exitosa", {
                description: `Se crearon/verificaron ${result.count} eventos en tu Google Calendar.`
            })
        }
        setIsSyncing(false)
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-[320px_1fr]">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Calendario Fiscal 2026</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar Google'}</span>
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 text-[10px]">
                            <Badge variant="outline" className="bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300">
                                IVA/IRPF
                            </Badge>
                            <Badge variant="outline" className="bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 border-orange-300">
                                BPS/CJPPU
                            </Badge>
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-300">
                                Personal
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex justify-center pb-3">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            modifiers={{
                                ivaIrpf: datesByType.ivaIrpf,
                                bpsCjppu: datesByType.bpsCjppu,
                                personal: datesByType.personal,
                                otro: datesByType.otro,
                            }}
                            modifiersClassNames={{
                                ivaIrpf: "bg-red-100 text-red-900 font-bold dark:bg-red-900/50 dark:text-red-100",
                                bpsCjppu: "bg-orange-100 text-orange-900 font-bold dark:bg-orange-900/50 dark:text-orange-100",
                                personal: "bg-blue-100 text-blue-900 font-bold dark:bg-blue-900/50 dark:text-blue-100",
                                otro: "bg-gray-100 text-gray-900 font-bold dark:bg-gray-800 dark:text-gray-100"
                            }}
                            className="rounded-md border-0"
                            locale={es}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es }) : "Selecciona una fecha"}
                            </CardTitle>
                            {selectedDate && (
                                <Button size="sm" onClick={handleAddEvent} className="h-8">
                                    + Evento
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-2">
                                {selectedDateEvents.map((event, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border ${getEventColor(event.tipo)} ${!event.isAutomatic ? 'cursor-pointer hover:opacity-80' : ''}`}
                                        onClick={() => !event.isAutomatic && handleEditEvent(event)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    <span className="font-semibold text-sm">{event.titulo}</span>
                                                </div>
                                                {event.descripcion && (
                                                    <p className="text-xs mt-1 opacity-80">{event.descripcion}</p>
                                                )}
                                                {!event.isAutomatic && 'monto' in event && event.monto && (
                                                    <p className="text-xs mt-1 font-medium">
                                                        Monto: {formatCurrency(event.monto)}
                                                    </p>
                                                )}
                                            </div>
                                            {!event.isAutomatic && 'id' in event && 'completado' in event && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if ('id' in event) {
                                                            toggleCompleted(event.id)
                                                        }
                                                    }}
                                                    className="flex-shrink-0"
                                                >
                                                    {event.completado ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 opacity-50" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        {event.isAutomatic && (
                                            <Badge variant="secondary" className="text-[10px] mt-2">
                                                Vencimiento Automático
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col h-[300px] items-center justify-center text-muted-foreground text-center">
                                <CalendarDays className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm">No hay eventos este día</p>
                                {selectedDate && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={handleAddEvent}
                                    >
                                        Agregar Evento
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                selectedDate={selectedDate || null}
                existingEvent={selectedEvent}
            />
        </>
    )
}
