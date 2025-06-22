'use client';

import { useState, useTransition } from 'react';
import { getReorderSuggestion } from '@/lib/actions';
import type { Product } from '@/lib/types';
import type { SuggestReorderQuantityOutput } from '@/ai/flows/reorder-suggestion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { BrainCircuit, Loader2, Lightbulb } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

interface ReorderSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export default function ReorderSuggestionDialog({
  open,
  onOpenChange,
  product,
}: ReorderSuggestionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<SuggestReorderQuantityOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    startTransition(async () => {
      const pastSalesData = product.transactions
        .filter(t => t.type === 'sale')
        .map(t => `Sold ${t.quantity} at $${t.pricePerUnit.toFixed(2)} on ${new Date(t.date).toLocaleDateString()}`)
        .join(', ');

      const pastPurchaseData = product.transactions
        .filter(t => t.type === 'purchase')
        .map(t => `Purchased ${t.quantity} at $${t.pricePerUnit.toFixed(2)} on ${new Date(t.date).toLocaleDateString()}`)
        .join(', ');

      const result = await getReorderSuggestion({
        productName: product.name,
        pastSalesData: pastSalesData || 'No sales data',
        pastPurchaseData: pastPurchaseData || 'No purchase data',
        currentStockLevel: product.stock,
      });

      if ('error' in result && result.error) {
         toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
        setSuggestion(null);
      } else {
        setSuggestion(result);
      }
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setSuggestion(null);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reorder Suggestion</DialogTitle>
          <DialogDescription>
            Get an AI-powered reorder suggestion for {product.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Product Details</h4>
            <p className="text-sm text-muted-foreground">
              Current Stock: {product.stock} units
            </p>
          </div>
          <Separator />
          {suggestion ? (
            <Alert className="bg-accent/20 border-accent/50">
              <Lightbulb className="h-4 w-4 text-accent-foreground" />
              <AlertTitle className="text-accent-foreground font-bold">AI Suggestion</AlertTitle>
              <AlertDescription className="text-accent-foreground/90">
                <p className="font-semibold">Reorder Quantity: {suggestion.reorderQuantity} units</p>
                <p className="mt-2 text-sm">{suggestion.reasoning}</p>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">
              Click the button below to generate a reorder suggestion based on historical data.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            Generate Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
