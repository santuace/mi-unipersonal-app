"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Tesseract from 'tesseract.js'
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseInvoiceText, ExtractedData } from '@/lib/ocr-parser'
import { toast } from "sonner"

interface DocumentScannerProps {
    onScanComplete: (data: ExtractedData, text: string) => void;
}

export function DocumentScanner({ onScanComplete }: DocumentScannerProps) {
    const [isScanning, setIsScanning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState("")

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        processFile(file)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
            'application/pdf': ['.pdf'] // Tesseract supports images, for PDF we might need conversion or just stick to images for MVP
        },
        maxFiles: 1
    })

    const processFile = async (file: File) => {
        setIsScanning(true)
        setProgress(0)
        setStatus("Inicializando motor OCR...")

        const imageUrl = URL.createObjectURL(file);

        try {
            const worker = await Tesseract.createWorker('spa', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(m.progress * 100)
                        setStatus(`Escaneando: ${Math.round(m.progress * 100)}%`)
                    } else {
                        setStatus(m.status)
                    }
                },
                errorHandler: (err) => console.error(err)
            });

            const { data: { text } } = await worker.recognize(imageUrl);

            await worker.terminate();

            setStatus("Analizando datos...")
            const extracted = parseInvoiceText(text)

            toast.success("Documento procesado", {
                description: extracted.montoTotal ? `Monto detectado: $${extracted.montoTotal}` : "Revise los datos extraídos."
            })

            onScanComplete(extracted, text)

        } catch (error: any) {
            console.error(error)
            setStatus("Error")
            toast.error("Error al escanear", {
                description: error.message || "No se pudo leer el archivo. Intente con una imagen más clara."
            })
        } finally {
            URL.revokeObjectURL(imageUrl);
            setIsScanning(false)
            setProgress(100)
            if (status !== "Error") setStatus("Listo")
        }
    }

    return (
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-0">
                <div
                    {...getRootProps()}
                    className={`
                flex flex-col items-center justify-center p-8 cursor-pointer min-h-[150px]
                ${isDragActive ? 'bg-primary/5' : ''}
            `}
                >
                    <input {...getInputProps()} />

                    {isScanning ? (
                        <div className="w-full space-y-4 max-w-xs text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium">{status}</p>
                                <Progress value={progress} className="h-2" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <div className="bg-muted rounded-full p-4 w-fit mx-auto">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Arrastra tu factura aquí</p>
                                <p className="text-xs text-muted-foreground">o haz clic para seleccionar (Imagen)</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
