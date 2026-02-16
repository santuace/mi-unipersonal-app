import { CompanyWizard } from "@/components/settings/company-wizard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store } from "lucide-react"

export default function WizardPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 flex items-center justify-center">
            <div className="w-full max-w-4xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-fit">
                        <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Configuremos tu Empresa
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                        Para calcular tus impuestos correctamente, necesitamos algunos datos clave sobre tu actividad y registro.
                    </p>
                </div>

                <div className="bg-background rounded-xl border shadow-sm p-1">
                    <CompanyWizard isOnboarding={true} />
                </div>
            </div>
        </div>
    )
}
