// ─── firebase.js ─────────────────────────────────────────────────────────────
// Replace the firebaseConfig values with your own project credentials from
// https://console.firebase.google.com → Project Settings → Your apps
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore }                    from 'firebase/firestore';
import { getAuth }                         from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

// Prevent re-initialization on hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
