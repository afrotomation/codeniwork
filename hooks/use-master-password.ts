'use client'

import { useCallback,useState } from 'react'

/**
 * Master-password client helpers (E2E document encryption — separate from
 * login auth, which lives on CodeniServer). Extracted from the deleted
 * use-passkey-auth hook; the /api/auth/master-password/* routes
 * authenticate via the CodeniServer session.
 */
export function useMasterPassword () {
	const [ isLoading,setIsLoading ]=useState( false )
	const [ error,setError ]=useState<string|null>( null )

	const setupMasterPassword=useCallback( async ( masterPassword: string ) => {
		setIsLoading( true )
		setError( null )

		try {
			const response=await fetch( '/api/auth/master-password/setup',{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { masterPassword } ),
			} )

			if ( !response.ok ) {
				throw new Error( 'Failed to setup master password' )
			}

			return await response.json()
		} catch ( err ) {
			const errorMessage=err instanceof Error? err.message:'Master password setup failed'
			setError( errorMessage )
			throw new Error( errorMessage )
		} finally {
			setIsLoading( false )
		}
	},[] )

	const verifyMasterPassword=useCallback( async ( masterPassword: string ) => {
		setIsLoading( true )
		setError( null )

		try {
			const response=await fetch( '/api/auth/master-password/verify',{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { masterPassword } ),
			} )

			if ( !response.ok ) {
				throw new Error( 'Master password verification failed' )
			}

			return await response.json()
		} catch ( err ) {
			const errorMessage=err instanceof Error? err.message:'Master password verification failed'
			setError( errorMessage )
			throw new Error( errorMessage )
		} finally {
			setIsLoading( false )
		}
	},[] )

	return { setupMasterPassword,verifyMasterPassword,isLoading,error }
}
