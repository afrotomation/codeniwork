/**
 * Compatibility surface for `import { auth } from '@/lib/auth'` call
 * sites. auth() now validates the CodeniServer SSO session (Path D
 * proxy) and aliases user.id to the LOCAL users.id so every Drizzle FK
 * query keeps working unchanged.
 */

import { getServerSession } from './server'
import { type AppUser,getOrCreateAppUser } from '../user-sync'

export { getServerSession } from './server'

export type LocalSession={
	user: {
		id: string
		email: string
		name: string|null
		image: string|null
	}
}

export async function getAuthenticatedUser (): Promise<
	{ session: LocalSession; appUser: AppUser }|null
> {
	const session=await getServerSession()
	if ( !session?.user ) return null

	const appUser=await getOrCreateAppUser( {
		id: session.user.id,
		email: session.user.email,
		name: session.user.name??null,
		image: session.user.image,
	} )

	return {
		session: {
			user: {
				id: appUser.id,
				email: appUser.email,
				name: appUser.name,
				image: appUser.image,
			},
		},
		appUser,
	}
}

export async function auth (): Promise<LocalSession|null> {
	const result=await getAuthenticatedUser()
	return result?.session??null
}
