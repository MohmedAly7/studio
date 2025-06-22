'use client';

import { useState, useMemo } from 'react';
import { useProducts } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { Transaction } from '@/lib/types';
import { Package } from 'lucide-react';

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
  purchases: {
    label: "Purchases",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function ReportingView() {
  const { products } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>('all');

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [selectedProductId, products]);

  const chartData = useMemo(() => {
    const dataByMonth: { [key: string]: { month: string; sales: number; purchases: number } } = {};

    let transactionsToProcess: Transaction[];

    if (selectedProductId === 'all') {
      transactionsToProcess = products.flatMap(p => p.transactions);
    } else {
      const product = products.find(p => p.id === selectedProductId);
      transactionsToProcess = product ? product.transactions : [];
    }

    const allTransactions = [...transactionsToProcess].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    allTransactions.forEach((txn: Transaction) => {
      const date = new Date(txn.date);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!dataByMonth[month]) {
        dataByMonth[month] = { month, sales: 0, purchases: 0 };
      }

      if (txn.type === 'sale') {
        dataByMonth[month].sales += txn.quantity;
      } else {
        dataByMonth[month].purchases += txn.quantity;
      }
    });

    return Object.values(dataByMonth);
  }, [selectedProductId, products]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reporting</h1>
        <p className="text-muted-foreground">Analyze historical sales and purchase data.</p>
      </div>

      <div className="flex items-center gap-4">
        <label htmlFor="product-select" className="font-medium">Select Product:</label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger id="product-select" className="w-[280px]">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly Transaction Volume</CardTitle>
          <CardDescription>
            {selectedProductId === 'all'
              ? 'Showing sales and purchases for all products'
              : selectedProduct
                ? `Showing sales and purchases for ${selectedProduct.name}`
                : 'Select a product to view its transaction history'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                 <CartesianGrid vertical={false} />
                 <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value}
                 />
                 <YAxis />
                 <ChartTooltip content={<ChartTooltipContent />} />
                 <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                 <Bar dataKey="purchases" fill="var(--color-purchases)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center bg-muted/50 rounded-lg">
                <Package className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  {products.length > 0 ? 'No transaction data to display.' : 'Add a product to get started.'}
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
