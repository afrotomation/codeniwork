'use client'

import { DocumentViewerModal } from '@/components/dashboard/document-viewer-modal'
import { EditDocumentDialog } from '@/components/dashboard/edit-document-dialog'
import { DashboardHeader } from '@/components/dashboard/header'
import { UploadDocumentDialog } from '@/components/dashboard/upload-document-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { formatShortDate } from '@/lib/applications'
import { cn } from '@/lib/utils'
import { useEffect,useMemo,useState } from 'react'

interface Document {
	id: string
	name: string
	type: string
	format: string
	size: string
	fileUrl: string
	description?: string
	status: string
	version: string
	createdAt: string
	updatedAt: string
}

/** Design column rhythm: name, type, format, size, version, updated, status. */
const COLUMNS='grid-cols-[1fr_132px_84px_80px_78px_96px_104px]'

const TYPE_FILTERS: { label: string; type: string|null }[]=[
	{ label: 'resumes',type: 'resume' },
	{ label: 'cover letters',type: 'cover_letter' },
	{ label: 'portfolios',type: 'portfolio' },
	{ label: 'certificates',type: 'certificate' },
	{ label: 'other',type: 'other' },
]

/** "248 KB" / "1.6 MB" → bytes, so the header can total them. */
function parseSize ( size: string|null|undefined ): number {
	if ( !size ) return 0
	const match=/^([\d.]+)\s*(B|KB|MB|GB)$/i.exec( size.trim() )
	if ( !match ) return 0
	const scale: Record<string,number>={ b: 1,kb: 1024,mb: 1024**2,gb: 1024**3 }
	return parseFloat( match[ 1 ] )*( scale[ match[ 2 ].toLowerCase() ]??1 )
}

function formatBytes ( bytes: number ): string {
	if ( bytes<1024 ) return `${Math.round( bytes )} B`
	if ( bytes<1024**2 ) return `${Math.round( bytes/1024 )} KB`
	return `${( bytes/1024**2 ).toFixed( 1 )} MB`
}

export default function DocumentsPage () {
	const { toast }=useToast()
	const [ documents,setDocuments ]=useState<Document[]>( [] )
	const [ isLoading,setIsLoading ]=useState( true )
	const [ filter,setFilter ]=useState<string|null>( null )
	const [ selectedId,setSelectedId ]=useState<string|null>( null )
	const [ isUploadOpen,setIsUploadOpen ]=useState( false )
	const [ viewing,setViewing ]=useState<Document|null>( null )
	const [ editing,setEditing ]=useState<Document|null>( null )

	useEffect( () => {
		fetchDocuments()
	},[] )

	const fetchDocuments=async () => {
		try {
			const response=await fetch( '/api/dashboard/documents' )
			if ( !response.ok ) throw new Error( 'Failed to fetch documents' )
			setDocuments( await response.json() )
		} catch ( error ) {
			console.error( 'Error fetching documents:',error )
			toast( {
				title: 'Error',
				description: 'Failed to fetch documents. Please try again.',
				variant: 'destructive',
			} )
		} finally {
			setIsLoading( false )
		}
	}

	const selected=documents.find( doc => doc.id===selectedId )??null

	// U uploads, V views the selected row.
	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( event.metaKey||event.ctrlKey||event.altKey ) return

			const target=event.target as HTMLElement|null
			if ( target?.isContentEditable ) return
			if ( target&&/^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) ) return

			if ( event.key==='u'||event.key==='U' ) {
				event.preventDefault()
				setIsUploadOpen( true )
			} else if ( ( event.key==='v'||event.key==='V' )&&selected ) {
				event.preventDefault()
				setViewing( selected )
			}
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[ selected ] )

	const handleDelete=async ( doc: Document ) => {
		if ( !confirm( `Are you sure you want to delete "${doc.name}"?` ) ) return

		try {
			const response=await fetch( `/api/dashboard/documents/${doc.id}`,{ method: 'DELETE' } )
			if ( !response.ok ) throw new Error( 'Failed to delete document' )

			toast( { title: 'Success!',description: 'Document deleted successfully.' } )
			if ( selectedId===doc.id ) setSelectedId( null )
			await fetchDocuments()
		} catch ( error ) {
			console.error( 'Error deleting document:',error )
			toast( {
				title: 'Error',
				description: 'Failed to delete document. Please try again.',
				variant: 'destructive',
			} )
		}
	}

	const handleDownload=async ( doc: Document ) => {
		try {
			const response=await fetch( doc.fileUrl )
			const blob=await response.blob()
			const url=window.URL.createObjectURL( blob )
			const anchor=window.document.createElement( 'a' )
			anchor.href=url
			anchor.download=doc.name
			window.document.body.appendChild( anchor )
			anchor.click()
			window.URL.revokeObjectURL( url )
			window.document.body.removeChild( anchor )
		} catch ( error ) {
			console.error( 'Error downloading document:',error )
			toast( {
				title: 'Download failed',
				description: 'Failed to download document. Please try again.',
				variant: 'destructive',
			} )
		}
	}

	const counts=useMemo( () => {
		const byType=documents.reduce( ( acc,doc ) => {
			acc[ doc.type ]=( acc[ doc.type ]||0 )+1
			return acc
		},{} as Record<string,number> )
		return {
			byType,
			archived: documents.filter( doc => doc.status==='archived' ).length,
		}
	},[ documents ] )

	const rows=useMemo( () => {
		if ( filter===null ) return documents
		if ( filter==='archived' ) return documents.filter( doc => doc.status==='archived' )
		return documents.filter( doc => doc.type===filter )
	},[ documents,filter ] )

	const totalBytes=documents.reduce( ( sum,doc ) => sum+parseSize( doc.size ),0 )

	return (
		<div>
			<DashboardHeader
				eyebrow="documents"
				title={
					isLoading
						? 'Loading documents'
						:`${documents.length} file${documents.length===1? '':'s'}, ${formatBytes( totalBytes )}`
				}
				align="end"
				action={
					<div className="flex gap-2.5">
						<Button variant="ghost" className="border border-br" onClick={fetchDocuments}>
							refresh
						</Button>
						<Button onClick={() => setIsUploadOpen( true )} shortcut="U">
							+ upload
						</Button>
					</div>
				}
			/>

			<div className="mt-6 flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => setFilter( null )}
					className={cn(
						'border px-3 py-[7px] text-[11.5px] transition-colors',
						filter===null? 'border-ac text-ac':'border-br text-dim hover:border-ac hover:text-ac'
					)}
				>
					all {documents.length}
				</button>
				{TYPE_FILTERS.filter( item => ( counts.byType[ item.type! ]??0 )>0 ).map( item => (
					<button
						key={item.type}
						type="button"
						onClick={() => setFilter( item.type )}
						className={cn(
							'border px-3 py-[7px] text-[11.5px] transition-colors',
							filter===item.type? 'border-ac text-ac':'border-br text-dim hover:border-ac hover:text-ac'
						)}
					>
						{item.label} {counts.byType[ item.type! ]}
					</button>
				) )}
				{counts.archived>0&&(
					<button
						type="button"
						onClick={() => setFilter( 'archived' )}
						className={cn(
							'border px-3 py-[7px] text-[11.5px] transition-colors',
							filter==='archived'? 'border-ac text-ac':'border-br text-dim hover:border-ac hover:text-ac'
						)}
					>
						archived {counts.archived}
					</button>
				)}
			</div>

			<div className={cn( 'label mt-[26px] grid border-b border-br pb-2.5',COLUMNS )}>
				<div>name</div>
				<div>type</div>
				<div>format</div>
				<div>size</div>
				<div>version</div>
				<div>updated</div>
				<div>status</div>
			</div>

			{isLoading? (
				Array.from( { length: 5 } ).map( ( _,i ) => (
					<div key={i} className={cn( 'row-rule grid items-center py-4',COLUMNS )}>
						<div className="skeleton h-4 w-2/3" />
						<div className="skeleton h-3 w-16" />
						<div className="skeleton h-3 w-10" />
						<div className="skeleton h-3 w-12" />
						<div className="skeleton h-3 w-8" />
						<div className="skeleton h-3 w-12" />
						<div className="skeleton h-3 w-12" />
					</div>
				) )
			):rows.length===0? (
				<div className="border-b border-br py-10 text-center text-[12.5px] text-dim">
					{documents.length===0
						? 'No documents yet. Upload a resume to start.'
						:'Nothing in that category.'}
				</div>
			):(
				rows.map( doc => {
					const isArchived=doc.status==='archived'
					return (
						<button
							key={doc.id}
							type="button"
							onClick={() => setSelectedId( doc.id )}
							onDoubleClick={() => setViewing( doc )}
							className={cn(
								'row-rule grid w-full items-center py-4 text-left text-[13px] transition-colors',
								COLUMNS,
								isArchived&&'opacity-50',
								selectedId===doc.id? 'bg-ft':'hover:bg-ft'
							)}
						>
							<div className="truncate pr-4">
								<span className="display text-[14px] text-fg">{doc.name}</span>
								{doc.description&&(
									<div className="mt-[5px] truncate text-[11.5px] text-dim">{doc.description}</div>
								)}
							</div>
							<div className="text-dim">{doc.type.replace( '_',' ' )}</div>
							<div className="text-dim">{doc.format}</div>
							<div className="text-dim">{doc.size||'—'}</div>
							<div className="text-fg">{doc.version}</div>
							<div className="text-dim">{formatShortDate( doc.updatedAt )}</div>
							<div className={doc.status==='active'? 'text-ac':'text-dim'}>{doc.status}</div>
						</button>
					)
				} )
			)}

			{selected&&(
				<div className="mt-[22px] flex flex-col gap-4 border border-br px-5 py-[18px] lg:flex-row lg:items-center lg:gap-5">
					<div className="min-w-0 flex-1">
						<div className="truncate text-[10.5px] uppercase tracking-[.12em] text-dim">
							selected — {selected.name}
						</div>
						<div className="mt-[9px] text-[12px] text-dim">
							{selected.version} · {selected.format} · {selected.size||'unknown size'} · updated{' '}
							{formatShortDate( selected.updatedAt )}
						</div>
					</div>
					<div className="flex flex-wrap gap-2.5">
						<Button size="sm" variant="outline" onClick={() => setViewing( selected )}>view</Button>
						<Button size="sm" variant="outline" onClick={() => handleDownload( selected )}>download</Button>
						<Button size="sm" variant="ghost" className="border border-br" onClick={() => setEditing( selected )}>
							edit
						</Button>
						<Button size="sm" variant="warning" onClick={() => handleDelete( selected )}>delete</Button>
					</div>
				</div>
			)}

			<UploadDocumentDialog
				open={isUploadOpen}
				onOpenChange={setIsUploadOpen}
				onDocumentUploaded={fetchDocuments}
			/>

			<DocumentViewerModal
				open={viewing!==null}
				onOpenChange={next => {
					if ( !next ) setViewing( null )
				}}
				document={viewing}
			/>

			<EditDocumentDialog
				open={editing!==null}
				onOpenChange={next => {
					if ( !next ) setEditing( null )
				}}
				document={editing}
				onDocumentUpdated={fetchDocuments}
			/>
		</div>
	)
}
