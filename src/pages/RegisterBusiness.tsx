import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export default function RegisterBusiness() {
    const navigate = useNavigate();
    const { registerBusiness, user, profile } = useFirebaseAuth();
    const { toast } = useToast();
    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await registerBusiness(businessName, phone);
            if (error) {
                toast({
                    title: 'Registration failed',
                    description: error.message,
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: 'Business Registered!',
                description: 'Your business profile has been set up successfully.',
            });

            // Navigate to dashboard
            navigate('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md animate-fade-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg mb-4">
                        <Building2 className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">Setup Business Profile</h1>
                    <p className="text-muted-foreground mt-1">Tell us about your business to get started</p>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">Business Details</CardTitle>
                        <CardDescription>
                            We need a few more details to set up your OrderFlow account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input
                                    id="businessName"
                                    placeholder="e.g., Sweet Delights Bakery"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Complete Registration
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
