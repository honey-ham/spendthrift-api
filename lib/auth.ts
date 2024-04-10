import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_DATABASE,
  port: parseInt(process.env.PG_PORT || '5432', 10)
});
  
const adapter = new NodePostgresAdapter(pool, {
  user: 'user_account',
  session: 'user_session'
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === 'production'
    }
  }
});
  
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
  }
}