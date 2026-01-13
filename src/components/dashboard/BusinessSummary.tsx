import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Order, OrderStatus } from "@/types";
import { TrendingUp, Package, Clock, AlertTriangle, DollarSign, ShoppingBag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { isToday, isPast, startOfDay } from "date-fns";

interface BusinessSummaryProps {
    orders: Order[];
}

export function BusinessSummary({ orders }: BusinessSummaryProps) {
    const stats = {
        totalRevenue: orders
            .filter((o) => o.status === "completed")
            .reduce((acc, o) => acc + o.totalAmount, 0),
        completed: orders.filter((o) => o.status === "completed").length,
        pending: orders.filter((o) => o.status === "pending").length,
        processing: orders.filter((o) => o.status === "processing").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
        urgent: orders.filter(
            (o) =>
                (o.status === "pending" || o.status === "processing") &&
                isToday(new Date(o.deliveryDate))
        ).length,
        atRisk: orders.filter(
            (o) =>
                (o.status === "pending" || o.status === "processing") &&
                isPast(new Date(o.deliveryDate)) &&
                !isToday(new Date(o.deliveryDate))
        ).length,
    };

    // Calculate top selling products
    const productSales = orders.reduce((acc: { [key: string]: { name: string; quantity: number; revenue: number } }, order) => {
        order.products.forEach((p) => {
            const key = p.name; // Using name as key, might be better to use ID if consistently available
            if (!acc[key]) {
                acc[key] = { name: p.name, quantity: 0, revenue: 0 };
            }
            acc[key].quantity += p.quantity;
            acc[key].revenue += p.price * p.quantity;
        });
        return acc;
    }, {});

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const maxQty = topProducts.length > 0 ? topProducts[0].quantity : 1;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* High Level Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">৳{stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From completed orders</p>
                    </CardContent>
                </Card>

                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Urgent Orders</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{stats.urgent}</div>
                        <p className="text-xs text-muted-foreground">Due today</p>
                    </CardContent>
                </Card>

                <Card className="bg-rose-500/5 border-rose-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{stats.atRisk}</div>
                        <p className="text-xs text-muted-foreground">Overdue orders</p>
                    </CardContent>
                </Card>

                <Card className="bg-indigo-500/5 border-indigo-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Status Breakdown */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Order Status Breakdown</CardTitle>
                        <CardDescription>Current status of all orders in period</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-status-pending" />
                                    Pending
                                </span>
                                <span className="font-mono font-medium">{stats.pending}</span>
                            </div>
                            <Progress value={orders.length ? (stats.pending / orders.length) * 100 : 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-status-processing" />
                                    Processing
                                </span>
                                <span className="font-mono font-medium">{stats.processing}</span>
                            </div>
                            <Progress value={orders.length ? (stats.processing / orders.length) * 100 : 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-status-completed" />
                                    Completed
                                </span>
                                <span className="font-mono font-medium">{stats.completed}</span>
                            </div>
                            <Progress value={orders.length ? (stats.completed / orders.length) * 100 : 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-status-cancelled" />
                                    Cancelled
                                </span>
                                <span className="font-mono">{stats.cancelled}</span>
                            </div>
                            <Progress value={orders.length ? (stats.cancelled / orders.length) * 100 : 0} className="h-2 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                {/* Top Selling Products */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Top Selling Products
                        </CardTitle>
                        <CardDescription>Most popular products by quantity sold</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {topProducts.map((p, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold">{p.name}</span>
                                        <span className="text-muted-foreground">
                                            <span className="text-foreground font-mono font-bold">{p.quantity}</span> sold • ৳{p.revenue.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress value={(p.quantity / maxQty) * 100} className="h-1.5" />
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground italic text-sm">
                                    <Package className="h-8 w-8 mb-2 opacity-20" />
                                    No product sales data available for this period
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
