'use client'

import { Button } from '@/components/ui/button'
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Camera,Image as ImageIcon,Lock,Save,User } from 'lucide-react'
import { authClient,useSession } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { useRef,useState } from 'react'

export default function ProfilePage () {
	const { data: session }=useSession()
	const router=useRouter()
	const { toast }=useToast()
	const fileInputRef=useRef<HTMLInputElement>( null )

	const [ isLoading,setIsLoading ]=useState( false )
	const [ formData,setFormData ]=useState( {
		name: session?.user?.name||'',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	} )
	const [ profileImage,setProfileImage ]=useState<File|null>( null )
	const [ previewUrl,setPreviewUrl ]=useState<string|null>( session?.user?.image||null )

	// Redirect if not authenticated
	if ( !session?.user ) {
		router.push( '/auth/signin' )
		return null
	}

	const handleInputChange=( field: string,value: string ) => {
		setFormData( prev => ( {
			...prev,
			[ field ]: value
		} ) )
	}

	const handleImageSelect=( event: React.ChangeEvent<HTMLInputElement> ) => {
		const file=event.target.files?.[ 0 ]
		if ( file ) {
			// Validate file type
			if ( !file.type.startsWith( 'image/' ) ) {
				toast( {
					title: 'Invalid file type',
					description: 'Please select an image file (JPEG, PNG, etc.)',
					variant: 'destructive',
				} )
				return
			}

			// Validate file size (max 5MB)
			if ( file.size>5*1024*1024 ) {
				toast( {
					title: 'File too large',
					description: 'Please select an image smaller than 5MB',
					variant: 'destructive',
				} )
				return
			}

			setProfileImage( file )

			// Create preview URL
			const url=URL.createObjectURL( file )
			setPreviewUrl( url )
		}
	}

	const handleImageUpload=async (): Promise<string|null> => {
		if ( !profileImage ) return null

		try {
			// Create FormData for file upload
			const formData=new FormData()
			formData.append( 'file',profileImage )

			// Upload to Cloudinary via our API endpoint
			const response=await fetch( '/api/upload/image',{
				method: 'POST',
				body: formData,
			} )

			if ( !response.ok ) {
				const errorData=await response.json()
				throw new Error( errorData.error||'Failed to upload image' )
			}

			const data=await response.json()
			return data.secure_url
		} catch ( error ) {
			console.error( 'Error uploading image:',error )
			toast( {
				title: 'Image upload failed',
				description: error instanceof Error? error.message:'Failed to upload profile image. Please try again.',
				variant: 'destructive',
			} )
			return null
		}
	}

	const handleSubmit=async ( e: React.FormEvent ) => {
		e.preventDefault()
		setIsLoading( true )

		try {
			// Validate passwords if changing
			if ( formData.newPassword||formData.currentPassword ) {
				if ( !formData.currentPassword ) {
					toast( {
						title: 'Current password required',
						description: 'Please enter your current password to change it.',
						variant: 'destructive',
					} )
					return
				}

				if ( formData.newPassword!==formData.confirmPassword ) {
					toast( {
						title: 'Passwords do not match',
						description: 'New password and confirmation password must match.',
						variant: 'destructive',
					} )
					return
				}

				if ( formData.newPassword.length<6 ) {
					toast( {
						title: 'Password too short',
						description: 'New password must be at least 6 characters long.',
						variant: 'destructive',
					} )
					return
				}
			}

			// Upload image first if selected
			let imageUrl=null
			if ( profileImage ) {
				imageUrl=await handleImageUpload()
				if ( !imageUrl ) {
					setIsLoading( false )
					return
				}
			}

			// Prepare update data
			const updateData: any={
				name: formData.name,
			}

			if ( imageUrl ) {
				updateData.image=imageUrl
			}

			// Password changes go to CodeniServer (the identity provider) via
			// the auth proxy — the local profile API only handles name/image.
			if ( formData.newPassword&&formData.currentPassword ) {
				const { error: pwError }=await authClient.changePassword( {
					currentPassword: formData.currentPassword,
					newPassword: formData.newPassword,
				} )
				if ( pwError ) {
					throw new Error( pwError.message||'Failed to change password' )
				}
			}

			// Update profile via API
			const response=await fetch( '/api/profile/update',{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify( updateData ),
			} )

			if ( !response.ok ) {
				const errorData=await response.json()
				throw new Error( errorData.error||'Failed to update profile' )
			}

			const updatedUser=await response.json()

			// Better Auth refreshes its session cache on navigation; the local
			// mirror re-syncs server-side on the next request.

			toast( {
				title: 'Profile updated successfully!',
				description: 'Your profile has been updated.',
			} )

			// Reset form
			setFormData( {
				name: updatedUser.name,
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			} )
			setProfileImage( null )
			if ( fileInputRef.current ) {
				fileInputRef.current.value=''
			}

		} catch ( error ) {
			console.error( 'Error updating profile:',error )
			toast( {
				title: 'Update failed',
				description: error instanceof Error? error.message:'Failed to update profile. Please try again.',
				variant: 'destructive',
			} )
		} finally {
			setIsLoading( false )
		}
	}

	return (
		<div className="min-h-screen p-6">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gradient-heading">
						Profile Settings
					</h1>
					<p className="text-violet-200/70 mt-2">
						Update your personal information and account settings
					</p>
				</div>

				<Card className="glass-elevated">
					<CardHeader>
						<CardTitle className="text-white flex items-center space-x-2">
							<User className="w-5 h-5" />
							<span>Personal Information</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Profile Picture Section */}
							<div className="space-y-4">
								<Label>Profile Picture</Label>
								<div className="flex items-center space-x-4">
									<div className="relative">
										<div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center ring-2 ring-violet-500/30">
											{previewUrl? (
												<img
													src={previewUrl}
													alt="Profile"
													className="w-full h-full object-cover"
												/>
											):(
												<User className="w-12 h-12 text-white" />
											)}
										</div>
										<Button
											type="button"
											size="sm"
											variant="outline"
											className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
											onClick={() => fileInputRef.current?.click()}
										>
											<Camera className="w-4 h-4" />
										</Button>
									</div>
									<div className="flex-1">
										<input
											ref={fileInputRef}
											type="file"
											accept="image/*"
											onChange={handleImageSelect}
											className="hidden"
										/>
										<Button
											type="button"
											variant="outline"
											onClick={() => fileInputRef.current?.click()}
										>
											<ImageIcon className="w-4 h-4 mr-2" />
											Choose Image
										</Button>
										<p className="text-sm text-violet-300/40 mt-1">
											JPEG, PNG up to 5MB
										</p>
									</div>
								</div>
							</div>

							{/* Name Section */}
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									type="text"
									value={formData.name}
									onChange={( e ) => handleInputChange( 'name',e.target.value )}
									placeholder="Enter your full name"
								/>
							</div>

							{/* Password Section */}
							<div className="space-y-4">
								<div className="flex items-center space-x-2">
									<Lock className="w-5 h-5 text-violet-200" />
									<Label>Change Password</Label>
								</div>

								<div className="space-y-2">
									<Label htmlFor="currentPassword">Current Password</Label>
									<Input
										id="currentPassword"
										type="password"
										value={formData.currentPassword}
										onChange={( e ) => handleInputChange( 'currentPassword',e.target.value )}
										placeholder="Enter current password"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="newPassword">New Password</Label>
									<Input
										id="newPassword"
										type="password"
										value={formData.newPassword}
										onChange={( e ) => handleInputChange( 'newPassword',e.target.value )}
										placeholder="Enter new password"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm New Password</Label>
									<Input
										id="confirmPassword"
										type="password"
										value={formData.confirmPassword}
										onChange={( e ) => handleInputChange( 'confirmPassword',e.target.value )}
										placeholder="Confirm new password"
									/>
								</div>
							</div>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full"
							>
								{isLoading? (
									<>
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
										Updating...
									</>
								):(
									<>
										<Save className="w-4 h-4 mr-2" />
										Update Profile
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
