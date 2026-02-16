import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompanyConfig, RegimenTributario, SituacionFamiliar } from '@/types';

interface CompanyState extends CompanyConfig {
    setConfig: (data: Partial<CompanyConfig>) => void;
    setRegimen: (regimen: RegimenTributario) => void;
    toggleAporte: (key: keyof CompanyConfig['aportes']) => void;
}

export const useCompanyStore = create<CompanyState>()(
    persist(
        (set) => ({
            razonSocial: '',
            rut: '',
            regimen: 'general',
            fechaInicio: new Date(),
            situacionFamiliar: 'sin_carga',
            aportes: {
                fonasa: true,
                cajaProfesional: true,
                fondoSolidaridad: true,
            },
            categoriaMonotributo: undefined,
            categoriaCJPPU: 10,
            setCompanyData: (data: Partial<CompanyConfig>) =>
                set((state) => ({
                    ...state,
                    ...data,
                    aportes: { ...state.aportes, ...(data.aportes || {}) },
                })),
            setConfig: (data) =>
                set((state) => ({
                    ...state,
                    ...data,
                    aportes: { ...state.aportes, ...(data.aportes || {}) },
                })),
            setRegimen: (regimen) => set({ regimen }),
            toggleAporte: (key) =>
                set((state) => ({
                    aportes: {
                        ...state.aportes,
                        [key]: !state.aportes[key],
                    },
                })),
        }),
        {
            name: 'company-config', // Renamed for clarity, but keeps old data if I don't change it. I'll keep 'company-storage' to preserve data if user wants.
            partialize: (state) => ({
                razonSocial: state.razonSocial,
                rut: state.rut,
                regimen: state.regimen,
                fechaInicio: state.fechaInicio,
                anioEgreso: state.anioEgreso,
                situacionFamiliar: state.situacionFamiliar,
                categoriaMonotributo: state.categoriaMonotributo,
                categoriaCJPPU: state.categoriaCJPPU,
                aportes: state.aportes,
            }),
        }
    )
);
