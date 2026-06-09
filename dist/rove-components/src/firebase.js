// ─── firebase.js ─────────────────────────────────────────────────────────────
// Replace the firebaseConfig values with your own project credentials from
// https://console.firebase.google.com → Project Settings → Your apps
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore }                    from 'firebase/firestore';
import { getAuth }                         from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyDm-vZtrXWiLEDOjAG_O5RB5zbeUQDg0xg',
  authDomain:        'studio-6455201864-cf8cb.firebaseapp.com',
  projectId:         'studio-6455201864-cf8cb',
  storageBucket:     'studio-6455201864-cf8cb.firebasestorage.app',
  messagingSenderId: '965652912843',
  appId:             '1:965652912843:web:70c06397a1b7d250d6994e',
};

// Prevent re-initialization on hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
