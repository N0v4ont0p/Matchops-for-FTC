import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyBZy64l5uAnNhlu0tzhFwlLw43T0yCoEHQ',
  authDomain: 'matchops.firebaseapp.com',
  projectId: 'matchops',
  storageBucket: 'matchops.firebasestorage.app',
  messagingSenderId: '818730128250',
  appId: '1:818730128250:web:ab59b9bbbd843e7022bcc3',
  measurementId: 'G-J77DSCREQ3',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Analytics only in production browser context
let analytics: ReturnType<typeof getAnalytics> | null = null
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app)
  }
} catch {
  // Analytics not critical
}
export { analytics }

export default app
