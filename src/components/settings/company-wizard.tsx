"use client"

import { useState, useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { useCompanyStore } from "@/store/company"
import { CompanyConfig, RegimenTributario, SituacionFamiliar, MonotributoCategoria } from "@/types"
import { toast } from "sonner"
import { StepIdentity } from "./wizard-steps/step-identity"
import { StepRegime } from "./wizard-steps/step-regime"
import { StepTaxes } from "./wizard-steps/step-taxes"
import { PreviewCard } from "./wizard-steps/preview-card"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react"
import { saveCompanySettings } from "@/app/actions/settings"
import { useRouter } from "next/navigation"

// Schema Definition
const companyWizardSchema = z.object({
    razonSocial: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    rut: z.string()
        .length(12, { message: "El RUT debe tener 12 dígitos." })
        .refine((val) => val.startsWith("21"), { message: "El RUT debe comenzar con '21'." }),
    fechaInicio: z.date(),
    // anioEgreso is optional unless CJPPU is active (we'll validte that in refine or check manually before save)
    anioEgreso: z.date().optional(),
    regimen: z.enum(["general", "literal_e", "sas", "monotributo", "sociedad"]),
    categoriaMonotributo: z.enum(["m_social", "m_unipersonal", "m_asociativa", "m_profesional"]).optional(),
    situacionFamiliar: z.enum(["sin_carga", "con_hijos", "con_conyuge_hijos"]),
    categoriaCJPPU: z.number().min(1).max(10).optional(),
    aportes: z.object({
        fonasa: z.boolean(),
        cajaProfesional: z.boolean(),
        fondoSolidaridad: z.boolean()
    })
}).superRefine((data, ctx) => {
    // Cross-validation: Egreso required if CJPPU is active
    if (data.aportes.cajaProfesional && !data.anioEgreso && data.regimen !== 'monotributo') { // Monotributo ignores CJPPU usually
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Si pagas Caja Profesional, debes indicar el Año de Egreso.",
            path: ["anioEgreso"]
        })
    }

    // Monotributo requires category
    if (data.regimen === 'monotributo' && !data.categoriaMonotributo) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debes seleccionar una categoría de Monotributo.",
            path: ["categoriaMonotributo"]
        })
    }
})

type WizardValues = z.infer<typeof companyWizardSchema>

interface CompanyWizardProps {
    isOnboarding?: boolean
}

export function CompanyWizard({ isOnboarding = false }: CompanyWizardProps) {
    const {
        razonSocial,
        rut,
        regimen,
        fechaInicio,
        anioEgreso,
        situacionFamiliar,
        aportes,
        categoriaMonotributo,
        categoriaCJPPU,
        setConfig
    } = useCompanyStore()

    const [currentStep, setCurrentStep] = useState(0)
    const [direction, setDirection] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const defaultRegimen = (regimen && ["general", "literal_e", "sas", "monotributo", "sociedad"].includes(regimen))
        ? regimen
        : "literal_e";

    const form = useForm<WizardValues>({
        resolver: zodResolver(companyWizardSchema),
        defaultValues: {
            razonSocial: razonSocial || "",
            rut: rut || "",
            regimen: defaultRegimen as any,
            fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
            anioEgreso: anioEgreso ? new Date(anioEgreso) : undefined,
            situacionFamiliar: situacionFamiliar || "sin_carga",
            categoriaMonotributo: categoriaMonotributo || undefined,
            categoriaCJPPU: categoriaCJPPU || 10,
            aportes: {
                fonasa: aportes?.fonasa ?? true,
                cajaProfesional: aportes?.cajaProfesional ?? false,
                fondoSolidaridad: aportes?.fondoSolidaridad ?? false
            }
        },
        mode: "onChange"
    })

    const { trigger, watch } = form
    const formData = watch() // For PreviewCard real-time updates

    const steps = [
        { title: "Identidad", component: StepIdentity, fields: ["razonSocial", "rut", "fechaInicio", "anioEgreso"] },
        { title: "Régimen", component: StepRegime, fields: ["regimen", "categoriaMonotributo"] },
        { title: "Aportes", component: StepTaxes, fields: ["situacionFamiliar", "categoriaCJPPU", "aportes"] }
    ]

    const nextStep = async () => {
        const fields = steps[currentStep].fields
        const valid = await trigger(fields as any) // Type assertion needed for strict string array

        if (valid) {
            setDirection(1)
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
        }
    }

    const prevStep = () => {
        setDirection(-1)
        setCurrentStep((prev) => Math.max(prev - 1, 0))
    }

    const onSubmit = async (data: WizardValues) => {
        setIsSaving(true)

        // 1. Save to Database
        // Cast to any to avoid minor type mismatches with CompanyConfig vs WizardValues if any
        const result = await saveCompanySettings(data as any)

        if (result.error) {
            toast.error("Error al guardar", { description: result.error })
            setIsSaving(false)
            return
        }

        // 2. Update Local Store
        setConfig({
            ...data,
            fechaInicio: data.fechaInicio,
            anioEgreso: data.anioEgreso
        })

        toast.success("Configuración guardada correctamente.")
        setIsSaving(false)

        if (isOnboarding || result.success) {
            router.push("/")
            router.refresh()
        }
    }

    const CurrentStepComponent = steps[currentStep].component

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -50 : 50,
            opacity: 0
        })
    }

    return (
        <FormProvider {...form}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto p-4 md:p-8">
                {/* Main Wizard Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Configuración de Empresa</h2>
                            <p className="text-muted-foreground">Paso {currentStep + 1} de {steps.length}: {steps[currentStep].title}</p>
                        </div>
                        <div className="flex space-x-1">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 w-8 rounded-full transition-colors ${i === currentStep ? "bg-primary" : i < currentStep ? "bg-primary/50" : "bg-muted"}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Step Content with Animation */}
                    <div className="relative overflow-hidden border rounded-xl p-6 shadow-sm bg-card">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="h-full"
                            >
                                <CurrentStepComponent />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                        </Button>

                        {currentStep < steps.length - 1 ? (
                            <Button onClick={nextStep}>
                                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>Guardando <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>
                                ) : (
                                    <>Guardar Configuración <Save className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sidebar Preview */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <PreviewCard config={formData as any} />
                    </div>
                </div>
            </div>
        </FormProvider>
    )
}
