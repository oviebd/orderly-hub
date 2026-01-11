import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface Profile {
  userId?: string;
  businessName: string;
  userName?: string;
  phone?: string;
  email: string;
  plan: 'free' | 'paid';
  role: 'admin' | 'business';
  status: 'enabled' | 'disabled';
  canCreateOrders: boolean;
  createdAt: Date;
  businessAddress?: string;
  businessUrl?: string;
  socialLinks?: {
    whatsapp?: string;
    facebook?: string;
    youtube?: string;
  };
  onboardingRequired?: boolean;
}

interface FirebaseAuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  registerBusiness: (businessName: string, phone: string, userName?: string) => Promise<{ error: Error | null }>;
  adminSignUp: (email: string, password: string, businessName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeBusiness: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        setLoading(true);
        // 1. Listen to 'users' collection for basic role/status
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(userDocRef, async (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();

            if (userData.status === 'disabled') {
              await firebaseSignOut(auth);
              setProfile(null);
              setUser(null);
              setLoading(false);
              return;
            }

            if (userData.role === 'admin') {
              // Admin profile is fully in 'users'
              setProfile({
                ...userData,
                createdAt: userData.createdAt?.toDate() || new Date(),
              } as Profile);
              setLoading(false);
            } else {
              // Business User: Check 'BusinessAccounts' for full profile
              if (!user.email) {
                setLoading(false);
                return;
              }

              const businessDocRef = doc(db, 'BusinessAccounts', user.email);

              if (unsubscribeBusiness) unsubscribeBusiness();

              unsubscribeBusiness = onSnapshot(businessDocRef, (businessSnap) => {
                if (businessSnap.exists()) {
                  const businessData = businessSnap.data();
                  const userProfile = businessData.profile || {};
                  const businessProfile = businessData.business || {};

                  // Merge separate nodes into one Profile object for the app context
                  setProfile({
                    ...userProfile,
                    ...businessProfile,
                    userId: user.uid,
                    email: user.email!,
                    role: 'business',
                    status: userData.status || 'enabled',
                    canCreateOrders: userData.canCreateOrders ?? true,
                    createdAt: userProfile.createdAt?.toDate() || new Date(),
                    onboardingRequired: false
                  } as Profile);
                } else {
                  // User exists but Business Account doesn't -> Onboarding needed
                  setProfile({
                    email: user.email!,
                    role: 'business',
                    status: 'enabled',
                    canCreateOrders: false,
                    plan: 'free',
                    businessName: '',
                    createdAt: new Date(),
                    onboardingRequired: true
                  });
                }
                setLoading(false);
              });
            }
          } else {
            setProfile(null);
            setLoading(false);
          }
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });

      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        if (unsubscribeBusiness) {
          unsubscribeBusiness();
          unsubscribeBusiness = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeBusiness) unsubscribeBusiness();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Create minimal user entry
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        role: 'business',
        status: 'enabled',
        createdAt: new Date(),
      });

      return { error: null };
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return { error: new Error('Email already exists') };
      }
      return { error: error as Error };
    }
  };

  const registerBusiness = async (businessName: string, phone: string, userName: string = '') => {
    if (!user || !user.email) return { error: new Error("No authenticated user found") };

    try {
      const userProfile = {
        userId: user.uid,
        userName,
        phone, // User's personal phone
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newBusiness = {
        businessName,
        phone, // Business phone
        businessAddress: '',
        businessUrl: '',
        socialLinks: {
          whatsapp: '',
          facebook: '',
          youtube: ''
        },
        plan: 'free',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'BusinessAccounts', user.email), {
        profile: userProfile,
        businesses: [newBusiness] // Store full details in array
      });

      // Update basic user info if needed
      await setDoc(doc(db, 'users', user.uid), {
        phone,
        userName
      }, { merge: true });

      return { error: null };

    } catch (error) {
      return { error: error as Error };
    }
  }

  const adminSignUp = async (email: string, password: string, businessName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const newProfile = {
        businessName,
        email,
        plan: 'paid',
        role: 'admin',
        status: 'enabled',
        canCreateOrders: true,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newProfile,
      });

      setProfile(newProfile as Profile);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const docRef = doc(db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'disabled') {
          await firebaseSignOut(auth);
          return { error: new Error('Your account has been disabled. Please contact the administrator.') };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        registerBusiness,
        adminSignUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
