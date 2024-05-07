import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';

import pool from './db.js';
import { getEnv } from '../utils/misc.js';

const adapter = new NodePostgresAdapter(pool, {
    user: 'user_account',
    session: 'user_session',
});

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            // set to `true` when using HTTPS
            secure: getEnv('NODE_ENV') === 'production',
        },
    },
});

declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
    }
}
