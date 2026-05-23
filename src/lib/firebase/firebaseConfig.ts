import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getDatabase, type Database } from 'firebase/database'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const rawCfg = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? 'AIzaSyCDD0IyodPYrUMV6jawhyGGwzjqQJkwbmE',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? 'sw-family-chaos.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? 'sw-family-chaos',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? 'sw-family-chaos.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '674780747215',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? '1:674780747215:web:f688090c5118c1290eaeba',
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL       ?? 'https://sw-family-chaos-default-rtdb.firebaseio.com',
}

export function isFirebaseConfigured(): boolean {
  return !!(rawCfg.apiKey && rawCfg.projectId)
}

let _app:     FirebaseApp      | null = null
let _db:      Firestore        | null = null
let _rtdb:    Database         | null = null
let _storage: FirebaseStorage  | null = null

function getApp(): FirebaseApp | null {
  if (!isFirebaseConfigured() || typeof window === 'undefined') return null
  if (!_app) {
    const cfg = rawCfg as FirebaseOptions
    _app = getApps().length ? getApps()[0] : initializeApp(cfg)
  }
  return _app
}

export function getDb(): Firestore | null {
  const app = getApp()
  if (!app) return null
  if (!_db) _db = getFirestore(app)
  return _db
}

export function getRtdb(): Database | null {
  const app = getApp()
  if (!app || !rawCfg.databaseURL) return null
  if (!_rtdb) _rtdb = getDatabase(app)
  return _rtdb
}

export function getStorageInstance(): FirebaseStorage | null {
  const app = getApp()
  if (!app) return null
  if (!_storage) _storage = getStorage(app)
  return _storage
}
