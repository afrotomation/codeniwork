'use client'

import type { JobApplication } from '@/lib/applications'
import { useSession } from 'next-auth/react'
import { useCallback,useEffect,useState } from 'react'

/**
 * The console's single read of the pipeline. Every projection on a screen —
 * stats strip, action queue, table, month grid — is derived from this one
 * array, so a refresh moves all of them together.
 */
export function useApplications () {
	const { data: session,status }=useSession()
	const userId=session?.user?.id

	const [ applications,setApplications ]=useState<JobApplication[]>( [] )
	const [ isLoading,setIsLoading ]=useState( true )
	const [ error,setError ]=useState<string|null>( null )

	const refresh=useCallback( async () => {
		if ( !userId ) return

		try {
			const response=await fetch( '/api/dashboard/applications' )
			if ( !response.ok ) throw new Error( 'Failed to fetch applications' )
			setApplications( await response.json() )
			setError( null )
		} catch ( err ) {
			console.error( 'Error fetching job applications:',err )
			setError( 'could not load applications' )
		}
	},[ userId ] )

	useEffect( () => {
		if ( status==='loading' ) return

		if ( !userId ) {
			setIsLoading( false )
			return
		}

		let cancelled=false
		setIsLoading( true )
		refresh().finally( () => {
			if ( !cancelled ) setIsLoading( false )
		} )

		return () => {
			cancelled=true
		}
	},[ userId,status,refresh ] )

	return { applications,isLoading,error,refresh }
}
