import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Gasto {
    id: string;
    fecha: Date;
    descripcion: string;
    proveedor: string;
    montoTotal: number;
    tasaIva: 0.22 | 0.10 | 0;
    ivaDeducible: number;
    categoria: 'Oficina' | 'Equipos' | 'Servicios' | 'Otros';
}

interface ExpenseState {
    gastos: Gasto[];
    addGasto: (gasto: Omit<Gasto, 'id' | 'ivaDeducible'>) => void;
    removeGasto: (id: string) => void;
}

export const useExpenseStore = create<ExpenseState>()(
    persist(
        (set) => ({
            gastos: [],
            addGasto: (gasto) => {
                const iva = gasto.montoTotal - (gasto.montoTotal / (1 + gasto.tasaIva));
                set((state) => ({
                    gastos: [
                        ...state.gastos,
                        {
                            ...gasto,
                            id: crypto.randomUUID(),
                            ivaDeducible: iva
                        },
                    ],
                }));
            },
            removeGasto: (id) =>
                set((state) => ({
                    gastos: state.gastos.filter((g) => g.id !== id),
                })),
        }),
        {
            name: 'expense-storage',
        }
    )
);
