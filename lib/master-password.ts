/**
 * Master-password storage + verification (E2E document encryption — a
 * separate secret from login auth, which lives on CodeniServer).
 * Extracted unchanged from the deleted lib/passkey-auth.ts.
 */

import crypto from 'crypto'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

// Generate salt
function generateSalt (): string {
	return crypto.randomBytes( 32 ).toString( 'hex' )
}

// Hash master password — MUST stay pbkdf2-sha512/64-byte to keep verifying
// hashes stored before the SSO migration.
function hashMasterPassword ( masterPassword: string,salt: string ): Promise<string> {
	return new Promise( ( resolve,reject ) => {
		crypto.pbkdf2( masterPassword,salt,100000,64,'sha512',( err,derivedKey ) => {
			if ( err ) reject( err )
			else resolve( derivedKey.toString( 'hex' ) )
		} )
	} )
}

// Derive the document-encryption key from the master password
export function deriveEncryptionKey ( masterPassword: string,salt: string ): Promise<Buffer> {
	return new Promise( ( resolve,reject ) => {
		crypto.pbkdf2( masterPassword,salt,100000,32,'sha256',( err,derivedKey ) => {
			if ( err ) reject( err )
			else resolve( derivedKey )
		} )
	} )
}

export async function storeMasterPassword ( userId: string,masterPassword: string ): Promise<void> {
	const salt=generateSalt()
	const encryptionSalt=generateSalt()
	const hashedPassword=await hashMasterPassword( masterPassword,salt )

	await db
		.update( users )
		.set( {
			masterPasswordHash: hashedPassword,
			masterPasswordSalt: salt,
			encryptionKeyDerivationSalt: encryptionSalt,
		} )
		.where( eq( users.id,userId ) )
}

// Verify master password
export async function verifyMasterPassword ( userId: string,masterPassword: string ): Promise<boolean> {
	const [ user ]=await db
		.select()
		.from( users )
		.where( eq( users.id,userId ) )
		.limit( 1 )

	if ( !user?.masterPasswordHash||!user.masterPasswordSalt ) {
		return false
	}

	const hashedPassword=await hashMasterPassword( masterPassword,user.masterPasswordSalt )
	return hashedPassword===user.masterPasswordHash
}

// Get encryption key for user
export async function getUserEncryptionKey ( userId: string,masterPassword: string ): Promise<Buffer|null> {
	const [ user ]=await db
		.select()
		.from( users )
		.where( eq( users.id,userId ) )
		.limit( 1 )

	if ( !user?.encryptionKeyDerivationSalt ) {
		return null
	}

	return deriveEncryptionKey( masterPassword,user.encryptionKeyDerivationSalt )
}
