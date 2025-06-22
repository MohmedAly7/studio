'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useProducts } from '@/lib/store';
import type { Transaction } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExportView() {
  const { products } = useProducts();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>();

  const handleExport = () => {
    let transactionsToExport: (Transaction & { productName: string })[] = [];

    const productsToFilter = selectedProductId === 'all'
      ? products
      : products.filter(p => p.id === selectedProductId);

    productsToFilter.forEach(product => {
      const filteredTransactions = product.transactions.filter(txn => {
        if (!date?.from || !date?.to) return true; // No date range selected, include all
        const txnDate = new Date(txn.date);
        // Set hours to 0 to compare dates only
        const from = new Date(date.from!);
        from.setHours(0,0,0,0);
        const to = new Date(date.to!);
        to.setHours(23,59,59,999);
        return txnDate >= from && txnDate <= to;
      });
      transactionsToExport.push(...filteredTransactions.map(t => ({...t, productName: product.name})));
    });

    if (transactionsToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data Found",
        description: "There are no transactions matching your selected criteria.",
      });
      return;
    }

    const headers = ['ProductName', 'TransactionID', 'Type', 'Quantity', 'PricePerUnit', 'TotalCost', 'Date'];
    const csvRows = [
      headers.join(','),
      ...transactionsToExport.map(row => 
        [
          `"${row.productName.replace(/"/g, '""')}"`, // Handle quotes in product names
          row.id,
          row.type,
          row.quantity,
          row.pricePerUnit,
          row.quantity * row.pricePerUnit,
          `"${new Date(row.date).toISOString()}"`
        ].join(',')
      )
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'stockflow_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
        title: "Export Successful",
        description: `${transactionsToExport.length} records have been exported.`,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
        <p className="text-muted-foreground">Export your transaction records to a CSV file.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Select the product and time interval for the data you want to export.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Product</label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
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
            
            <div className="space-y-2">
                <label className="text-sm font-medium">Date range</label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
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

            <Button onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to CSV
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
