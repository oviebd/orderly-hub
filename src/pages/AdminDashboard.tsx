import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, addDoc, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Users, Activity, Power, ShoppingBag, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface BusinessOwner {
    id: string;
    businessName: string;
    email: string;
    status: 'enabled' | 'disabled';
    canCreateOrders: boolean;
    createdAt: any;
}

interface ActivityLog {
    id: string;
    adminEmail: string;
    action: string;
    targetUserEmail: string;
    details: any;
    timestamp: any;
}

export default function AdminDashboard() {
    const { user, profile, signOut } = useFirebaseAuth();
    const navigate = useNavigate();
    const [owners, setOwners] = useState<BusinessOwner[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (profile && profile.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [profile, navigate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Business Owners
            const ownersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'business')));
            const ownersData = ownersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessOwner));
            setOwners(ownersData);

            // Fetch Logs
            const logsSnap = await getDocs(query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(20)));
            const logsData = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
            setLogs(logsData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
    };

    const toggleStatus = async (owner: BusinessOwner) => {
        const newStatus = owner.status === 'enabled' ? 'disabled' : 'enabled';
        const ownerRef = doc(db, 'users', owner.id);
        await updateDoc(ownerRef, { status: newStatus });
        await logActivity('toggle_access', owner, { status: newStatus });
        fetchData();
    };

    const toggleOrderCreation = async (owner: BusinessOwner) => {
        const newVal = !owner.canCreateOrders;
        const ownerRef = doc(db, 'users', owner.id);
        await updateDoc(ownerRef, { canCreateOrders: newVal });
        await logActivity('toggle_order_creation', owner, { canCreateOrders: newVal });
        fetchData();
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading Admin Portal...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Admin Header */}
            <nav className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Admin Portal</h1>
                        <p className="text-xs text-slate-400">OrderFlow Super User Console</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-300 hidden md:block">{user?.email}</span>
                    <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-slate-300 hover:text-white hover:bg-slate-800">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </nav>

            <main className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Business Owners</CardTitle>
                            <Users className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{owners.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
                            <Activity className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{owners.filter(o => o.status === 'enabled').length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Owners List */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Business Owners</CardTitle>
                        <CardDescription>Manage user access and feature permissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business / Email</TableHead>
                                    <TableHead>Account Status</TableHead>
                                    <TableHead>Order Capability</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {owners.map((owner) => (
                                    <TableRow key={owner.id}>
                                        <TableCell>
                                            <div className="font-medium">{owner.businessName}</div>
                                            <div className="text-xs text-muted-foreground">{owner.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={owner.status === 'enabled' ? 'default' : 'destructive'} className="gap-1">
                                                <Power className="h-3 w-3" />
                                                {owner.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={owner.canCreateOrders ? 'secondary' : 'outline'} className="gap-1">
                                                <ShoppingBag className="h-3 w-3" />
                                                {owner.canCreateOrders ? 'Allowed' : 'Disabled'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {owner.createdAt ? format(owner.createdAt.toDate(), 'PP') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-4">
                                            <div className="flex items-center justify-end gap-6">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Access</span>
                                                    <Switch
                                                        checked={owner.status === 'enabled'}
                                                        onCheckedChange={() => toggleStatus(owner)}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Orders</span>
                                                    <Switch
                                                        checked={owner.canCreateOrders}
                                                        onCheckedChange={() => toggleOrderCreation(owner)}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Admin Activity Log</CardTitle>
                        <CardDescription>Audit trail of all administrative actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-white shadow-sm">
                                    <div className="bg-slate-100 p-2 rounded-full">
                                        <Activity className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            <span className="text-indigo-600">{log.adminEmail}</span>
                                            {" performed "}
                                            <span className="font-bold underline decoration-slate-300">{log.action.replace('_', ' ')}</span>
                                            {" on "}
                                            <span className="text-indigo-600">{log.targetUserEmail}</span>
                                        </p>
                                        <p className="text-[11px] text-muted-foreground font-mono mt-1">
                                            Details: {JSON.stringify(log.details)}
                                        </p>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                                        {log.timestamp ? format(log.timestamp.toDate(), 'Pp') : 'Recently'}
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && <p className="text-center text-muted-foreground py-8">No activity logs found.</p>}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
