import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/** The only pages reachable without a session. */
const AUTH_PREFIX='/auth/'

/**
 * Session cookies as issued by next-auth v5 (`authjs.*`; the `__Secure-`
 * prefix appears once cookies are marked secure, i.e. over https). The CSRF
 * cookie is deliberately not in this list — it is set for anonymous visitors
 * the moment they load the sign-in page, so treating it as proof of a session
 * would wave them straight through.
 */
const SESSION_COOKIES=[
	'authjs.session-token',
	'__Secure-authjs.session-token',
]

export function proxy ( request: NextRequest ) {
	const path=request.nextUrl.pathname

	// '/' is matched exactly: every pathname starts with it, so a prefix test
	// here would make the whole app public.
	const isPublicPath=path==='/'||path.startsWith( AUTH_PREFIX )

	const hasSession=SESSION_COOKIES.some( name => request.cookies.has( name ) )

	if ( isPublicPath ) {
		// Someone already signed in has no use for the auth pages.
		if ( hasSession&&path.startsWith( AUTH_PREFIX ) ) {
			return NextResponse.redirect( new URL( '/dashboard',request.url ) )
		}
		return NextResponse.next()
	}

	if ( !hasSession ) {
		const signinUrl=new URL( '/auth/signin',request.url )
		signinUrl.searchParams.set( 'callbackUrl',path )
		return NextResponse.redirect( signinUrl )
	}

	return NextResponse.next()
}

export const config={
	matcher: [
		/*
		 * Every path except:
		 * - api      — route handlers, which check the session themselves
		 * - a/       — the analytics rewrite in next.config.ts
		 * - _next    — build output and the image optimizer
		 * - anything containing a dot — files under public/ (favicon.svg,
		 *   robots.txt, sitemap.xml, manifest.json, assets/*). These must stay
		 *   reachable without a session or crawlers and the landing page's own
		 *   icons get redirected to the sign-in screen.
		 */
		'/((?!api|a/|_next|.*\\..*).*)',
	],
}
