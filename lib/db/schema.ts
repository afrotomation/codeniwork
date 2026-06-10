import { relations } from 'drizzle-orm'
import { boolean,index,integer,jsonb,pgEnum,pgTable,real,text,timestamp,uuid } from 'drizzle-orm/pg-core'

// Enums
export const applicationStatusEnum=pgEnum( 'application_status',[
	'applied',
	'screening',
	'interview',
	'offer',
	'rejected',
	'withdrawn'
] )

export const priorityEnum=pgEnum( 'priority',[
	'low',
	'medium',
	'high'
] )

// Users table
export const users=pgTable( 'users',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	// CodeniServer SSO user id (sub). Local uuid stays the FK anchor.
	externalId: text( 'external_id' ).unique(),
	email: text( 'email' ).notNull().unique(),
	name: text( 'name' ),
	image: text( 'image' ),
	emailVerified: timestamp( 'email_verified',{ mode: 'date' } ),
	passwordHash: text( 'password_hash' ),
	masterPasswordHash: text( 'master_password_hash' ),
	masterPasswordSalt: text( 'master_password_salt' ),
	encryptionKeyDerivationSalt: text( 'encryption_key_derivation_salt' ),
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
	updatedAt: timestamp( 'updated_at' ).defaultNow().notNull(),
} )

// Companies table
export const companies=pgTable( 'companies',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	name: text( 'name' ).notNull(),
	website: text( 'website' ),
	logo: text( 'logo' ),
	description: text( 'description' ),
	location: text( 'location' ),
	industry: text( 'industry' ),
	size: text( 'size' ),
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
	updatedAt: timestamp( 'updated_at' ).defaultNow().notNull(),
} )

// Job applications table
export const jobApplications=pgTable( 'job_applications',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	companyId: uuid( 'company_id' ).references( () => companies.id,{ onDelete: 'cascade' } ).notNull(),
	position: text( 'position' ).notNull(),
	status: applicationStatusEnum( 'status' ).default( 'applied' ).notNull(),
	priority: priorityEnum( 'priority' ).default( 'medium' ),
	salary: text( 'salary' ),
	location: text( 'location' ),
	jobUrl: text( 'job_url' ),
	notes: text( 'notes' ),
	appliedAt: timestamp( 'applied_at' ).defaultNow().notNull(),
	deadline: timestamp( 'deadline' ),
	isRemote: boolean( 'is_remote' ).default( false ),
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
	updatedAt: timestamp( 'updated_at' ).defaultNow().notNull(),
} )

// Application events table (for tracking progress)
export const applicationEvents=pgTable( 'application_events',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	applicationId: uuid( 'application_id' ).references( () => jobApplications.id,{ onDelete: 'cascade' } ).notNull(),
	type: text( 'type' ).notNull(), // 'email', 'call', 'interview', 'offer', etc.
	title: text( 'title' ).notNull(),
	description: text( 'description' ),
	date: timestamp( 'date' ).notNull(),
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
} )

// Documents table
export const documents=pgTable( 'documents',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	name: text( 'name' ).notNull(),
	type: text( 'type' ).notNull(), // 'resume', 'cover_letter', 'portfolio', 'other'
	format: text( 'format' ).notNull(), // 'PDF', 'DOCX', 'DOC', etc.
	size: text( 'size' ), // File size in KB/MB
	fileUrl: text( 'file_url' ).notNull(), // Cloudinary URL
	publicId: text( 'public_id' ), // Cloudinary public ID for deletion
	description: text( 'description' ),
	status: text( 'status' ).default( 'active' ).notNull(), // 'active', 'archived', 'template'
	version: text( 'version' ).default( 'v1.0' ),
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
	updatedAt: timestamp( 'updated_at' ).defaultNow().notNull(),
} )

// Passkey credentials table for WebAuthn
export const passkeyCredentials=pgTable( 'passkey_credentials',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	credentialId: text( 'credential_id' ).notNull().unique(),
	publicKey: text( 'public_key' ).notNull(),
	counter: text( 'counter' ).notNull().default( '0' ),
	deviceType: text( 'device_type' ), // 'single_device', 'multi_device'
	backedUp: boolean( 'backed_up' ).default( false ),
	transports: text( 'transports' ), // JSON array of transport methods
	name: text( 'name' ), // User-friendly name for the passkey
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
	lastUsed: timestamp( 'last_used' ),
} )

// Relations
export const usersRelations=relations( users,( { many } ) => ( {
	applications: many( jobApplications ),
	documents: many( documents ),
	passkeyCredentials: many( passkeyCredentials ),
} ) )

export const companiesRelations=relations( companies,( { many } ) => ( {
	applications: many( jobApplications ),
} ) )

export const jobApplicationsRelations=relations( jobApplications,( { one,many } ) => ( {
	user: one( users,{
		fields: [ jobApplications.userId ],
		references: [ users.id ],
	} ),
	company: one( companies,{
		fields: [ jobApplications.companyId ],
		references: [ companies.id ],
	} ),
	events: many( applicationEvents ),
} ) )

export const applicationEventsRelations=relations( applicationEvents,( { one } ) => ( {
	application: one( jobApplications,{
		fields: [ applicationEvents.applicationId ],
		references: [ jobApplications.id ],
	} ),
} ) )

// External jobs table (fetched from job board APIs)
export const externalJobs=pgTable( 'external_jobs',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	title: text( 'title' ).notNull(),
	company: text( 'company' ).notNull(),
	companyLogo: text( 'company_logo' ),
	url: text( 'url' ).notNull(),
	source: text( 'source' ).notNull(), // 'remoteok', 'adzuna', 'jsearch'
	sourceId: text( 'source_id' ), // ID from source API for dedup
	description: text( 'description' ),
	salaryMin: integer( 'salary_min' ),
	salaryMax: integer( 'salary_max' ),
	salaryCurrency: text( 'salary_currency' ).default( 'USD' ),
	location: text( 'location' ),
	isRemote: boolean( 'is_remote' ).default( false ),
	tags: text( 'tags' ), // JSON array of tags/skills
	postedAt: timestamp( 'posted_at' ),
	fetchedAt: timestamp( 'fetched_at' ).defaultNow().notNull(),
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
},( table ) => ( {
	sourceIdx: index( 'external_jobs_source_idx' ).on( table.source ),
	titleCompanyIdx: index( 'external_jobs_title_company_idx' ).on( table.title,table.company ),
} ) )

// Saved external jobs (user bookmarks)
export const savedJobs=pgTable( 'saved_jobs',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	externalJobId: uuid( 'external_job_id' ).references( () => externalJobs.id,{ onDelete: 'cascade' } ).notNull(),
	matchScore: real( 'match_score' ), // 0-100 match percentage
	savedAt: timestamp( 'saved_at' ).defaultNow().notNull(),
},( table ) => ( {
	userJobIdx: index( 'saved_jobs_user_job_idx' ).on( table.userId,table.externalJobId ),
} ) )

// Saved jobs relations
export const savedJobsRelations=relations( savedJobs,( { one } ) => ( {
	user: one( users,{
		fields: [ savedJobs.userId ],
		references: [ users.id ],
	} ),
	externalJob: one( externalJobs,{
		fields: [ savedJobs.externalJobId ],
		references: [ externalJobs.id ],
	} ),
} ) )

// AI Resume Parses table
export const resumeParses=pgTable( 'resume_parses',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	documentId: uuid( 'document_id' ).references( () => documents.id,{ onDelete: 'cascade' } ),
	rawText: text( 'raw_text' ),
	name: text( 'name' ),
	email: text( 'email' ),
	phone: text( 'phone' ),
	summary: text( 'summary' ),
	skills: text( 'skills' ).array(),
	experience: jsonb( 'experience' ), // [{title, company, duration, description}]
	education: jsonb( 'education' ), // [{degree, school, year}]
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
	updatedAt: timestamp( 'updated_at' ).defaultNow().notNull(),
} )

// AI Job Match Scores table
export const jobMatches=pgTable( 'job_matches',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	applicationId: uuid( 'application_id' ).references( () => jobApplications.id,{ onDelete: 'cascade' } ),
	resumeParseId: uuid( 'resume_parse_id' ).references( () => resumeParses.id ),
	jobDescription: text( 'job_description' ),
	matchScore: integer( 'match_score' ), // 0-100
	matchedSkills: text( 'matched_skills' ).array(),
	missingSkills: text( 'missing_skills' ).array(),
	aiAnalysis: text( 'ai_analysis' ),
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
} )

// AI Cover Letters table
export const coverLetters=pgTable( 'cover_letters',{
	id: uuid( 'id' ).primaryKey().defaultRandom(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	applicationId: uuid( 'application_id' ).references( () => jobApplications.id,{ onDelete: 'cascade' } ),
	content: text( 'content' ).notNull(),
	tone: text( 'tone' ).default( 'professional' ), // professional, casual, enthusiastic
	createdAt: timestamp( 'created_at' ).defaultNow().notNull(),
	updatedAt: timestamp( 'updated_at' ).defaultNow().notNull(),
} )

// AI Relations
export const resumeParsesRelations=relations( resumeParses,( { one,many } ) => ( {
	user: one( users,{
		fields: [ resumeParses.userId ],
		references: [ users.id ],
	} ),
	document: one( documents,{
		fields: [ resumeParses.documentId ],
		references: [ documents.id ],
	} ),
	jobMatches: many( jobMatches ),
} ) )

export const jobMatchesRelations=relations( jobMatches,( { one } ) => ( {
	user: one( users,{
		fields: [ jobMatches.userId ],
		references: [ users.id ],
	} ),
	application: one( jobApplications,{
		fields: [ jobMatches.applicationId ],
		references: [ jobApplications.id ],
	} ),
	resumeParse: one( resumeParses,{
		fields: [ jobMatches.resumeParseId ],
		references: [ resumeParses.id ],
	} ),
} ) )

export const coverLettersRelations=relations( coverLetters,( { one } ) => ( {
	user: one( users,{
		fields: [ coverLetters.userId ],
		references: [ users.id ],
	} ),
	application: one( jobApplications,{
		fields: [ coverLetters.applicationId ],
		references: [ jobApplications.id ],
	} ),
} ) )

// Auth tables for NextAuth.js
export const sessions=pgTable( 'sessions',{
	sessionToken: text( 'session_token' ).primaryKey(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	expires: timestamp( 'expires',{ mode: 'date' } ).notNull(),
} )

export const accounts=pgTable( 'accounts',{
	id: text( 'id' ).primaryKey(),
	userId: uuid( 'user_id' ).references( () => users.id,{ onDelete: 'cascade' } ).notNull(),
	type: text( 'type' ).notNull(),
	provider: text( 'provider' ).notNull(),
	providerAccountId: text( 'provider_account_id' ).notNull(),
	refresh_token: text( 'refresh_token' ),
	access_token: text( 'access_token' ),
	expires_at: text( 'expires_at' ),
	token_type: text( 'token_type' ),
	scope: text( 'scope' ),
	id_token: text( 'id_token' ),
	session_state: text( 'session_state' ),
} )

export const verificationTokens=pgTable( 'verification_tokens',{
	identifier: text( 'identifier' ).notNull(),
	token: text( 'token' ).notNull().unique(),
	expires: timestamp( 'expires',{ mode: 'date' } ).notNull(),
},( table ) => ( {
	identifierTokenIdx: index( 'identifier_token_idx' ).on( table.identifier,table.token ),
} ) )

// Auth relations
export const sessionsRelations=relations( sessions,( { one } ) => ( {
	user: one( users,{
		fields: [ sessions.userId ],
		references: [ users.id ],
	} ),
} ) )

export const accountsRelations=relations( accounts,( { one } ) => ( {
	user: one( users,{
		fields: [ accounts.userId ],
		references: [ users.id ],
	} ),
} ) )

export const passkeyCredentialsRelations=relations( passkeyCredentials,( { one } ) => ( {
	user: one( users,{
		fields: [ passkeyCredentials.userId ],
		references: [ users.id ],
	} ),
} ) )
