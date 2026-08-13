'use client'

import { useCallback,useEffect,useState } from 'react'

export type Theme='light'|'dark'

const STORAGE_KEY='codeniwork-theme'

function systemTheme (): Theme {
	return window.matchMedia( '(prefers-color-scheme: dark)' ).matches? 'dark':'light'
}

/**
 * Theme is unset until the user picks a side — until then the stylesheet's
 * prefers-color-scheme block decides, and the inline script in the root layout
 * applies any stored choice before first paint.
 */
export function useTheme () {
	const [ theme,setTheme ]=useState<Theme|null>( null )

	useEffect( () => {
		const stored=window.localStorage.getItem( STORAGE_KEY )
		setTheme( stored==='dark'||stored==='light'? stored:systemTheme() )
	},[] )

	const toggle=useCallback( () => {
		setTheme( current => {
			const next: Theme=( current??systemTheme() )==='dark'? 'light':'dark'
			document.documentElement.setAttribute( 'data-theme',next )
			try {
				window.localStorage.setItem( STORAGE_KEY,next )
			} catch {
				// Private mode — the choice just will not survive the session.
			}
			return next
		} )
	},[] )

	return { theme,toggle }
}
