'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Product, Transaction } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Organic Green Tea',
    stock: 85,
    lowStockThreshold: 20,
    transactions: [
      { id: 'txn-1', type: 'purchase', quantity: 100, pricePerUnit: 5.50, date: new Date(Date.now() - 20 * 86400000).toISOString() },
      { id: 'txn-2', type: 'sale', quantity: 10, pricePerUnit: 12.00, date: new Date(Date.now() - 15 * 86400000).toISOString() },
      { id: 'txn-3', type: 'sale', quantity: 5, pricePerUnit: 12.50, date: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
  },
  {
    id: 'prod-2',
    name: 'Artisanal Coffee Beans',
    stock: 40,
    lowStockThreshold: 15,
    transactions: [
      { id: 'txn-4', type: 'purchase', quantity: 50, pricePerUnit: 15.00, date: new Date(Date.now() - 30 * 86400000).toISOString() },
      { id: 'txn-5', type: 'sale', quantity: 5, pricePerUnit: 25.00, date: new Date(Date.now() - 20 * 86400000).toISOString() },
      { id: 'txn-6', type: 'sale', quantity: 5, pricePerUnit: 25.00, date: new Date(Date.now() - 10 * 86400000).toISOString() },
    ],
  },
  {
    id: 'prod-3',
    name: 'Premium Chocolate Bar',
    stock: 120,
    lowStockThreshold: 30,
    transactions: [
      { id: 'txn-7', type: 'purchase', quantity: 150, pricePerUnit: 2.50, date: new Date(Date.now() - 25 * 86400000).toISOString() },
      { id: 'txn-8', type: 'sale', quantity: 20, pricePerUnit: 5.00, date: new Date(Date.now() - 12 * 86400000).toISOString() },
      { id: 'txn-9', type: 'sale', quantity: 10, pricePerUnit: 5.25, date: new Date(Date.now() - 3 * 86400000).toISOString() },
    ],
  },
    {
    id: 'prod-4',
    name: 'Stainless Steel Water Bottle',
    stock: 8,
    lowStockThreshold: 10,
    transactions: [
      { id: 'txn-10', type: 'purchase', quantity: 50, pricePerUnit: 8.00, date: new Date(Date.now() - 40 * 86400000).toISOString() },
      { id: 'txn-11', type: 'sale', quantity: 42, pricePerUnit: 18.00, date: new Date(Date.now() - 7 * 86400000).toISOString() },
    ],
  },
];

interface ProductContextType {
  products: Product[];
  addProduct: (productData: { name: string; initialStock: number; lowStockThreshold: number; }) => void;
  addTransaction: (productId: string, transactionData: Omit<Transaction, 'id' | 'date'>) => void;
  getProductById: (id: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const { toast } = useToast();

  const addProduct = useCallback((productData: { name: string; initialStock: number; lowStockThreshold: number; }) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: productData.name,
      stock: productData.initialStock,
      lowStockThreshold: productData.lowStockThreshold,
      transactions: [],
    };
    setProducts(prev => [...prev, newProduct]);
    setTimeout(() => {
      toast({
        title: "Product Added",
        description: `${newProduct.name} has been added to your inventory.`,
      });
    }, 0);
  }, [toast]);

  const addTransaction = useCallback((productId: string, transactionData: Omit<Transaction, 'id' | 'date'>) => {
    setProducts(currentProducts => {
      const productToUpdate = currentProducts.find(p => p.id === productId);

      if (!productToUpdate) {
        setTimeout(() => {
          toast({
            variant: "destructive",
            title: "Transaction Failed",
            description: "Product not found.",
          });
        }, 0);
        return currentProducts;
      }

      if (transactionData.type === 'sale' && productToUpdate.stock < transactionData.quantity) {
        setTimeout(() => {
          toast({
            variant: "destructive",
            title: "Transaction Failed",
            description: `Not enough stock for ${productToUpdate.name}.`,
          });
        }, 0);
        return currentProducts;
      }

      const newTransaction: Transaction = {
        ...transactionData,
        id: `txn-${Date.now()}`,
        date: new Date().toISOString(),
      };

      const updatedProducts = currentProducts.map(p => {
        if (p.id === productId) {
          const newStock = p.stock + (transactionData.type === 'purchase' ? transactionData.quantity : -transactionData.quantity);
          return {
            ...p,
            stock: newStock,
            transactions: [...p.transactions, newTransaction],
          };
        }
        return p;
      });

      setTimeout(() => {
        toast({
          title: "Transaction Recorded",
          description: `A new ${newTransaction.type} for ${productToUpdate.name} has been recorded.`,
        });
      }, 0);

      return updatedProducts;
    });
  }, [toast]);

  const getProductById = useCallback((id: string) => {
    return products.find(p => p.id === id);
  }, [products]);

  const value = { products, addProduct, addTransaction, getProductById };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
