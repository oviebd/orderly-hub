import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function AddProduct() {
    const { user, profile, loading: authLoading, signOut } = useFirebaseAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [details, setDetails] = useState('');

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!name.trim()) {
            toast({
                title: "Error",
                description: "Product name is required",
                variant: "destructive"
            });
            return;
        }

        if (!price || isNaN(Number(price))) {
            toast({
                title: "Error",
                description: "Valid price is required",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, 'products'), {
                businessId: user.uid,
                name,
                price: Number(price),
                details,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast({
                title: 'Product Created',
                description: 'The product has been successfully added.',
            });
            navigate('/products');
        } catch (error: any) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Failed to create product.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
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
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <Button variant="ghost" asChild className="mb-4 pl-0">
                        <Link to="/products" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Products
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
                    <p className="text-muted-foreground">Create a new product for your catalog</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                        <CardDescription>Enter the information for the new product.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Chocolate Cake"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="details">Details (Optional)</Label>
                                <Textarea
                                    id="details"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Product description, ingredients, etc."
                                    disabled={isSaving}
                                    rows={4}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" asChild disabled={isSaving}>
                                    <Link to="/products">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Product
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
