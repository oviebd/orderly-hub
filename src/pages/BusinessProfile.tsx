import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, User as UserIcon, Building2, MapPin, Youtube, Facebook, Phone, Mail, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
            </div>
        </DashboardLayout>
    );
}
