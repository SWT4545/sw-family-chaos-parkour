import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getDatabase, type Database } from 'firebase/database'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const rawCfg = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
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
