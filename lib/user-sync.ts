/**
 * CodeniServer SSO -> local users mirror (email-shim pattern).
 * Existing rows are returned AS-IS; the local uuid anchors every FK
 * (applications, documents, companies, activity), so it is never
 * rewritten. Callers alias session.user.id -> local row id.
 */

import { eq,sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export interface SsoUser {
	id: string
	email: string
	name: string|null
	image?: string|null
}

export type AppUser=typeof users.$inferSelect

export async function getOrCreateAppUser ( ssoUser: SsoUser ): Promise<AppUser> {
	// 1. Match by codeniserver UUID
	const [ byAuthId ]=await db
		.select()
		.from( users )
		.where( eq( users.externalId,ssoUser.id ) )
		.limit( 1 )
	if ( byAuthId ) return byAuthId

	// 2. Fall back to email — links legacy rows without touching their id.
	const [ byEmail ]=await db
		.select()
		.from( users )
		.where( sql`LOWER( ${users.email} ) = LOWER( ${ssoUser.email} )` )
		.limit( 1 )
	if ( byEmail ) {
		await db
			.update( users )
			.set( {
				externalId: ssoUser.id,
				name: byEmail.name??ssoUser.name,
				image: byEmail.image??ssoUser.image??null,
				updatedAt: new Date(),
			} )
			.where( eq( users.id,byEmail.id ) )
		return { ...byEmail,externalId: ssoUser.id }
	}

	// 3. Genuinely new user
	const [ inserted ]=await db
		.insert( users )
		.values( {
			externalId: ssoUser.id,
			email: ssoUser.email,
			name: ssoUser.name,
			image: ssoUser.image??null,
		} )
		.returning()
	if ( !inserted ) {
		throw new Error( 'Failed to provision app user row' )
	}
	return inserted
}
