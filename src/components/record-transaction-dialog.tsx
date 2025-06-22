'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProducts } from '@/lib/store';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const transactionSchema = z.object({
  quantity: z.coerce.number().int().positive({ message: "Quantity must be a positive number." }),
  pricePerUnit: z.coerce.number().positive({ message: "Price must be a positive number." }),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface RecordTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  transactionType: 'sale' | 'purchase';
}

export default function RecordTransactionDialog({
  open,
  onOpenChange,
  product,
  transactionType,
}: RecordTransactionDialogProps) {
  const { addTransaction } = useProducts();
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      quantity: 1,
      pricePerUnit: 0,
    },
  });

  useEffect(() => {
    form.reset({ quantity: 1, pricePerUnit: 0 });
  }, [open, product, transactionType, form]);

  const onSubmit = (data: TransactionFormData) => {
    addTransaction(product.id, { ...data, type: transactionType });
    onOpenChange(false);
  };

  const title = transactionType === 'sale' ? 'Record Sale' : 'Record Purchase';
  const description = `Enter the details for the ${transactionType} of ${product.name}. Current stock: ${product.stock}.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricePerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Per Unit</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit">Record {transactionType === 'sale' ? 'Sale' : 'Purchase'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
