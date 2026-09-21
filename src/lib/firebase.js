import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// Initialize Firestore (Keeping your long polling config for stability)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
})

const CANVASES = 'canvases'

/**
 * Creates a new canvas document in Firestore and returns its ID.
 * We pre-generate the doc ID client-side via doc(collection(...)) so the
 * same ID can be used in the URL immediately.
 */
export async function createCanvas() {
  const ref = doc(collection(db, CANVASES))
  await setDoc(ref, {
    json: JSON.stringify({ version: '6.6.1', objects: [] }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getCanvas(canvasId) {
  const snap = await getDoc(doc(db, CANVASES, canvasId))
  if (!snap.exists()) return null
  return snap.data()
}

export async function saveCanvas(canvasId, json) {
  // setDoc with merge:false is a full replace — atomic, cheap (1 field write),
  // and keeps the doc well under the 1 MiB limit by storing one string.
  await setDoc(
    doc(db, CANVASES, canvasId),
    { json, updatedAt: serverTimestamp() },
    { merge: true },
  )
}