import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { create } from 'zustand'
import { firebaseAuth, firestore, secondaryFirebaseAuth } from '../lib/firebase'
import type { User } from '../types'

type AuthState = {
  user: User | null
  isReady: boolean
  isLoading: boolean
  error: string | null
  initialize: () => () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>
  sendUserPasswordReset: (email: string) => Promise<void>
  adminChangeUserPassword: (
    userId: string,
    email: string,
    currentPassword: string,
    nextPassword: string,
  ) => Promise<void>
}

function authMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : 'Something went wrong.'
  }

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'That email already has an account. Try signing in.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase Authentication.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'auth/configuration-not-found': 'Firebase Authentication is not configured for this project.',
    'auth/missing-password': 'Enter the current password for this account.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/requires-recent-login': 'Sign in again before changing the password.',
    'permission-denied': 'Firebase signed you in, but Firestore rules blocked the profile read/write.',
  }

  return messages[error.code] ?? error.message
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function getAppUser(id: string, email: string | null, name: string | null) {
  try {
    const snapshot = await getDoc(doc(firestore, 'users', id))

    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as User
    }
  } catch (error) {
    console.warn(authMessage(error))
  }

  const label = name || email || 'This account'
  throw new Error(`${label} is not approved for this workspace.`)
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isReady: false,
  isLoading: false,
  error: null,
  initialize: () =>
    onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, isReady: true })
        return
      }

      try {
        const appUser = await getAppUser(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName,
        )
        set({ user: appUser, isReady: true, error: null })
      } catch (error) {
        set({ user: null, isReady: true, error: authMessage(error) })
      }
    }),
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      )
      const appUser = await getAppUser(
        credential.user.uid,
        credential.user.email,
        credential.user.displayName,
      )
      set({ user: appUser, isLoading: false })
    } catch (error) {
      set({
        error: authMessage(error),
        isLoading: false,
      })
      throw error
    }
  },
  logout: async () => {
    await signOut(firebaseAuth)
    set({ user: null })
  },
  changePassword: async (currentPassword, nextPassword) => {
    const currentUser = firebaseAuth.currentUser
    const appUser = useAuthStore.getState().user

    if (!currentUser || !currentUser.email) {
      throw new Error('Sign in again before changing the password.')
    }

    set({ isLoading: true, error: null })

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      )
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, nextPassword)
      if (appUser?.mustChangePassword) {
        await updateDoc(doc(firestore, 'users', currentUser.uid), {
          mustChangePassword: false,
        })
        set((state) => ({
          user: state.user ? { ...state.user, mustChangePassword: false } : state.user,
          isLoading: false,
          error: null,
        }))
        return
      }
      set({ isLoading: false, error: null })
    } catch (error) {
      set({ error: authMessage(error), isLoading: false })
      throw error
    }
  },
  sendUserPasswordReset: async (email) => {
    await sendPasswordResetEmail(firebaseAuth, email)
  },
  adminChangeUserPassword: async (userId, email, currentPassword, nextPassword) => {
    const credential = await signInWithEmailAndPassword(
      secondaryFirebaseAuth,
      email,
      currentPassword,
    )

    try {
      await updatePassword(credential.user, nextPassword)
      await updateDoc(doc(firestore, 'users', userId), { mustChangePassword: true })
    } finally {
      await signOut(secondaryFirebaseAuth)
    }
  },
}))

export async function createManagedAuthUser(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(
    secondaryFirebaseAuth,
    email,
    password,
  )
  await updateProfile(credential.user, { displayName: name })
  await signOut(secondaryFirebaseAuth)

  return {
    id: credential.user.uid,
    email: credential.user.email ?? email,
    name,
    avatar: initials(name),
  }
}
