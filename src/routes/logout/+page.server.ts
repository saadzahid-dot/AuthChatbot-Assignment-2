import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		const session = await locals.auth();

		if (session?.user?.id) {
			// Delete all sessions for this user
			await db.delete(sessions).where(eq(sessions.userId, session.user.id));
		} else {
			// Fallback: try deleting by session token
			const sessionToken =
				cookies.get('authjs.session-token') ||
				cookies.get('__Secure-authjs.session-token');

			if (sessionToken) {
				await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
			}
		}

		// Clear both possible cookie names
		cookies.delete('authjs.session-token', { path: '/' });
		cookies.delete('__Secure-authjs.session-token', { path: '/' });

		throw redirect(303, '/?toast=logout');
	}
};
