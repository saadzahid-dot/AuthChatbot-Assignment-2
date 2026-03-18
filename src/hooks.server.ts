import { handle as authHandle } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const protectedRoutes: Handle = async ({ event, resolve }) => {
	const protectedPaths = ['/dashboard', '/profile', '/chat'];
	const adminPaths = ['/admin'];
	const isProtected = protectedPaths.some((path) => event.url.pathname.startsWith(path));
	const isAdmin = adminPaths.some((path) => event.url.pathname.startsWith(path));

	if (isProtected || isAdmin) {
		const session = await event.locals.auth();
		if (!session?.user) {
			throw redirect(303, '/login');
		}

		// Check if user account is still active
		const dbUser = await db.query.users.findFirst({
			where: eq(users.id, session.user.id)
		});

		if (dbUser && !dbUser.active) {
			// Delete all sessions for this disabled user
			await db.delete(sessions).where(eq(sessions.userId, session.user.id));
			// Clear the session cookie
			event.cookies.delete('authjs.session-token', { path: '/' });
			throw redirect(303, '/login?error=account-disabled');
		}

		if (isAdmin && session.user.role !== 'admin') {
			throw redirect(303, '/dashboard');
		}
	}

	return resolve(event);
};

export const handle = sequence(authHandle, protectedRoutes);
