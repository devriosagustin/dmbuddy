// ============================================================
// Inicialización del SDK de Firebase (Realtime Database)
// ============================================================

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from '../config/firebase';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getDatabase(app);