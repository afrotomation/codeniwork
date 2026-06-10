'use client'

import { createAuthClient } from 'better-auth/react'

// Same-origin on purpose: the local /api/auth proxy makes auth requests
// first-party so Better Auth's SameSite=Lax cookies always ride along.
export const authClient=createAuthClient( {
	baseURL:
		typeof window!=='undefined'
			? window.location.origin
			: process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000',
} )

export const { useSession,signIn,signOut,signUp }=authClient
