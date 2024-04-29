import pool from './db.js';

type User = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
};

/** Adds a new user to the database */
const createUser = async ({firstName, lastName, email, username, password}: User) => {
  const query = {
    text: 'INSERT INTO user_account(first_name, last_name, email, username, password) VALUES($1, $2, $3, $4, $5) RETURNING *',
    values: [firstName, lastName, email, username, password]
  };
  const res = await pool.query(query);
  return res;
};

export { User, createUser };