import pg from 'pg';
import 'dotenv/config';

import { getEnv } from '../utils/misc.js';

const pool = new pg.Pool({
  host: getEnv('PG_HOST'),
  user: getEnv('PG_USER'),
  password: getEnv('PG_PASS'),
  database: getEnv('PG_DATABASE'),
  port: parseInt(getEnv('PG_PORT') || '5432', 10),
});

export default pool;
