import { createHash } from 'node:crypto'
import { headers } from 'next/headers'

// CodeniServer session validation through the /api/auth proxy, with
// in-flight dedupe + short TTL memo so one navigation's burst of API
// routes can't trip codeniserver's rate limiter (a 429 here looks like
// a random logout client-side).

const AUTH_BASE_URL=
	process.env.NEXT_PUBLIC_AUTH_URL||
	process.env.NEXT_PUBLIC_BETTER_AUTH_URL||
	'https://auth.afrotomation.com'

export type ServerSession={
	user: {
		id: string
		email: string
		name: string
		image?: string|null
		role?: string
	}
	session: {
		id: string
		expiresAt: string
	}
}

const POSITIVE_TTL_MS=8_000
const NEGATIVE_TTL_MS=2_000

interface CachedSession {
	session: ServerSession|null
	expiresAt: number
}

// SHA-256 of the cookie header — never hold raw session tokens in memory.
function cookieKey ( cookie: string ): string {
	return createHash( 'sha256' ).update( cookie ).digest( 'hex' )
}

const sessionCache=new Map<string,CachedSession>()
const inFlight=new Map<string,Promise<ServerSession|null>>()

function pruneIfNeeded (): void {
	if ( sessionCache.size<500 ) return
	const now=Date.now()
	for ( const [ k,v ] of sessionCache ) {
		if ( v.expiresAt<=now ) sessionCache.delete( k )
	}
}

async function fetchSession ( cookie: string ): Promise<ServerSession|null> {
	try {
		const res=await fetch( `${AUTH_BASE_URL}/api/auth/get-session`,{
			headers: { cookie },
			cache: 'no-store',
		} )
		if ( !res.ok ) return null
		const session=await res.json()
		if ( !session?.user ) return null
		return session as ServerSession
	} catch {
		return null
	}
}

export async function getServerSession (): Promise<ServerSession|null> {
	const headerStore=await headers()
	const cookie=headerStore.get( 'cookie' )||''
	if ( !cookie ) return null

	const key=cookieKey( cookie )
	const now=Date.now()

	const cached=sessionCache.get( key )
	if ( cached&&cached.expiresAt>now ) {
		return cached.session
	}

	const existing=inFlight.get( key )
	if ( existing ) return existing

	const promise=( async () => {
		try {
			const session=await fetchSession( cookie )
			sessionCache.set( key,{
				session,
				expiresAt: Date.now()+( session? POSITIVE_TTL_MS:NEGATIVE_TTL_MS ),
			} )
			pruneIfNeeded()
			return session
		} finally {
			inFlight.delete( key )
		}
	} )()

	inFlight.set( key,promise )
	return promise
}
