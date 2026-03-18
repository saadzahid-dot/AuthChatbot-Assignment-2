import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/core/providers/google';
import GitHub from '@auth/core/providers/github';
import Credentials from '@auth/core/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';
import { users, sessions, accounts, verificationTokens } from './db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		sessionsTable: sessions,
		accountsTable: accounts,
		verificationTokensTable: verificationTokens
	}),
	session: {
		strategy: 'database',
		maxAge: 30 * 24 * 60 * 60 // 30 days
	},
	providers: [
		Google,
		GitHub,
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;

				const email = credentials.email as string;
				const password = credentials.password as string;

				const user = await db.query.users.findFirst({
					where: eq(users.email, email)
				});

				if (!user || !user.password) return null;

				const isValid = await bcrypt.compare(password, user.password);
				if (!isValid) return null;

				return {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image
				};
			}
		})
	],
	callbacks: {
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;

				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, user.id)
				});
				session.user.role = dbUser?.role ?? 'user';
			}
			return session;
		},
		async signIn({ user }) {
			// Block disabled users from signing in (OAuth + Credentials)
			if (user.id) {
				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, user.id)
				});
				if (dbUser && !dbUser.active) {
					return false;
				}
			}
			return true;
		},
		async redirect({ url, baseUrl }) {
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			if (url.startsWith(baseUrl)) return url;
			return baseUrl;
		}
	},
	pages: {
		signIn: '/login'
	},
	trustHost: true
});
