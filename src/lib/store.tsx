'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Product, Transaction, Withdrawal } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"

const PRODUCTS_STORAGE_KEY = 'stockflow-products';
const WITHDRAWALS_STORAGE_KEY = 'stockflow-withdrawals';

// Use a fixed date to prevent hydration mismatches from Date.now()
const baseDate = new Date('2024-05-01T00:00:00.000Z');
const getDate = (daysAgo: number) => new Date(baseDate.getTime() - daysAgo * 86400000).toISOString();


const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Organic Green Tea',
    stock: 85,
    lowStockThreshold: 20,
    transactions: [
      { id: 'txn-1', type: 'purchase', quantity: 100, pricePerUnit: 5.50, date: getDate(20) },
      { id: 'txn-2', type: 'sale', quantity: 10, pricePerUnit: 12.00, date: getDate(15) },
      { id: 'txn-3', type: 'sale', quantity: 5, pricePerUnit: 12.50, date: getDate(5) },
    ],
  },
  {
    id: 'prod-2',
    name: 'Artisanal Coffee Beans',
    stock: 40,
    lowStockThreshold: 15,
    transactions: [
      { id: 'txn-4', type: 'purchase', quantity: 50, pricePerUnit: 15.00, date: getDate(30) },
      { id: 'txn-5', type: 'sale', quantity: 5, pricePerUnit: 25.00, date: getDate(20) },
      { id: 'txn-6', type: 'sale', quantity: 5, pricePerUnit: 25.00, date: getDate(10) },
    ],
  },
  {
    id: 'prod-3',
    name: 'Premium Chocolate Bar',
    stock: 120,
    lowStockThreshold: 30,
    transactions: [
      { id: 'txn-7', type: 'purchase', quantity: 150, pricePerUnit: 2.50, date: getDate(25) },
      { id: 'txn-8', type: 'sale', quantity: 20, pricePerUnit: 5.00, date: getDate(12) },
      { id: 'txn-9', type: 'sale', quantity: 10, pricePerUnit: 5.25, date: getDate(3) },
    ],
  },
    {
    id: 'prod-4',
    name: 'Stainless Steel Water Bottle',
    stock: 8,
    lowStockThreshold: 10,
    transactions: [
      { id: 'txn-10', type: 'purchase', quantity: 50, pricePerUnit: 8.00, date: getDate(40) },
      { id: 'txn-11', type: 'sale', quantity: 42, pricePerUnit: 18.00, date: getDate(7) },
    ],
  },
];

interface StoreContextType {
  products: Product[];
  addProduct: (productData: { name: string; initialStock: number; lowStockThreshold: number; purchasePrice: number; }) => void;
  editProduct: (productId: string, productData: { name: string; lowStockThreshold: number; }) => void;
  addTransaction: (productId: string, transactionData: Omit<Transaction, 'id' | 'date'>) => void;
  getProductById: (id: string) => Product | undefined;
  deleteProduct: (productId: string) => void;
  importTransactions: (csvData: string) => { success: boolean; message: string };
  withdrawals: Withdrawal[];
  addWithdrawal: (withdrawalData: { amount: number; notes: string; }) => void;
}

const ProductContext = createContext<StoreContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(initialProducts);
      }
      const storedWithdrawals = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
      if (storedWithdrawals) {
        setWithdrawals(JSON.parse(storedWithdrawals));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      setProducts(initialProducts);
      setWithdrawals([]);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isInitialized) {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
        localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(withdrawals));
    }
  }, [products, withdrawals, isInitialized]);

  const addProduct = useCallback((productData: { name: string; initialStock: number; lowStockThreshold: number; purchasePrice: number; }) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: productData.name,
      stock: productData.initialStock,
      lowStockThreshold: productData.lowStockThreshold,
      transactions: [],
    };

    if (productData.initialStock > 0 && productData.purchasePrice >= 0) {
      const initialTransaction: Transaction = {
        id: `txn-${Date.now() + 1}`,
        type: 'purchase',
        quantity: productData.initialStock,
        pricePerUnit: productData.purchasePrice,
        date: new Date().toISOString(),
      };
      newProduct.transactions.push(initialTransaction);
    }

    setProducts(prev => [...prev, newProduct]);
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been added to your inventory.`,
    });
  }, [toast]);

  const editProduct = useCallback((productId: string, productData: { name: string; lowStockThreshold: number; }) => {
    let productName = '';
    setProducts(currentProducts => currentProducts.map(p => {
      if (p.id === productId) {
        productName = productData.name;
        return {
          ...p,
          name: productData.name,
          lowStockThreshold: productData.lowStockThreshold,
        };
      }
      return p;
    }));

    if (productName) {
      toast({
          title: "Product Updated",
          description: `${productName} has been updated.`,
      });
    }
  }, [toast]);

  const deleteProduct = useCallback((productId: string) => {
    let productName = '';
    setProducts(currentProducts => {
      const productToDelete = currentProducts.find(p => p.id === productId);
      if(productToDelete) productName = productToDelete.name;
      return currentProducts.filter(p => p.id !== productId);
    });
    
    if (productName) {
        toast({
          title: "Product Deleted",
          description: `${productName} has been removed from your inventory.`,
        });
    }
  }, [toast]);

  const addTransaction = useCallback((productId: string, transactionData: Omit<Transaction, 'id' | 'date'>) => {
    let outcome: 'success' | 'not_found' | 'no_stock' = 'not_found';
    let productToUpdate: Product | undefined;

    setProducts(currentProducts => {
      const updatedProducts = currentProducts.map(p => {
        if (p.id === productId) {
          productToUpdate = p;
          if (transactionData.type === 'sale' && p.stock < transactionData.quantity) {
            outcome = 'no_stock';
            return p; // Return original product if not enough stock
          }

          const newTransaction: Transaction = {
            ...transactionData,
            id: `txn-${Date.now()}`,
            date: new Date().toISOString(),
          };
          const newStock = p.stock + (transactionData.type === 'purchase' ? transactionData.quantity : -transactionData.quantity);
          outcome = 'success';
          return {
            ...p,
            stock: newStock,
            transactions: [...p.transactions, newTransaction],
          };
        }
        return p;
      });
      return updatedProducts;
    });

    if (outcome === 'success' && productToUpdate) {
      toast({
        title: "Transaction Recorded",
        description: `A new ${transactionData.type} for ${productToUpdate.name} has been recorded.`,
      });
    } else if (outcome === 'not_found') {
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: "Product not found.",
      });
    } else if (outcome === 'no_stock' && productToUpdate) {
      toast({
          variant: "destructive",
          title: "Transaction Failed",
          description: `Not enough stock for ${productToUpdate.name}.`,
      });
    }
  }, [toast]);

  const importTransactions = useCallback((csvData: string): { success: boolean, message: string } => {
    const lines = csvData.trim().split(/\r?\n/);
    if (lines.length < 2) {
        return { success: false, message: 'CSV file must contain a header and at least one data row.' };
    }
    
    const header = lines[0].trim().split(',').map(h => h.trim());
    const expectedHeader = ['ProductName', 'Type', 'Quantity', 'PricePerUnit', 'Date'];
    if (header.length !== expectedHeader.length || !header.every((h, i) => h === expectedHeader[i])) {
        return { success: false, message: `Invalid CSV header. Expected: ${expectedHeader.join(',')}` };
    }

    const tempProducts = new Map(products.map(p => [p.name.toLowerCase(), { ...p, transactions: [...p.transactions] }]));
    let newProductCount = 0;
    const rows = lines.slice(1);

    for (let i = 0; i < rows.length; i++) {
        const line = rows[i];
        if (!line.trim()) continue;

        const values = line.trim().split(',');
        if (values.length !== expectedHeader.length) {
            return { success: false, message: `Row ${i + 2}: Incorrect number of columns. Expected ${expectedHeader.length}, got ${values.length}.` };
        }

        const [productName, type, quantityStr, priceStr, dateStr] = values.map(v => v.trim());
        
        if (type !== 'sale' && type !== 'purchase') {
             return { success: false, message: `Row ${i + 2}: Invalid transaction type '${type}'. Must be 'sale' or 'purchase'.` };
        }
        const quantity = parseInt(quantityStr, 10);
        const pricePerUnit = parseFloat(priceStr);
        const date = new Date(dateStr);

        if (isNaN(quantity) || quantity <= 0) {
             return { success: false, message: `Row ${i + 2}: Invalid quantity '${quantityStr}'. Must be a positive number.` };
        }
         if (isNaN(pricePerUnit) || pricePerUnit < 0) {
             return { success: false, message: `Row ${i + 2}: Invalid price '${priceStr}'. Must be a non-negative number.` };
        }
         if (isNaN(date.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
             return { success: false, message: `Row ${i + 2}: Invalid date format '${dateStr}'. Use YYYY-MM-DD.` };
        }
        
        const productNameLower = productName.toLowerCase();
        if (!tempProducts.has(productNameLower)) {
            tempProducts.set(productNameLower, {
                id: `prod-${Date.now()}-${newProductCount++}`,
                name: productName,
                stock: 0,
                lowStockThreshold: 10,
                transactions: [],
            });
        }
        
        const product = tempProducts.get(productNameLower)!;
        
        if (type === 'sale' && product.stock < quantity) {
            return { success: false, message: `Row ${i + 2}: Not enough stock for '${productName}' to complete sale. Stock: ${product.stock}, Required: ${quantity}.` };
        }
        
        product.stock += (type === 'purchase' ? quantity : -quantity);
        product.transactions.push({
            id: `txn-${Date.now()}-${i}`,
            type: type as 'sale' | 'purchase',
            quantity,
            pricePerUnit,
            date: date.toISOString(),
        });
    }
    
    setProducts(Array.from(tempProducts.values()));
    return { success: true, message: `${rows.length} transaction(s) imported successfully.` };
  }, [products]);

  const getProductById = useCallback((id: string) => {
    return products.find(p => p.id === id);
  }, [products]);

  const addWithdrawal = useCallback((withdrawalData: { amount: number; notes: string; }) => {
    const newWithdrawal: Withdrawal = {
      id: `wd-${Date.now()}`,
      amount: withdrawalData.amount,
      notes: withdrawalData.notes || '',
      date: new Date().toISOString(),
    };
    setWithdrawals(prev => [...prev, newWithdrawal]);
    toast({
      title: "Withdrawal Recorded",
      description: `A withdrawal of ${newWithdrawal.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} has been recorded.`,
    });
  }, [toast]);


  const value = { products, addProduct, editProduct, addTransaction, getProductById, deleteProduct, importTransactions, withdrawals, addWithdrawal };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): StoreContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
