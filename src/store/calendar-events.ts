import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EventType = 'iva-irpf' | 'bps-cjppu' | 'personal' | 'otro'

export interface CalendarEvent {
    id: string
    titulo: string
    descripcion?: string
    fecha: Date
    tipo: EventType
    monto?: number
    completado?: boolean
}

interface CalendarEventStore {
    events: CalendarEvent[]
    addEvent: (event: Omit<CalendarEvent, 'id'>) => void
    updateEvent: (id: string, event: Partial<CalendarEvent>) => void
    removeEvent: (id: string) => void
    getEventsForDate: (date: Date) => CalendarEvent[]
    toggleCompleted: (id: string) => void
}

export const useCalendarEventStore = create<CalendarEventStore>()(
    persist(
        (set, get) => ({
            events: [],

            addEvent: (event) => {
                const newEvent: CalendarEvent = {
                    ...event,
                    id: crypto.randomUUID(),
                    fecha: new Date(event.fecha) // Ensure it's a Date object
                }
                set((state) => ({ events: [...state.events, newEvent] }))
            },

            updateEvent: (id, updates) => {
                set((state) => ({
                    events: state.events.map(event =>
                        event.id === id ? { ...event, ...updates } : event
                    )
                }))
            },

            removeEvent: (id) => {
                set((state) => ({
                    events: state.events.filter(event => event.id !== id)
                }))
            },

            getEventsForDate: (date) => {
                const events = get().events
                return events.filter(event => {
                    const eventDate = new Date(event.fecha)
                    return eventDate.getDate() === date.getDate() &&
                        eventDate.getMonth() === date.getMonth() &&
                        eventDate.getFullYear() === date.getFullYear()
                })
            },

            toggleCompleted: (id) => {
                set((state) => ({
                    events: state.events.map(event =>
                        event.id === id ? { ...event, completado: !event.completado } : event
                    )
                }))
            }
        }),
        {
            name: 'calendar-events-storage',
            // Serialize dates properly
            partialize: (state) => ({ events: state.events }),
        }
    )
)
