'use client';

import { useMemo } from 'react';
import { useProducts } from '@/lib/store';
import type { Product, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { ChartContainer } from "@/components/ui/chart";
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";


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
  stockValuePerProduct: {
    name: string;
    value: number;
  }[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function StatsView() {
  const { products } = useProducts();

  const stats = useMemo<CalculatedStats>(() => {
    let totalSalesAmount = 0;
    let totalPurchaseAmount = 0;
    let totalStockValue = 0;
    const profitPerProduct: CalculatedStats['profitPerProduct'] = [];
    const stockValuePerProduct: CalculatedStats['stockValuePerProduct'] = [];

    products.forEach(product => {
      const sales = product.transactions.filter(t => t.type === 'sale');
      const purchases = product.transactions.filter(t => t.type === 'purchase');

      const totalRevenue = sales.reduce((acc, t) => acc + t.quantity * t.pricePerUnit, 0);
      const totalCost = purchases.reduce((acc, t) => acc + t.quantity * t.pricePerUnit, 0);
      
      const lastPurchasePrice = purchases.length > 0
        ? [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].pricePerUnit
        : 0;

      const currentStockValue = product.stock * lastPurchasePrice;

      totalSalesAmount += totalRevenue;
      totalPurchaseAmount += totalCost;
      totalStockValue += currentStockValue;

      profitPerProduct.push({
        productName: product.name,
        profit: totalRevenue - totalCost,
        totalRevenue,
        totalCost,
      });

      if (currentStockValue > 0) {
        stockValuePerProduct.push({
          name: product.name,
          value: currentStockValue,
        });
      }
    });

    return { totalSalesAmount, totalPurchaseAmount, totalStockValue, profitPerProduct, stockValuePerProduct };
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit by Product</CardTitle>
          </CardHeader>
          <CardContent>
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
                    {stats.profitPerProduct.length > 0 ? (
                        stats.profitPerProduct.map(item => (
                            <TableRow key={item.productName}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(item.totalRevenue)}</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(item.totalCost)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(item.profit)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No data to display.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
             </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Value Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            {stats.stockValuePerProduct.length > 0 ? (
              <ChartContainer config={{}} className="mx-auto aspect-square max-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-1 gap-1.5">
                                <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    {payload[0].name}
                                    </span>
                                    <span className="font-bold">
                                    {formatCurrency(payload[0].value as number)}
                                    </span>
                                </div>
                                </div>
                            </div>
                            )
                        }
                        return null
                        }}
                    />
                    <Pie
                        data={stats.stockValuePerProduct}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            if (percent < 0.05) return null;
                            return (
                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        }}
                    >
                        {stats.stockValuePerProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend/>
                    </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-center bg-muted/50 rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No stock value data to display.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
