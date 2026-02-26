import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export interface FirebaseUserProfile {
  name?: string;
  tenant_id?: string;
  roles_names?: string[];
  permissions_names?: string[];
  created_at?: string;
  updated_at?: string;
}

export const getFirebaseUserProfile = async (uid: string): Promise<FirebaseUserProfile | null> => {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as FirebaseUserProfile;
};

export const upsertFirebaseUserProfile = async (
  uid: string,
  profile: FirebaseUserProfile
): Promise<void> => {
  await setDoc(
    doc(db, 'users', uid),
    {
      ...profile,
      updated_at: new Date().toISOString(),
      created_at: profile.created_at || new Date().toISOString(),
    },
    { merge: true }
  );
};
