import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
            <Card className="w-full max-w-sm border-0 shadow-lg">
                <CardHeader className="text-center flex flex-col items-center gap-2">
                    <Image
                        src="/logo-ox.png"
                        alt="Logo Estudio"
                        width={180}
                        height={50}
                        className="h-12 w-auto object-contain mb-2"
                        priority
                    />
                    <CardTitle className="text-2xl font-bold">Bienvenido</CardTitle>
                    <CardDescription className="text-balance">
                        Iniciá sesión y mantené las finanzas de tu unipersonal en orden
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        action={async (formData) => {
                            "use server"
                            await signIn("credentials", {
                                username: formData.get("username"),
                                password: formData.get("password"),
                                redirectTo: "/"
                            })
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="username">Usuario</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="admin"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <Button className="w-full" type="submit" size="lg">
                            Iniciar sesión
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Usuario: <span className="font-mono">admin</span> | Contraseña: <span className="font-mono">admin123</span>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
