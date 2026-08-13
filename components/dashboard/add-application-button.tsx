'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { AddApplicationDialog } from './add-application-dialog'

interface AddApplicationButtonProps {
	variant?: 'default'|'quick-action'
	onApplicationAdded?: () => Promise<void>
	/** Controlled open state, so a keyboard shortcut can raise the dialog. */
	open?: boolean
	onOpenChange?: ( open: boolean ) => void
	label?: string
	shortcut?: string
}

export function AddApplicationButton ( {
	variant='default',
	onApplicationAdded,
	open,
	onOpenChange,
	label,
	shortcut,
}: AddApplicationButtonProps ) {
	const [ internalOpen,setInternalOpen ]=useState( false )

	const isControlled=open!==undefined
	const isDialogOpen=isControlled? open:internalOpen
	const setDialogOpen=( next: boolean ) => {
		if ( !isControlled ) setInternalOpen( next )
		onOpenChange?.( next )
	}

	return (
		<>
			<Button
				onClick={() => setDialogOpen( true )}
				className={variant==='quick-action'? 'w-full':undefined}
				shortcut={shortcut}
			>
				{label??( variant==='quick-action'? 'add new application':'+ new' )}
			</Button>

			<AddApplicationDialog
				open={isDialogOpen}
				onOpenChange={setDialogOpen}
				onApplicationAdded={onApplicationAdded}
			/>
		</>
	)
}
