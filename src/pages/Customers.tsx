import { useState, useMemo, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowUpDown, User, Mail, Phone, Calendar, DollarSign, Package, Star, Trash2, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useFirebaseCustomers } from '@/hooks/useFirebaseCustomers';
import { useFirebaseExperiences } from '@/hooks/useFirebaseExperiences';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';


export default function Customers() {
    const navigate = useNavigate();
    const { profile, signOut } = useFirebaseAuth();
    const { orders, isLoading: ordersLoading } = useFirebaseOrders();
    const { customers, isLoading: customersLoading, deleteCustomer, createCustomer } = useFirebaseCustomers();
    const { experiences, isLoading: experiencesLoading } = useFirebaseExperiences();

    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<'name' | 'lastOrder'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);
    const [currentItem, setCurrentItem] = useState('');


    const customerStats = useMemo(() => {
        return customers.map(customer => {
            const customerOrders = orders.filter(o => o.customerId === customer.id);
            const deliveredOrders = customerOrders.filter(o => o.status === 'delivered');
            const totalSpend = deliveredOrders.reduce((sum, o) => sum + o.price, 0);
            const lastOrder = customerOrders.length > 0
                ? new Date(Math.max(...customerOrders.map(o => o.deliveryDate.getTime())))
                : null;

            const customerExperiences = experiences.filter(e => e.customerId === customer.id);
            const averageRating = customerExperiences.length > 0
                ? customerExperiences.reduce((sum, e) => sum + e.rating, 0) / customerExperiences.length
                : 0;

            return {
                ...customer,
                totalOrders: deliveredOrders.length,
                totalSpend,
                lastOrder,
                calculatedRating: averageRating,
            };
        });
    }, [customers, orders, experiences]);

    const filteredAndSortedCustomers = useMemo(() => {
        let result = customerStats.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            c.phone.includes(searchQuery)
        );

        result.sort((a, b) => {
            if (sortField === 'name') {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            } else {
                const dateA = a.lastOrder?.getTime() || 0;
                const dateB = b.lastOrder?.getTime() || 0;
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

        return result;
    }, [customerStats, searchQuery, sortField, sortOrder]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const toggleSort = (field: 'name' | 'lastOrder') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleExport = () => {
        const dataToExport = customerStats.map(c => ({
            'Owner ID': c.ownerId,
            Name: c.name,
            Phone: c.phone,
            Email: c.email || '',
            Address: c.address || '',
            'Total Orders': c.totalOrders,
            'Total Spend': c.totalSpend,
            'Rating': c.calculatedRating.toFixed(1),
            'Last Order': c.lastOrder ? format(c.lastOrder, 'yyyy-MM-dd') : '',
            'Created At': format(c.createdAt, 'yyyy-MM-dd'),
            'Comment': c.comment || ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Customers");
        XLSX.writeFile(wb, "Customers.xlsx");
        toast.success("Customers exported successfully");
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


                const loadingToast = toast.loading(`Importing 0/${data.length} customers...`);

                for (let i = 0; i < data.length; i++) {
                    const row = data[i] as any;
                    const itemName = row.Name || `Item ${i + 1}`;
                    setCurrentItem(itemName);
                    setImportProgress(i + 1);

                    toast.loading(`Processing ${itemName}...`, { id: loadingToast });


                    try {
                        // Basic validation
                        if (!row.Name || !row.Phone) {
                            console.warn("Skipping invalid row:", row);
                            toast.error(`Invalid data for ${itemName}`, { duration: 2000 });
                            errorCount++;
                            continue;
                        }

                        const createdAt = row['Created At'] ? new Date(row['Created At']) : undefined;
                        const validCreatedAt = createdAt && !isNaN(createdAt.getTime()) ? createdAt : undefined;

                        const updatedAtString = row['Updated At'] || row['Last Order'];
                        const updatedAt = updatedAtString ? new Date(updatedAtString) : undefined;
                        const validUpdatedAt = updatedAt && !isNaN(updatedAt.getTime()) ? updatedAt : undefined;

                        await createCustomer({
                            id: row['Customer ID'] || row['ID'],
                            ownerId: row['Owner ID'],
                            name: row.Name,
                            phone: String(row.Phone),
                            email: row.Email || '',
                            address: row.Address || '',
                            rating: parseFloat(row.Rating) || 0,
                            comment: row.Comment || '',
                            createdAt: validCreatedAt,
                            updatedAt: validUpdatedAt,
                        });

                        successCount++;
                        toast.success(`Succeeded: ${itemName}`, { duration: 1000 });
                    } catch (error) {
                        console.error("Error importing row:", row, error);
                        errorCount++;
                        toast.error(`Failed: ${itemName}`, { duration: 3000 });
                    }

                    toast.loading(`Importing ${i + 1}/${data.length} customers...`, { id: loadingToast });
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


    if (ordersLoading || customersLoading || experiencesLoading) {
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
                            <p className="text-xl font-bold tracking-tight">Importing Customers</p>
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
                        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                        <p className="text-muted-foreground">Manage your customer relationships and view order history</p>
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
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSort('name')}
                            className={cn("gap-2", sortField === 'name' && "bg-secondary")}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            Name {sortField === 'name' && (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSort('lastOrder')}
                            className={cn("gap-2", sortField === 'lastOrder' && "bg-secondary")}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            Last Order {sortField === 'lastOrder' && (sortOrder === 'asc' ? 'Oldest' : 'Newest')}
                        </Button>
                    </div>
                </div>

                {/* Customer List */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAndSortedCustomers.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                            <User className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">No customers found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search query</p>
                        </div>
                    ) : (
                        filteredAndSortedCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                onClick={() => navigate(`/customers/${customer.id}`)}
                                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between relative">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                <span className="text-sm font-bold text-primary">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold leading-none">{customer.name}</h3>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={cn(
                                                                "h-3 w-3",
                                                                star <= Math.round(customer.calculatedRating) ? "fill-accent text-accent" : "text-muted"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this customer?')) {
                                                    deleteCustomer(customer.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 shrink-0" />
                                            <span>{customer.phone}</span>
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{customer.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary/50 p-3">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Successful Orders</p>
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Package className="h-4 w-4 text-primary" />
                                                <span className="font-bold">{customer.totalOrders}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Purchase</p>
                                            <div className="flex items-center gap-2 text-foreground">
                                                <DollarSign className="h-4 w-4 text-primary" />
                                                <span className="font-bold">${customer.totalSpend.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t pt-4 text-[11px] text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>Customer since {format(customer.createdAt, 'MMM d, yyyy')}</span>
                                    </div>
                                    {customer.lastOrder && (
                                        <span>Last: {format(customer.lastOrder, 'MMM d, yyyy')}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
