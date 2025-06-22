'use client';

import { useState } from 'react';
import { useProducts } from '@/lib/store';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, AlertTriangle, Truck, BrainCircuit, ShoppingCart, DollarSign } from 'lucide-react';
import AddProductDialog from './add-product-dialog';
import RecordTransactionDialog from './record-transaction-dialog';
import ReorderSuggestionDialog from './reorder-suggestion-dialog';

export default function StockDashboard() {
  const { products } = useProducts();
  const [isAddProductOpen, setAddProductOpen] = useState(false);
  const [isRecordTxnOpen, setRecordTxnOpen] = useState(false);
  const [isReorderOpen, setReorderOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactionType, setTransactionType] = useState<'sale' | 'purchase'>('sale');

  const handleRecordTransaction = (product: Product, type: 'sale' | 'purchase') => {
    setSelectedProduct(product);
    setTransactionType(type);
    setRecordTxnOpen(true);
  };
  
  const handleReorderSuggestion = (product: Product) => {
    setSelectedProduct(product);
    setReorderOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your current inventory.</p>
        </div>
        <Button onClick={() => setAddProductOpen(true)}>
          <PlusCircle className="mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => {
                  const isLowStock = product.stock <= product.lowStockThreshold;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="destructive" className="flex w-fit items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="secondary">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRecordTransaction(product, 'sale')}>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Record Sale
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRecordTransaction(product, 'purchase')}>
                              <Truck className="mr-2 h-4 w-4" />
                              Record Purchase
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReorderSuggestion(product)}>
                              <BrainCircuit className="mr-2 h-4 w-4" />
                              Reorder Suggestion
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No products found. Add your first product to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddProductDialog open={isAddProductOpen} onOpenChange={setAddProductOpen} />
      
      {selectedProduct && (
        <RecordTransactionDialog
          open={isRecordTxnOpen}
          onOpenChange={setRecordTxnOpen}
          product={selectedProduct}
          transactionType={transactionType}
        />
      )}

      {selectedProduct && (
         <ReorderSuggestionDialog
          open={isReorderOpen}
          onOpenChange={setReorderOpen}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
