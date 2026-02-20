'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpense, uploadReceipt } from "@/actions/expenses";
import { getCategories } from "@/actions/categories";
import { toast } from 'sonner';
import { Loader2, Plus, Upload } from 'lucide-react';

const expenseSchema = z.object({
    amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
    description: z.string().min(1, "La descripción es requerida"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha inválida",
    }),
    categoryId: z.string().min(1, "La categoría es requerida"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
    categories?: { id: string; name: string }[];
}

export function ExpenseForm({ categories: initialCategories = [] }: ExpenseFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [categories, setCategories] = useState(initialCategories);

    useEffect(() => {
        if (initialCategories.length === 0) {
            getCategories().then(setCategories);
        } else {
            setCategories(initialCategories);
        }
    }, [initialCategories]);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            amount: 0,
            description: "",
            date: new Date().toISOString().split('T')[0],
            categoryId: "",
        },
    });

    async function onSubmit(values: ExpenseFormValues) {
        setIsSubmitting(true);
        try {
            let receiptUrl: string | undefined;

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                const url = await uploadReceipt(formData);
                if (url) receiptUrl = url;
            }

            await createExpense({
                amount: values.amount,
                description: values.description,
                date: new Date(values.date),
                categoryId: values.categoryId,
                receiptUrl,
            });

            toast.success("Gasto agregado correctamente");
            form.reset({
                amount: 0,
                description: "",
                date: new Date().toISOString().split('T')[0],
                categoryId: "",
            });
            setFile(null);
        } catch (error) {
            toast.error("Error al agregar el gasto");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Gasto</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                    <Input placeholder="Almuerzo, taxi, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar categoría" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormItem>
                        <FormLabel>Recibo (Opcional)</FormLabel>
                        <div className="flex items-center gap-2">
                            <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium transition-colors">
                                <Upload className="w-4 h-4" />
                                {file ? 'Cambiar Archivo' : 'Subir Recibo'}
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            {file && <span className="text-sm text-muted-foreground truncate max-w-[200px]">{file.name}</span>}
                        </div>
                    </FormItem>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Agregar Gasto
                    </Button>
                </form>
            </Form>
        </div>
    );
}
