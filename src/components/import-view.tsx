'use client';

import { useState, useTransition } from 'react';
import { useProducts } from '@/lib/store';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUp, Loader2 } from 'lucide-react';

export default function ImportView() {
  const { importTransactions } = useProducts();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setCsvFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!csvFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a CSV file to import.",
      });
      return;
    }

    startTransition(() => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const result = importTransactions(text);
        if (result.success) {
          toast({
            title: "Import Successful",
            description: result.message,
          });
          // Reset file input
          const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
          if(fileInput) fileInput.value = '';
          setCsvFile(null);
        } else {
          toast({
            variant: "destructive",
            title: "Import Failed",
            description: result.message,
          });
        }
      };
      reader.onerror = () => {
         toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
          });
      }
      reader.readAsText(csvFile);
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
        <p className="text-muted-foreground">Import transactions from a CSV file.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>Select a CSV file with your transaction data to import it into StockFlow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input id="csv-file-input" type="file" accept=".csv" onChange={handleFileChange} />
            <Button onClick={handleImport} disabled={isPending || !csvFile}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              Import Transactions
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>CSV File Format</CardTitle>
            <CardDescription>Your CSV file must have the following columns in this exact order.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono">ProductName</TableCell>
                  <TableCell>Name of the product. If it doesn't exist, it will be created.</TableCell>
                   <TableCell className="font-mono">Organic Green Tea</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-mono">Type</TableCell>
                  <TableCell>Transaction type. Must be 'sale' or 'purchase'.</TableCell>
                  <TableCell className="font-mono">sale</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-mono">Quantity</TableCell>
                  <TableCell>The number of units in the transaction.</TableCell>
                   <TableCell className="font-mono">10</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-mono">PricePerUnit</TableCell>
                  <TableCell>The price for a single unit.</TableCell>
                   <TableCell className="font-mono">12.50</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-mono">Date</TableCell>
                  <TableCell>The date of the transaction in YYYY-MM-DD format.</TableCell>
                   <TableCell className="font-mono">2023-10-26</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="mt-4 text-sm text-muted-foreground">
                Note: The file must contain a header row with these exact column names.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
