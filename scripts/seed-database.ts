import { drizzle } from 'drizzle-orm/node-postgres'
import { applicationEvents,companies,jobApplications,users } from '../lib/db/schema'

// Database connection
const db=drizzle( process.env.DATABASE_URL! )

async function seedDatabase () {
	console.log( '🌱 Starting database seeding...' )

	try {
		// Create sample users
		console.log( '👥 Creating sample users...' )
		const sampleUsers=await db.insert( users ).values( [
			{
				email: 'john.doe@example.com',
				name: 'John Doe',
				image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
				passwordHash: '$2b$12$/7xN2h/qOQBVtQUpvM.58ul3CC/7nIX5RvpaxBVPmtgmK0vSYwVeu', // password: test123
			},
			{
				email: 'jane.smith@example.com',
				name: 'Jane Smith',
				image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
				passwordHash: '$2b$12$/7xN2h/qOQBVtQUpvM.58ul3CC/7nIX5RvpaxBVPmtgmK0vSYwVeu', // password: test123
			},
			{
				email: 'mike.johnson@example.com',
				name: 'Mike Johnson',
				image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
				passwordHash: '$2b$12$/7xN2h/qOQBVtQUpvM.58ul3CC/7nIX5RvpaxBVPmtgmK0vSYwVeu', // password: test123
			},
		] ).returning()

		console.log( `✅ Created ${sampleUsers.length} users` )

		// Create sample companies
		console.log( '🏢 Creating sample companies...' )
		const sampleCompanies=await db.insert( companies ).values( [
			{
				name: 'Google',
				website: 'https://google.com',
				logo: 'https://logo.clearbit.com/google.com',
				description: 'Technology company specializing in Internet-related services and products.',
				location: 'Mountain View, CA',
				industry: 'Technology',
				size: '100,000+',
			},
			{
				name: 'Apple',
				website: 'https://apple.com',
				logo: 'https://logo.clearbit.com/apple.com',
				description: 'Designs, manufactures, and markets smartphones, personal computers, and portable digital music players.',
				location: 'Cupertino, CA',
				industry: 'Technology',
				size: '100,000+',
			},
			{
				name: 'Microsoft',
				website: 'https://microsoft.com',
				logo: 'https://logo.clearbit.com/microsoft.com',
				description: 'Develops, manufactures, licenses, supports, and sells computer software, consumer electronics, and related services.',
				location: 'Redmond, WA',
				industry: 'Technology',
				size: '100,000+',
			},
			{
				name: 'Netflix',
				website: 'https://netflix.com',
				logo: 'https://logo.clearbit.com/netflix.com',
				description: 'Streaming entertainment service with TV series, documentaries, and feature films.',
				location: 'Los Gatos, CA',
				industry: 'Entertainment',
				size: '10,000+',
			},
			{
				name: 'Amazon',
				website: 'https://amazon.com',
				logo: 'https://logo.clearbit.com/amazon.com',
				description: 'E-commerce, cloud computing, digital streaming, and artificial intelligence company.',
				location: 'Seattle, WA',
				industry: 'Technology',
				size: '100,000+',
			},
		] ).returning()

		console.log( `✅ Created ${sampleCompanies.length} companies` )

		// Create sample job applications
		console.log( '📝 Creating sample job applications...' )
		const sampleApplications=await db.insert( jobApplications ).values( [
			{
				userId: sampleUsers[ 0 ].id,
				companyId: sampleCompanies[ 0 ].id,
				position: 'Senior Software Engineer',
				status: 'interview',
				priority: 'high',
				salary: '$150k - $200k',
				location: 'Mountain View, CA',
				jobUrl: 'https://careers.google.com/jobs/results/123456789',
				notes: 'Great opportunity with interesting projects. Team seems collaborative.',
				appliedAt: new Date( '2024-01-15' ),
				deadline: new Date( '2024-02-15' ),
				isRemote: false,
			},
			{
				userId: sampleUsers[ 0 ].id,
				companyId: sampleCompanies[ 1 ].id,
				position: 'iOS Developer',
				status: 'screening',
				priority: 'high',
				salary: '$140k - $180k',
				location: 'Cupertino, CA',
				jobUrl: 'https://jobs.apple.com/en-us/details/123456789',
				notes: 'Excited about working on iOS apps. Need to prepare for technical interview.',
				appliedAt: new Date( '2024-01-20' ),
				deadline: new Date( '2024-02-20' ),
				isRemote: false,
			},
			{
				userId: sampleUsers[ 0 ].id,
				companyId: sampleCompanies[ 2 ].id,
				position: 'Full Stack Developer',
				status: 'applied',
				priority: 'medium',
				salary: '$130k - $170k',
				location: 'Redmond, WA',
				jobUrl: 'https://careers.microsoft.com/us/en/job/123456789',
				notes: 'Remote position with good benefits. Azure team looks interesting.',
				appliedAt: new Date( '2024-01-18' ),
				deadline: new Date( '2024-02-18' ),
				isRemote: true,
			},
			{
				userId: sampleUsers[ 0 ].id,
				companyId: sampleCompanies[ 3 ].id,
				position: 'Backend Engineer',
				status: 'offer',
				priority: 'high',
				salary: '$180k - $250k',
				location: 'Los Gatos, CA',
				jobUrl: 'https://jobs.netflix.com/jobs/123456789',
				notes: 'Amazing offer! Great culture and challenging work.',
				appliedAt: new Date( '2024-01-10' ),
				deadline: new Date( '2024-02-10' ),
				isRemote: false,
			},
			{
				userId: sampleUsers[ 0 ].id,
				companyId: sampleCompanies[ 4 ].id,
				position: 'DevOps Engineer',
				status: 'rejected',
				priority: 'medium',
				salary: '$140k - $190k',
				location: 'Seattle, WA',
				jobUrl: 'https://www.amazon.jobs/en/jobs/123456789',
				notes: 'Interview went well but didn\'t get the role. Good experience though.',
				appliedAt: new Date( '2024-01-12' ),
				deadline: new Date( '2024-02-12' ),
				isRemote: false,
			},
		] ).returning()

		console.log( `✅ Created ${sampleApplications.length} job applications` )

		// Create sample application events
		console.log( '📅 Creating sample application events...' )
		const sampleEvents=await db.insert( applicationEvents ).values( [
			{
				applicationId: sampleApplications[ 0 ].id,
				type: 'email',
				title: 'Application Submitted',
				description: 'Successfully submitted application for Senior Software Engineer position',
				date: new Date( '2024-01-15' ),
			},
			{
				applicationId: sampleApplications[ 0 ].id,
				type: 'interview',
				title: 'Phone Screen Scheduled',
				description: 'Recruiter called to schedule phone screen for next week',
				date: new Date( '2024-01-22' ),
			},
			{
				applicationId: sampleApplications[ 1 ].id,
				type: 'email',
				title: 'Application Submitted',
				description: 'Successfully submitted application for iOS Developer position',
				date: new Date( '2024-01-20' ),
			},
			{
				applicationId: sampleApplications[ 3 ].id,
				type: 'offer',
				title: 'Job Offer Received',
				description: 'Received official job offer with competitive salary and benefits',
				date: new Date( '2024-01-25' ),
			},
		] ).returning()

		console.log( `✅ Created ${sampleEvents.length} application events` )

		console.log( '🎉 Database seeding completed successfully!' )
		console.log( `📊 Summary:` )
		console.log( `   - Users: ${sampleUsers.length}` )
		console.log( `   - Companies: ${sampleCompanies.length}` )
		console.log( `   - Job Applications: ${sampleApplications.length}` )
		console.log( `   - Application Events: ${sampleEvents.length}` )

	} catch ( error ) {
		console.error( '❌ Error seeding database:',error )
		process.exit( 1 )
	}
}

// Run the seeding function
seedDatabase()
