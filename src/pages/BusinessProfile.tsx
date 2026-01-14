import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, User as UserIcon, Building2, MapPin, Youtube, Facebook, Phone, Mail, Link, Package, Zap, Crown, Gem, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebasePlans } from '@/hooks/useFirebasePlans';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function BusinessProfile() {
    const { user, profile, loading: authLoading, signOut } = useFirebaseAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [userName, setUserName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [businessUrl, setBusinessUrl] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [facebook, setFacebook] = useState('');
    const [youtube, setYoutube] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const { plans, loading: plansLoading } = useFirebasePlans();

    // Initialize form with profile data
    useEffect(() => {
        if (profile) {
            setUserName(profile.userName || '');
            setBusinessName(profile.businessName || '');
            setBusinessUrl(profile.businessUrl || '');
            setBusinessAddress(profile.businessAddress || '');
            setWhatsapp(profile.socialLinks?.whatsapp || '');
            setFacebook(profile.socialLinks?.facebook || '');
            setYoutube(profile.socialLinks?.youtube || '');
        }
    }, [profile]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        try {
            // 1. Update Firestore Profile
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                userName,
                businessName,
                businessUrl,
                businessAddress,
                socialLinks: {
                    whatsapp,
                    facebook,
                    youtube,
                },
            });

            // 2. Update Password if provided
            if (newPassword) {
                if (!currentPassword) {
                    throw new Error("Current password is required to set a new password.");
                }
                if (newPassword.length < 6) {
                    throw new Error("New password must be at least 6 characters.");
                }

                // Re-authenticate user
                const credential = EmailAuthProvider.credential(user.email!, currentPassword);
                await reauthenticateWithCredential(user, credential);

                await updatePassword(user, newPassword);
            }

            toast({
                title: 'Profile Updated',
                description: 'Your business profile has been updated successfully.',
            });
            setIsEditing(false);
            setNewPassword(''); // Clear password field
            setCurrentPassword('');
        } catch (error: any) {
            console.error(error);
            let message = 'Failed to update profile.';
            if (error.code === 'auth/requires-recent-login') {
                message = 'Please log out and log in again to change your password.';
            } else if (error.message) {
                message = error.message;
            }

            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePlan = async () => {
        if (!user || !user.email || !selectedPlanId) return;

        setIsSaving(true);
        try {
            const selectedPlan = plans.find(p => p.id === selectedPlanId);
            if (!selectedPlan) {
                throw new Error('Selected plan not found');
            }

            const businessAccountRef = doc(db, 'BusinessAccounts', user.email);
            await updateDoc(businessAccountRef, {
                businessPlan: {
                    name: selectedPlan.name,
                    price: selectedPlan.price,
                    currency: 'BDT'
                },
                capabilities: selectedPlan.capabilities
            });

            toast({
                title: 'Plan Updated',
                description: `Your plan has been updated to ${selectedPlan.name} successfully.`,
            });

            setIsPlanDialogOpen(false);
            setSelectedPlanId(null);
        } catch (error: any) {
            console.error('Error updating plan:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update plan.',
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
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
                        <p className="text-muted-foreground">Manage your account settings and business details</p>
                    </div>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                        <CardDescription>View and update your business information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Read-Only Identity Fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Email Address</Label>
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{profile?.email}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Phone Number</Label>
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{profile?.phone || 'Not set'}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Phone number cannot be changed.</p>
                                </div>
                            </div>

                            <div className="border-t pt-4"></div>

                            {/* Editable Fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="userName">User Name</Label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="userName"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            className="pl-9"
                                            disabled={!isEditing || isSaving}
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Business Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="businessName"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            className="pl-9"
                                            disabled={!isEditing || isSaving}
                                            placeholder="Business Name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessUrl">Business URL</Label>
                                    <div className="relative">
                                        <Link className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="businessUrl"
                                            value={businessUrl}
                                            onChange={(e) => setBusinessUrl(e.target.value)}
                                            className="pl-9"
                                            disabled={!isEditing || isSaving}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="businessAddress">Business Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="businessAddress"
                                            value={businessAddress}
                                            onChange={(e) => setBusinessAddress(e.target.value)}
                                            className="pl-9"
                                            disabled={!isEditing || isSaving}
                                            placeholder="Full Business Address"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-medium mb-4">Social Media Links</h3>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp">WhatsApp</Label>
                                        <Input
                                            id="whatsapp"
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value)}
                                            disabled={!isEditing || isSaving}
                                            placeholder="WhatsApp Number/Link"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="facebook">Facebook</Label>
                                        <div className="relative">
                                            <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="facebook"
                                                value={facebook}
                                                onChange={(e) => setFacebook(e.target.value)}
                                                className="pl-9"
                                                disabled={!isEditing || isSaving}
                                                placeholder="Facebook Profile Link"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="youtube">YouTube</Label>
                                        <div className="relative">
                                            <Youtube className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="youtube"
                                                value={youtube}
                                                onChange={(e) => setYoutube(e.target.value)}
                                                className="pl-9"
                                                disabled={!isEditing || isSaving}
                                                placeholder="YouTube Channel Link"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Plan & Subscription Section */}
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium">Plan & Subscription</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsPlanDialogOpen(true)}
                                        disabled={plansLoading}
                                    >
                                        <Package className="h-4 w-4 mr-2" />
                                        Update Plan
                                    </Button>
                                </div>

                                {profile?.businessPlan ? (
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 rounded-lg border">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-2">
                                                    {profile.businessPlan.name === 'Elite' && <Gem className="h-5 w-5 text-purple-600" />}
                                                    {profile.businessPlan.name === 'Gold' && <Crown className="h-5 w-5 text-amber-600" />}
                                                    {profile.businessPlan.name === 'Silver' && <Zap className="h-5 w-5 text-slate-600 fill-current" />}
                                                    {profile.businessPlan.name === 'Lite' && <Zap className="h-5 w-5 text-blue-600" />}
                                                    <Badge variant="outline" className={`font-medium ${profile.businessPlan.name === 'Elite' ? 'text-purple-600 border-purple-200 bg-purple-50' :
                                                        profile.businessPlan.name === 'Gold' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                                            profile.businessPlan.name === 'Silver' ? 'text-slate-600 border-slate-300 bg-slate-100' :
                                                                'text-blue-600 border-blue-200 bg-blue-50'
                                                        }`}>
                                                        {profile.businessPlan.name} Plan
                                                    </Badge>
                                                </div>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                    ৳{profile.businessPlan.price.toLocaleString()}
                                                    <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
                                                </p>
                                                {profile.capabilities && (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-xs">
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Check className="h-3 w-3 text-green-600" />
                                                            {profile.capabilities.maxOrderNumber === 999999 ? 'Unlimited' : profile.capabilities.maxOrderNumber} Orders
                                                        </div>
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Check className="h-3 w-3 text-green-600" />
                                                            {profile.capabilities.maxCustomerNumber === 999999 ? 'Unlimited' : profile.capabilities.maxCustomerNumber} Customers
                                                        </div>
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Check className="h-3 w-3 text-green-600" />
                                                            {profile.capabilities.maxProductNumber === 999999 ? 'Unlimited' : profile.capabilities.maxProductNumber} Products
                                                        </div>
                                                        <div className={`flex items-center gap-1 ${profile.capabilities.hasExportImportOption ? 'text-muted-foreground' : 'text-red-600'}`}>
                                                            {profile.capabilities.hasExportImportOption ? (
                                                                <Check className="h-3 w-3 text-green-600" />
                                                            ) : (
                                                                <span className="h-3 w-3 text-red-600 font-bold">✕</span>
                                                            )}
                                                            Import/Export
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No plan information available</p>
                                )}
                            </div>

                            {isEditing && (
                                <div className="border-t pt-4 bg-muted/20 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium mb-2 text-destructive">Security</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password (Required to change password)</Label>
                                            <Input
                                                id="currentPassword"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                disabled={isSaving}
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                disabled={isSaving}
                                                placeholder="Leave blank to keep current password"
                                                minLength={6}
                                            />
                                            <p className="text-xs text-muted-foreground">Changing your password may require you to log in again.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => {
                                        setIsEditing(false);
                                        // Reset form to profile data
                                        if (profile) {
                                            setUserName(profile.userName || '');
                                            setBusinessName(profile.businessName || '');
                                            setBusinessUrl(profile.businessUrl || '');
                                            setBusinessAddress(profile.businessAddress || '');
                                            setWhatsapp(profile.socialLinks?.whatsapp || '');
                                            setFacebook(profile.socialLinks?.facebook || '');
                                            setYoutube(profile.socialLinks?.youtube || '');
                                            setNewPassword('');
                                            setCurrentPassword('');
                                        }
                                    }} disabled={isSaving}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Plan Selection Dialog */}
                <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Choose Your Plan</DialogTitle>
                            <DialogDescription>
                                Select a plan that fits your business needs. You can upgrade or downgrade at any time.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 md:grid-cols-2 py-4">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${selectedPlanId === plan.id
                                        ? 'border-primary shadow-md ring-2 ring-primary'
                                        : profile?.businessPlan?.name === plan.name
                                            ? 'border-green-500 bg-green-50/50'
                                            : 'border-slate-200'
                                        }`}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            {plan.name === 'Elite' && <Gem className="h-6 w-6 text-purple-600" />}
                                            {plan.name === 'Gold' && <Crown className="h-6 w-6 text-amber-600" />}
                                            {plan.name === 'Silver' && <Zap className="h-6 w-6 text-slate-600 fill-current" />}
                                            {plan.name === 'Lite' && <Zap className="h-6 w-6 text-blue-600" />}
                                            <h3 className="text-xl font-bold">{plan.name}</h3>
                                        </div>
                                        {profile?.businessPlan?.name === plan.name && (
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                Current Plan
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-3xl font-bold mb-1">
                                        ৳{plan.price.toLocaleString()}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
                                    </p>

                                    <div className="space-y-2 mt-4 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span>
                                                {plan.capabilities.maxOrderNumber === 999999 ? 'Unlimited' : plan.capabilities.maxOrderNumber.toLocaleString()} Orders
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span>
                                                {plan.capabilities.maxCustomerNumber === 999999 ? 'Unlimited' : plan.capabilities.maxCustomerNumber.toLocaleString()} Customers
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span>
                                                {plan.capabilities.maxProductNumber === 999999 ? 'Unlimited' : plan.capabilities.maxProductNumber.toLocaleString()} Products
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${plan.capabilities.hasExportImportOption ? 'text-muted-foreground' : 'text-red-600'}`}>
                                            {plan.capabilities.hasExportImportOption ? (
                                                <Check className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <span className="h-4 w-4 text-red-600 font-bold flex items-center justify-center">✕</span>
                                            )}
                                            <span>Import/Export Data</span>
                                        </div>
                                    </div>
                                </div>
                            ))}</div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsPlanDialogOpen(false);
                                    setSelectedPlanId(null);
                                }}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdatePlan}
                                disabled={!selectedPlanId || isSaving || selectedPlanId === profile?.businessPlan?.name}
                            >
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Plan
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
