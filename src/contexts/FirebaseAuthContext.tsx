import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface Profile {
  businessName: string;
  userName?: string; // New field
  phone?: string;    // New field
  email: string;
  plan: 'free' | 'paid';
  role: 'admin' | 'business';
  status: 'enabled' | 'disabled';
  canCreateOrders: boolean;
  createdAt: Date;
  businessAddress?: string; // New field
  businessUrl?: string; // New field
  socialLinks?: {           // New field
    whatsapp?: string;
    facebook?: string;
    youtube?: string;
  };
}

interface FirebaseAuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, businessName: string, phone: string, userName?: string) => Promise<{ error: Error | null }>;
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Set up real-time listener for profile
        const docRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profileData = {
              businessName: data.businessName,
              userName: data.userName,
              phone: data.phone,
              email: data.email,
              plan: data.plan,
              role: data.role || 'business',
              status: data.status || 'enabled',
              canCreateOrders: data.canCreateOrders ?? true,
              createdAt: data.createdAt?.toDate() || new Date(),
              businessAddress: data.businessAddress,
              businessUrl: data.businessUrl,
              socialLinks: data.socialLinks,
            } as Profile;

            if (profileData.status === 'disabled') {
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
        }, (error) => {
          console.error("Error listening to profile:", error);
          setLoading(false);
        });

      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, businessName: string, phone: string, userName: string = '') => {
    try {
      // Check if phone number already exists
      const phoneQuery = query(collection(db, 'users'), where('phone', '==', phone));
      const phoneSnapshot = await getDocs(phoneQuery);

      if (!phoneSnapshot.empty) {
        return { error: new Error('Phone number already exists') };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const newProfile = {
        businessName,
        userName,
        phone,
        email,
        plan: 'free',
        role: 'business',
        status: 'enabled',
        canCreateOrders: false,
        createdAt: new Date(),
        businessAddress: '',
        businessUrl: '',
        socialLinks: {
          whatsapp: '',
          facebook: '',
          youtube: ''
        }
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
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return { error: new Error('Email already exists') };
      }
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
      // Check if disabled immediately
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
