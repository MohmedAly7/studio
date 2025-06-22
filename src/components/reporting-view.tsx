'use client';

import { useState, useMemo } from 'react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
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
import { Calendar as CalendarIcon, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
  const [date, setDate] = useState<DateRange | undefined>();

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

    const filteredTransactions = transactionsToProcess.filter(txn => {
      if (!date?.from) return true; // No date range selected, include all
      const txnDate = new Date(txn.date);
      const from = new Date(date.from);
      from.setHours(0,0,0,0);
      const to = date.to ? new Date(date.to) : new Date(date.from);
      to.setHours(23,59,59,999);
      return txnDate >= from && txnDate <= to;
    });

    const allTransactions = [...filteredTransactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
  }, [selectedProductId, products, date]);

  const dateRangeLabel = date?.from 
    ? (date.to ? `from ${format(date.from, "LLL dd, y")} to ${format(date.to, "LLL dd, y")}` : `for ${format(date.from, "LLL dd, y")}`) 
    : 'all time';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reporting</h1>
        <p className="text-muted-foreground">Analyze historical sales and purchase data.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
            <label htmlFor="product-select" className="text-sm font-medium">Product:</label>
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
        <div className="flex items-center gap-2">
            <label htmlFor="date" className="text-sm font-medium">Date Range:</label>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                    date.to ? (
                        <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(date.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date range</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
        </div>
        {date && (
            <Button variant="ghost" onClick={() => setDate(undefined)}>Reset Date</Button>
        )}
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
            {' for '}
            {dateRangeLabel}.
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
                  {products.length > 0 ? 'No transaction data to display for the selected period.' : 'Add a product to get started.'}
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
