import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { signIn, adminSignUp } = useFirebaseAuth();
    const { toast } = useToast();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminName, setAdminName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) {
                    toast({
                        title: 'Admin login failed',
                        description: error.message,
                        variant: 'destructive',
                    });
                    return;
                }
            } else {
                const { error } = await adminSignUp(email, password, adminName);
                if (error) {
                    toast({
                        title: 'Admin sign up failed',
                        description: error.message,
                        variant: 'destructive',
                    });
                    return;
                }
                toast({
                    title: 'Admin account created!',
                    description: 'Welcome to OrderFlow Admin.',
                });
            }
            navigate('/admin/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md animate-fade-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-indigo-500/20 shadow-lg mb-4">
                        <ShieldCheck className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">OrderFlow Admin</h1>
                    <p className="text-slate-400 mt-1">Super User Management Portal</p>
                </div>

                <Card className="shadow-2xl border-slate-800 bg-slate-900 text-white">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">
                            {isLogin ? 'Admin Access' : 'Register Super User'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {isLogin
                                ? 'Authorized personnel only. Please sign in.'
                                : 'Enter your details to create a super user account'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <Label htmlFor="adminName" className="text-slate-300">Admin Name</Label>
                                    <Input
                                        id="adminName"
                                        placeholder="e.g., John Doe"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        required={!isLogin}
                                        disabled={isLoading}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Admin Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@orderflow.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    disabled={isLoading}
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" size="lg" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLogin ? 'Grant Access' : 'Create Admin'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-slate-400">
                                {isLogin ? "Need a super user account? " : "Already an admin? "}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
                                disabled={isLoading}
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-xs text-slate-500">
                    This portal is for project owners only. Actions are logged.
                </p>
            </div>
        </div>
    );
}
