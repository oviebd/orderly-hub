import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, addDoc, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Users, Activity, Power, ShoppingBag, LogOut, Info, Calendar as CalendarIcon, ArrowLeft, Search, Clock, Package, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface BusinessOwner {
    id: string;
    businessName: string;
    email: string;
    status: 'enabled' | 'disabled';
    canCreateOrders: boolean;
    createdAt: any;
    plan?: string;
}

interface ActivityLog {
    id: string;
    adminEmail: string;
    action: string;
    targetUserEmail: string;
    details: any;
    timestamp: any;
}

interface OrderStats {
    totalOrders: number;
    totalAmount: number;
    delivered: number;
    cancelled: number;
    pending: number;
    confirmed: number;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

export default function AdminDashboard() {
    const { user, profile, signOut } = useFirebaseAuth();
    const navigate = useNavigate();
    const [owners, setOwners] = useState<BusinessOwner[]>([]);
    const [filteredOwners, setFilteredOwners] = useState<BusinessOwner[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [statsOwner, setStatsOwner] = useState<BusinessOwner | null>(null);
    const [stats, setStats] = useState<OrderStats>({
        totalOrders: 0,
        totalAmount: 0,
        delivered: 0,
        cancelled: 0,
        pending: 0,
        confirmed: 0
    });

    const [ownerDetailOpen, setOwnerDetailOpen] = useState(false);
    const [selectedOwnerForModal, setSelectedOwnerForModal] = useState<BusinessOwner | null>(null);


    useEffect(() => {
        if (profile && profile.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [profile, navigate]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredOwners(owners);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = owners.filter(
                (owner) =>
                    (owner.businessName || '').toLowerCase().includes(lowerQuery) ||
                    (owner.email || '').toLowerCase().includes(lowerQuery)
            );
            setFilteredOwners(filtered);
        }
    }, [searchQuery, owners]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Owners (Only if not already loaded, OR if we want to ensure fresh data for list view)
            // For simplicity and freshness, we fetch when in global view or if empty.
            if (!statsOwner && owners.length === 0) {
                const ownersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'business')));
                const ownersData = ownersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessOwner));
                setOwners(ownersData);
                setFilteredOwners(ownersData);
            }

            // Time Range Calculation
            const now = new Date();
            let start: Date | null = null;
            let end: Date | null = null;

            if (timeRange !== 'all') {
                switch (timeRange) {
                    case 'today':
                        start = startOfDay(now);
                        end = endOfDay(now);
                        break;
                    case 'week':
                        start = startOfWeek(now);
                        end = endOfWeek(now);
                        break;
                    case 'month':
                        start = startOfMonth(now);
                        end = endOfMonth(now);
                        break;
                }
            }

            if (statsOwner) {
                // --- USER DETAIL VIEW MODE ---

                // A. Fetch User Orders for Stats
                // Using client-side filtering for dates to avoid complex compound indexes for every combination
                const ordersQ = query(collection(db, 'orders'), where('ownerId', '==', statsOwner.id));
                const ordersSnap = await getDocs(ordersQ);
                let orders = ordersSnap.docs.map(doc => doc.data());

                if (start && end) {
                    // Safety check for createdAt exists and is a Timestamp
                    orders = orders.filter(o => {
                        const d = o.createdAt?.toDate ? o.createdAt.toDate() : null;
                        return d && d >= start! && d <= end!;
                    });
                }

                setStats({
                    totalOrders: orders.length,
                    totalAmount: orders.reduce((sum, o) => sum + (o.price || 0), 0),
                    delivered: orders.filter(o => o.status === 'delivered').length,
                    cancelled: orders.filter(o => o.status === 'cancelled').length,
                    pending: orders.filter(o => o.status === 'pending').length,
                    confirmed: orders.filter(o => o.status === 'confirmed').length,
                });

                // B. Fetch User Specific Logs
                const userLogsQ = query(
                    collection(db, 'activity_logs'),
                    where('targetUserId', '==', statsOwner.id),
                    orderBy('timestamp', 'desc')
                );
                const userLogsSnap = await getDocs(userLogsQ);
                let userLogsData = userLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));

                if (start && end) {
                    userLogsData = userLogsData.filter(l => {
                        const d = l.timestamp?.toDate ? l.timestamp.toDate() : null;
                        return d && d >= start! && d <= end!;
                    });
                }
                setLogs(userLogsData);

            } else {
                // --- GLOBAL LIST VIEW MODE ---

                // Fetch Global Logs
                let logsQuery;
                if (start && end) {
                    // For Global Logs, we can use filtering efficiently if indexed, or just orderBy timestamp and filter.
                    // Assuming 'timestamp' desc index exists.
                    logsQuery = query(
                        collection(db, 'activity_logs'),
                        where('timestamp', '>=', Timestamp.fromDate(start)),
                        where('timestamp', '<=', Timestamp.fromDate(end)),
                        orderBy('timestamp', 'desc')
                    );
                } else {
                    logsQuery = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50));
                }
                const logsSnap = await getDocs(logsQuery);
                const logsData = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
                setLogs(logsData);
            }

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeRange, statsOwner]);

    const logActivity = async (action: string, targetUser: BusinessOwner, details: any) => {
        if (!user) return;
        await addDoc(collection(db, 'activity_logs'), {
            adminId: user.uid,
            adminEmail: user.email,
            action,
            targetUserId: targetUser.id,
            targetUserEmail: targetUser.email,
            details,
            timestamp: Timestamp.now(),
        });
        fetchData();
    };

    const toggleStatus = async (owner: BusinessOwner) => {
        const newStatus = owner.status === 'enabled' ? 'disabled' : 'enabled';
        const ownerRef = doc(db, 'users', owner.id);
        await updateDoc(ownerRef, { status: newStatus });
        await logActivity('toggle_access', owner, { status: newStatus });
        // Update local state if in list view to avoid full re-fetch flicker
        if (!statsOwner) {
            setOwners(prev => prev.map(o => o.id === owner.id ? { ...o, status: newStatus } : o));
        } else {
            // Update the statsOwner object itself if we are viewing it
            setStatsOwner(prev => prev ? { ...prev, status: newStatus } : null);
        }
    };

    const toggleOrderCreation = async (owner: BusinessOwner) => {
        const newVal = !owner.canCreateOrders;
        const ownerRef = doc(db, 'users', owner.id);
        await updateDoc(ownerRef, { canCreateOrders: newVal });
        await logActivity('toggle_order_creation', owner, { canCreateOrders: newVal });
        if (!statsOwner) {
            setOwners(prev => prev.map(o => o.id === owner.id ? { ...o, canCreateOrders: newVal } : o));
        } else {
            setStatsOwner(prev => prev ? { ...prev, canCreateOrders: newVal } : null);
        }
    };

    // Modal for quick view in list (optional, maybe not needed if we stick to full page drill down)
    // Keeping it for "Info" button, but "Click Row" goes to full page.
    const handleViewDetailsModal = (owner: BusinessOwner) => {
        setSelectedOwnerForModal(owner);
        setOwnerDetailOpen(true);
    };

    const handleEnterDetailView = (owner: BusinessOwner) => {
        setStatsOwner(owner);
        setTimeRange('all'); // Reset time range or keep? Resetting is often safer UX.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToGlobal = () => {
        setStatsOwner(null);
        setTimeRange('all');
    };

    if (isLoading && owners.length === 0 && !statsOwner) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white gap-4">
            <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium animate-pulse">Initializing Secure Admin Portal...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Admin Header */}
            <nav className="bg-slate-950 text-white border-b border-indigo-900/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer" onClick={handleBackToGlobal}>
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Super Admin</h1>
                        <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">System Control Center</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs text-slate-400">Authenticated as</span>
                        <span className="text-sm font-medium text-slate-200">{user?.email}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => signOut()} className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-indigo-500/50 transition-all duration-300">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </nav>

            <main className="p-6 max-w-7xl mx-auto space-y-8">

                {statsOwner ? (
                    // ==========================
                    // DETAIL VIEW
                    // ==========================
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Header with Back, Title, Controls */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleBackToGlobal}
                                    className="h-10 w-10 rounded-full border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                        {(statsOwner.businessName || 'Business').toUpperCase()}
                                        <Badge variant={statsOwner.status === 'enabled' ? 'default' : 'destructive'} className="text-xs px-2 py-0.5 h-fit">
                                            {statsOwner.status}
                                        </Badge>
                                    </h2>
                                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded textxs font-mono">{statsOwner.email}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Joined {statsOwner.createdAt?.toDate ? format(statsOwner.createdAt.toDate(), 'PP') : 'N/A'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border">
                                {(['today', 'week', 'month', 'all'] as const).map((r) => (
                                    <Button
                                        key={r}
                                        variant={timeRange === r ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setTimeRange(r)}
                                        className={timeRange === r ? 'bg-indigo-600 shadow-md' : 'text-slate-500'}
                                    >
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Stats Cards (User Specific) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-none shadow-md bg-white overflow-hidden group hover:shadow-xl transition-all duration-300 relative">
                                <div className="absolute top-0 right-0 p-3 text-indigo-100 group-hover:text-indigo-500 transition-colors">
                                    <ShoppingBag className="h-12 w-12" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Volume</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900">{stats.totalOrders}</div>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <Package className="h-3 w-3" />
                                        Processed Orders
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md bg-white overflow-hidden group hover:shadow-xl transition-all duration-300 relative">
                                <div className="absolute top-0 right-0 p-3 text-green-100 group-hover:text-green-500 transition-colors">
                                    <DollarSign className="h-12 w-12" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Revenue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900">৳{stats.totalAmount.toLocaleString()}</div>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <Activity className="h-3 w-3 text-green-500" />
                                        Sales Generated
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md bg-white overflow-hidden group hover:shadow-xl transition-all duration-300 col-span-1 md:col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Order Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center py-1">
                                        <StatusItem label="Delivered" count={stats.delivered} color="text-green-600" icon={<CheckCircle2 className="h-4 w-4" />} />
                                        <Separator orientation="vertical" className="h-10" />
                                        <StatusItem label="Confirmed" count={stats.confirmed} color="text-blue-600" icon={<Clock className="h-4 w-4" />} />
                                        <Separator orientation="vertical" className="h-10" />
                                        <StatusItem label="Pending" count={stats.pending} color="text-amber-600" icon={<Activity className="h-4 w-4" />} />
                                        <Separator orientation="vertical" className="h-10" />
                                        <StatusItem label="Cancelled" count={stats.cancelled} color="text-rose-600" icon={<XCircle className="h-4 w-4" />} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Permissions & Logs */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Control Panel */}
                            <Card className="border-none shadow-md bg-slate-900 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-indigo-400" />
                                        Access Control
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">Manage {statsOwner.businessName}'s permissions</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-slate-200">Account Status</div>
                                            <div className="text-xs text-slate-500">Enable or disable login access</div>
                                        </div>
                                        <Switch
                                            checked={statsOwner.status === 'enabled'}
                                            onCheckedChange={() => toggleStatus(statsOwner)}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>
                                    <Separator className="bg-slate-800" />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-slate-200">Order Creation</div>
                                            <div className="text-xs text-slate-500">Allow user to add new orders</div>
                                        </div>
                                        <Switch
                                            checked={statsOwner.canCreateOrders}
                                            onCheckedChange={() => toggleOrderCreation(statsOwner)}
                                            className="data-[state=checked]:bg-indigo-600"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* User Activity Logs */}
                            <Card className="lg:col-span-2 border-none shadow-md bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-indigo-600" />
                                        User History
                                    </CardTitle>
                                    <CardDescription>Admin actions performed on this user account</CardDescription>
                                </CardHeader>
                                <CardContent className="max-h-[300px] overflow-auto">
                                    <div className="space-y-4">
                                        {logs.map((log) => (
                                            <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                                <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-indigo-200 border-2 border-indigo-500 shadow-sm shadow-indigo-500/50" />
                                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-indigo-600 uppercase">
                                                            {log.action.replace('toggle_', 'Toggle ')}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP p') : 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        Action by: <span className="font-medium text-slate-900">{log.adminEmail}</span>
                                                    </p>
                                                    <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1 rounded border border-slate-100 w-fit">
                                                        {JSON.stringify(log.details)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {logs.length === 0 && (
                                            <div className="text-center py-10 text-slate-400 italic text-sm">
                                                No activity records found for this user in selected period.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                ) : (
                    // ==========================
                    // LIST VIEW (Global)
                    // ==========================
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Owners List Section */}
                        <Card className="lg:col-span-2 shadow-sm border-none bg-white flex flex-col h-full">
                            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl">Business Owners</CardTitle>
                                    <CardDescription>Manage user permissions</CardDescription>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search by User or Email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>Business & Email</TableHead>
                                            <TableHead>Account</TableHead>
                                            <TableHead>Orders</TableHead>
                                            <TableHead className="text-right pr-6">Manage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOwners.length > 0 ? (
                                            filteredOwners.map((owner) => (
                                                <TableRow
                                                    key={owner.id}
                                                    onClick={() => handleEnterDetailView(owner)}
                                                    className="cursor-pointer group hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                                {(owner.businessName?.[0] || '?').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-900">{owner.businessName}</div>
                                                                <div className="text-[11px] text-slate-500 font-mono">{owner.email}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={owner.status === 'enabled' ? 'default' : 'destructive'}
                                                            className={`gap-1.5 px-2 font-medium ${owner.status === 'enabled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
                                                            <div className={`h-1.5 w-1.5 rounded-full ${owner.status === 'enabled' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                                                            {owner.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline"
                                                            className={`gap-1.5 font-medium ${owner.canCreateOrders ? 'text-indigo-600 border-indigo-100 bg-indigo-50/30' : 'text-slate-400 border-slate-200'}`}>
                                                            <ShoppingBag className="h-3 w-3" />
                                                            {owner.canCreateOrders ? 'Active' : 'Locked'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="icon" onClick={() => handleViewDetailsModal(owner)} className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                                <Info className="h-4 w-4" />
                                                            </Button>
                                                            <Separator orientation="vertical" className="h-4 mx-1" />
                                                            <div className="flex items-center gap-4">
                                                                <Switch
                                                                    checked={owner.status === 'enabled'}
                                                                    onCheckedChange={() => toggleStatus(owner)}
                                                                    className="data-[state=checked]:bg-emerald-500"
                                                                />
                                                                <Switch
                                                                    checked={owner.canCreateOrders}
                                                                    onCheckedChange={() => toggleOrderCreation(owner)}
                                                                    className="data-[state=checked]:bg-indigo-600"
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                                                    No users found matching "{searchQuery}"
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Audit Logs (Global) */}
                        <div className="space-y-4">
                            <Card className="shadow-sm border-none bg-white h-full flex flex-col">
                                <CardHeader className="pb-3 border-b border-slate-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-indigo-600" />
                                            Audit Logs (Global)
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg">
                                        {(['today', 'week', 'month', 'all'] as const).map((r) => (
                                            <Button
                                                key={r}
                                                variant={timeRange === r ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setTimeRange(r)}
                                                className={`flex-1 h-7 text-xs ${timeRange === r ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </Button>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 px-2 flex-1 overflow-auto max-h-[calc(100vh-300px)]">
                                    <div className="space-y-3">
                                        {logs.map((log) => (
                                            <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                                <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-indigo-200 border-2 border-indigo-500 shadow-sm shadow-indigo-500/50" />
                                                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 group hover:border-indigo-200 hover:bg-white transition-all duration-300">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">
                                                            {log.action.replace('toggle_', '')}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400">
                                                            {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm') : 'now'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] leading-tight text-slate-700">
                                                        <span className="font-semibold">{log.adminEmail.split('@')[0]}</span>
                                                        {" updated "}
                                                        <span className="font-semibold text-slate-900">{log.targetUserEmail.split('@')[0]}</span>
                                                    </p>
                                                    <div className="mt-1.5 pt-1.5 border-t border-slate-100/50 flex items-center justify-between">
                                                        <span className="text-[9px] font-mono text-slate-500">
                                                            {JSON.stringify(log.details)}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400">
                                                            {log.timestamp?.toDate && format(log.timestamp.toDate(), 'MMM d')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {logs.length === 0 && <p className="text-center text-slate-400 py-12 text-sm italic">No activity logs found for this period.</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

            {/* Owner Detail Dialog for Quick View */}
            <Dialog open={ownerDetailOpen} onOpenChange={setOwnerDetailOpen}>
                <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-2xl border-none shadow-2xl p-0">
                    <DialogHeader className="bg-slate-950 text-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-bold shadow-xl shadow-indigo-500/30">
                                {(selectedOwnerForModal?.businessName?.[0] || '?').toUpperCase()}
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-2xl font-bold">{selectedOwnerForModal?.businessName}</DialogTitle>
                                <DialogDescription className="text-indigo-400 font-mono text-xs uppercase tracking-widest mt-1">
                                    Business Entity Profile
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Email Address" value={selectedOwnerForModal?.email || 'N/A'} icon={<Info className="h-4 w-4" />} />
                            <DetailItem label="Account Role" value="Business Owner" icon={<ShieldCheck className="h-4 w-4" />} />
                            <DetailItem label="Created At" value={selectedOwnerForModal?.createdAt?.toDate ? format(selectedOwnerForModal.createdAt.toDate(), 'PPP') : 'N/A'} icon={<CalendarIcon className="h-4 w-4" />} />
                            <DetailItem label="Service Plan" value={selectedOwnerForModal?.plan || 'Free'} icon={<Package className="h-4 w-4" />} />
                        </div>

                        <Separator />

                        <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Power className="h-3 w-3" />
                                Auth Status & Controls
                            </h4>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Login Capability</span>
                                <Badge variant={selectedOwnerForModal?.status === 'enabled' ? 'default' : 'destructive'}>
                                    {selectedOwnerForModal?.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Order Creation</span>
                                <Badge variant={selectedOwnerForModal?.canCreateOrders ? 'secondary' : 'outline'}>
                                    {selectedOwnerForModal?.canCreateOrders ? 'Unlocked' : 'Locked'}
                                </Badge>
                            </div>
                        </div>

                        <p className="text-[10px] text-center text-slate-400 italic">
                            * Super Admins cannot view individual order contents/customer data for this user.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatusItem({ label, count, color, icon }: { label: string; count: number; color: string; icon: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center px-2">
            <div className={`p-1.5 rounded-lg mb-1 ${color.replace('text', 'bg').replace('-600', '-50')}`}>
                {icon}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">{label}</span>
            <span className={`text-xl font-bold ${color}`}>{count}</span>
        </div>
    );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-sm font-semibold text-slate-800 break-all">{value}</div>
        </div>
    );
}
