import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_DATABASE,
  port: parseInt(process.env.PG_PORT || '5432', 10)
});

export default pool;