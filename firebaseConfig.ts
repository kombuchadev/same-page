import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyACq0IKGAm_obtL5Bo_KE3OrnGy9n7qMzs',
  authDomain: 'same-page-76ee6.firebaseapp.com',
  databaseURL: 'https://same-page-76ee6-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'same-page-76ee6',
  storageBucket: 'same-page-76ee6.firebasestorage.app',
  messagingSenderId: '367318415409',
  appId: '1:367318415409:web:e0a098632bb48923433d10',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Use session persistence so each browser tab gets its own unique anonymous UID.
// Without this, all tabs in the same browser share the same UID via localStorage,
// which causes all tabs to overwrite each other's player entry in the same room.
setPersistence(auth, browserSessionPersistence).catch(console.error);

export async function ensureAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user.uid);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user.uid);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}
