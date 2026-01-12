import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Package, Trash2, Download, Upload } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useFirebaseProducts } from '@/hooks/useFirebaseProducts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';


export default function Products() {
    const { user, profile, loading: authLoading, signOut } = useFirebaseAuth();
    const { products, isLoading: productsLoading, deleteProduct, createProduct } = useFirebaseProducts();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);
    const [currentItem, setCurrentItem] = useState('');


    // Combined loading state
    const loading = authLoading || productsLoading;

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleExport = () => {
        const dataToExport = products.map(p => ({
            'Owner ID': p.ownerId || '',
            'Product ID': p.id,
            Name: p.name,
            Code: p.code || '',
            Price: p.price,
            Details: p.details || '',
            'Created At': p.createdAt ? p.createdAt.toLocaleDateString() : ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Products");
        XLSX.writeFile(wb, "Products.xlsx");
        toast.success("Products exported successfully");
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.error("The selected file is empty");
                    return;
                }

                setIsImporting(true);
                setImportTotal(data.length);
                setImportProgress(0);

                let successCount = 0;
                let errorCount = 0;


                const loadingToast = toast.loading(`Importing 0/${data.length} products...`);

                for (let i = 0; i < data.length; i++) {
                    const row = data[i] as any;
                    const itemName = row.Name || `Item ${i + 1}`;
                    setCurrentItem(itemName);
                    setImportProgress(i + 1);

                    toast.loading(`Processing ${itemName}...`, { id: loadingToast });


                    try {
                        // Basic validation
                        if (!row.Name || !row.Price) {
                            console.warn("Skipping invalid row:", row);
                            toast.error(`Invalid data for ${itemName}`, { duration: 2000 });
                            errorCount++;
                            continue;
                        }

                        // Parse Created At if present
                        const createdAt = row['Created At'] ? new Date(row['Created At']) : undefined;
                        const validCreatedAt = createdAt && !isNaN(createdAt.getTime()) ? createdAt : undefined;

                        await createProduct({
                            name: String(row.Name),
                            price: Number(row.Price),
                            details: row.Details || '',
                            code: row.Code ? String(row.Code) : undefined,
                            ownerId: row['Owner ID'] || undefined,
                            productId: row['Product ID'] || undefined,
                            createdAt: validCreatedAt
                        });

                        successCount++;
                        toast.success(`Succeeded: ${itemName}`, { duration: 1000 });
                    } catch (error) {
                        console.error("Error importing row:", row, error);
                        errorCount++;
                        toast.error(`Failed: ${itemName}`, { duration: 3000 });
                    }

                    toast.loading(`Importing ${i + 1}/${data.length} products...`, { id: loadingToast });
                }

                toast.success(`Import complete! Added/Updated: ${successCount}, Failed/Skipped: ${errorCount}`, { id: loadingToast, duration: 5000 });

            } catch (error) {
                console.error("Error parsing file:", error);
                toast.error("Failed to parse Excel file");
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsBinaryString(file);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout businessName={profile?.businessName || 'My Business'} onLogout={handleLogout}>
            {isImporting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-card border shadow-2xl animate-in fade-in zoom-in duration-200 max-w-md w-full mx-4">
                        <div className="relative">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold">{Math.round((importProgress / importTotal) * 100)}%</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-center w-full">
                            <p className="text-xl font-bold tracking-tight">Importing Products</p>
                            <p className="text-sm text-muted-foreground">
                                Processing {importProgress} of {importTotal}
                            </p>
                            <Progress value={(importProgress / importTotal) * 100} className="h-2 w-full" />
                            <p className="text-xs text-muted-foreground truncate italic">
                                {currentItem && `Adding: ${currentItem}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <p className="text-[10px] font-medium uppercase tracking-wider">Please do not close this window</p>
                        </div>
                    </div>
                </div>
            )/* overlay loader during import */}

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
                        <p className="text-muted-foreground">Manage your product catalog</p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />
                        <Button variant="outline" onClick={handleImportClick} className="w-full sm:w-auto gap-2">
                            <Upload className="h-4 w-4" />
                            Import
                        </Button>
                        <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                        <Button asChild>
                            <Link to="/products/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Product
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Catalog</CardTitle>
                        <CardDescription>A list of all your products.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <Package className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium">No products found</h3>
                                <p className="text-muted-foreground mb-4">Get started by creating your first product.</p>
                                <Button asChild variant="outline">
                                    <Link to="/products/new">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Product
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-right">Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                {product.name}
                                                {product.code && <span className="ml-2 text-muted-foreground text-sm">({product.code})</span>}
                                            </TableCell>
                                            <TableCell>${product.price.toFixed(2)}</TableCell>
                                            <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                                {product.details || '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {product.createdAt?.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={async () => {
                                                        if (confirm('Are you sure you want to delete this product?')) {
                                                            await deleteProduct(product.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
