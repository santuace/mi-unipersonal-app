import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Factura } from '@/types';

interface InvoiceState {
    invoices: Factura[];
    addInvoice: (invoice: Omit<Factura, 'id'>) => void;
    removeInvoice: (id: string) => void;
    updateInvoice: (id: string, invoice: Partial<Factura>) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
    persist(
        (set) => ({
            invoices: [],
            addInvoice: (invoice) =>
                set((state) => ({
                    invoices: [
                        ...state.invoices,
                        { ...invoice, id: crypto.randomUUID() },
                    ],
                })),
            removeInvoice: (id) =>
                set((state) => ({
                    invoices: state.invoices.filter((inv) => inv.id !== id),
                })),
            updateInvoice: (id, updatedInvoice) =>
                set((state) => ({
                    invoices: state.invoices.map((inv) =>
                        inv.id === id ? { ...inv, ...updatedInvoice } : inv
                    ),
                })),
        }),
        {
            name: 'invoice-storage',
        }
    )
);
