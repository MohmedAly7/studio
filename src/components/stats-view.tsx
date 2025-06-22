'use client';

import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useProducts } from '@/lib/store';
import type { Product, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Package, TrendingUp, TrendingDown, Calendar as CalendarIcon, Banknote } from 'lucide-react';
import { ChartContainer } from "@/components/ui/chart";
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import WithdrawalDialog from './withdrawal-dialog';


interface CalculatedStats {
  totalSalesAmount: number;
  totalPurchaseAmount: number;
  totalStockValue: number;
  totalWithdrawals: number;
  profitPerProduct: {
    productName: string;
    profit: number;
    totalRevenue: number;
    totalCost: number;
    stockValue: number;
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
  const { products, withdrawals } = useProducts();
  const [date, setDate] = useState<DateRange | undefined>();
  const [isWithdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  const stats = useMemo<CalculatedStats>(() => {
    let totalSalesAmount = 0;
    let totalPurchaseAmount = 0;
    let totalStockValue = 0;
    const profitPerProduct: CalculatedStats['profitPerProduct'] = [];
    const stockValuePerProduct: CalculatedStats['stockValuePerProduct'] = [];

    products.forEach(product => {
      const transactionsInDateRange = product.transactions.filter(txn => {
        if (!date?.from) return true;
        const txnDate = new Date(txn.date);
        const from = new Date(date.from);
        from.setHours(0, 0, 0, 0);
        const to = date.to ? new Date(date.to) : new Date(date.from);
        to.setHours(23, 59, 59, 999);
        return txnDate >= from && txnDate <= to;
      });

      const sales = transactionsInDateRange.filter(t => t.type === 'sale');
      const purchases = transactionsInDateRange.filter(t => t.type === 'purchase');

      const totalRevenue = sales.reduce((acc, t) => acc + t.quantity * t.pricePerUnit, 0);
      const totalCost = purchases.reduce((acc, t) => acc + t.quantity * t.pricePerUnit, 0);
      
      const allPurchases = product.transactions.filter(t => t.type === 'purchase');
      const lastPurchasePrice = allPurchases.length > 0
        ? [...allPurchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].pricePerUnit
        : 0;

      const currentStockValue = product.stock * lastPurchasePrice;

      totalSalesAmount += totalRevenue;
      totalPurchaseAmount += totalCost;
      totalStockValue += currentStockValue;

      profitPerProduct.push({
        productName: product.name,
        profit: totalRevenue - totalCost, // Profit from sales only
        totalRevenue,
        totalCost,
        stockValue: currentStockValue,
      });

      if (currentStockValue > 0) {
        stockValuePerProduct.push({
          name: product.name,
          value: currentStockValue,
        });
      }
    });

    const withdrawalsInDateRange = withdrawals.filter(w => {
        if (!date?.from) return true;
        const wDate = new Date(w.date);
        const from = new Date(date.from);
        from.setHours(0, 0, 0, 0);
        const to = date.to ? new Date(date.to) : new Date(date.from);
        to.setHours(23, 59, 59, 999);
        return wDate >= from && wDate <= to;
    });

    const totalWithdrawals = withdrawalsInDateRange.reduce((acc, w) => acc + w.amount, 0);

    return { totalSalesAmount, totalPurchaseAmount, totalStockValue, totalWithdrawals, profitPerProduct, stockValuePerProduct };
  }, [products, withdrawals, date]);

  const totalProfit = stats.totalSalesAmount + stats.totalStockValue + stats.totalPurchaseAmount - stats.totalWithdrawals;
  
  const dateRangeLabel = date?.from 
    ? (date.to ? `from ${format(date.from, "LLL dd, y")} to ${format(date.to, "LLL dd, y")}` : `for ${format(date.from, "LLL dd, y")}`) 
    : 'all time';

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">Key metrics for your business performance.</p>
        </div>
        <Button onClick={() => setWithdrawalDialogOpen(true)}>
            <Banknote className="mr-2 h-4 w-4" />
            Take Money
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium">Filter by Date Range</label>
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
          {date && (
            <Button variant="ghost" onClick={() => setDate(undefined)}>Reset to All Time</Button>
          )}
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">Revenue + Stock Value + Costs - Withdrawals ({dateRangeLabel})</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSalesAmount)}</div>
            <p className="text-xs text-muted-foreground">Total revenue from sales ({dateRangeLabel})</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPurchaseAmount)}</div>
             <p className="text-xs text-muted-foreground">Total cost of purchases ({dateRangeLabel})</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value of Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalStockValue)}</div>
             <p className="text-xs text-muted-foreground">Current estimated value of inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalWithdrawals)}</div>
             <p className="text-xs text-muted-foreground">Total cash withdrawn ({dateRangeLabel})</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit by Product</CardTitle>
            <p className="text-sm text-muted-foreground">Showing data {dateRangeLabel}</p>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Stock Value</TableHead>
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
                                <TableCell className="text-right">{formatCurrency(item.stockValue)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(item.totalRevenue + item.stockValue - item.totalCost)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
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
            <p className="text-sm text-muted-foreground">Showing current stock value</p>
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

      <WithdrawalDialog open={isWithdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen} />
    </div>
  );
}
