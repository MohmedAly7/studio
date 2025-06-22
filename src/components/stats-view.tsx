'use client';

import { useMemo } from 'react';
import { useProducts } from '@/lib/store';
import type { Product, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Package, TrendingUp, TrendingDown } from 'lucide-react';

interface CalculatedStats {
  totalSalesAmount: number;
  totalPurchaseAmount: number;
  totalStockValue: number;
  profitPerProduct: {
    productName: string;
    profit: number;
    totalRevenue: number;
    totalCost: number;
  }[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function StatsView() {
  const { products } = useProducts();

  const stats = useMemo<CalculatedStats>(() => {
    let totalSalesAmount = 0;
    let totalPurchaseAmount = 0;
    let totalStockValue = 0;

    const profitPerProduct = products.map(product => {
      const sales = product.transactions.filter(t => t.type === 'sale');
      const purchases = product.transactions.filter(t => t.type === 'purchase');

      const totalRevenue = sales.reduce((acc, t) => acc + t.quantity * t.pricePerUnit, 0);
      const totalCost = purchases.reduce((acc, t) => acc + t.quantity * t.pricePerUnit, 0);
      
      const lastPurchasePrice = purchases.length > 0
        ? [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].pricePerUnit
        : 0;

      totalSalesAmount += totalRevenue;
      totalPurchaseAmount += totalCost;
      totalStockValue += product.stock * lastPurchasePrice;

      return {
        productName: product.name,
        profit: totalRevenue - totalCost, // Simplified profit
        totalRevenue,
        totalCost,
      };
    });

    return { totalSalesAmount, totalPurchaseAmount, totalStockValue, profitPerProduct };
  }, [products]);

  const totalProfit = stats.totalSalesAmount - stats.totalPurchaseAmount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground">Key metrics for your business performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">Total sales minus total purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSalesAmount)}</div>
            <p className="text-xs text-muted-foreground">Total revenue from all sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPurchaseAmount)}</div>
             <p className="text-xs text-muted-foreground">Total cost of all purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value of Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalStockValue)}</div>
             <p className="text-xs text-muted-foreground">Estimated value of current inventory</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit by Product</CardTitle>
          <CardContent className="p-0 pt-4">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.profitPerProduct.map(item => (
                        <TableRow key={item.productName}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(item.totalRevenue)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(item.totalCost)}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(item.profit)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}
