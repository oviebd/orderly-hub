import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface Profile {
  businessName: string;
  email: string;
  plan: 'free' | 'paid';
  role: 'admin' | 'business';
  status: 'enabled' | 'disabled';
  canCreateOrders: boolean;
  createdAt: Date;
}

interface FirebaseAuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error: Error | null }>;
  adminSignUp: (email: string, password: string, businessName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          businessName: data.businessName,
          email: data.email,
          plan: data.plan,
          role: data.role || 'business',
          status: data.status || 'enabled',
          canCreateOrders: data.canCreateOrders ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Profile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        const profileData = await fetchProfile(user.uid);
        if (profileData?.status === 'disabled') {
          await firebaseSignOut(auth);
          setProfile(null);
          setUser(null);
        } else {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, businessName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const newProfile = {
        businessName,
        email,
        plan: 'free',
        role: 'business',
        status: 'enabled',
        canCreateOrders: false,
        createdAt: new Date(),
      };

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newProfile,
        role: 'business',
        status: 'enabled',
        canCreateOrders: false,
      });

      setProfile(newProfile as Profile);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const adminSignUp = async (email: string, password: string, businessName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const newProfile = {
        businessName,
        email,
        plan: 'paid', // Admins are usually on a special plan or just the highest
        role: 'admin',
        status: 'enabled',
        canCreateOrders: true,
        createdAt: new Date(),
      };

      // Create admin profile in Firestore
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
      const profileData = await fetchProfile(userCredential.user.uid);

      if (profileData?.status === 'disabled') {
        await firebaseSignOut(auth);
        return { error: new Error('Your account has been disabled. Please contact the administrator.') };
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
