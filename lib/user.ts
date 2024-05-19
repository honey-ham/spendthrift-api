import pool from './db.js';

/** User permissions */
enum Permissions {
  Superuser = 'superuser',
  Normie = 'normie',
}

type Permission = {
  id: string;
  name: string;
  description: string;
};

/** Includes ALL user_account fields */
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  /** Prevents a user from using their account (Admin control)*/
  isLocked: boolean;
  /** Indicates when a user has verified their email + Prevents a user from using their account */
  isVerified: boolean;
  /** Timestamp of the last verification sent to the user. Prevents spamming */
  lastVerificationAttempt: Date | null;
  permissionId: string;
};

/** Includes only user_account fields that are required */
type MinimumUser = Omit<
  User,
  'id' | 'isLocked' | 'isVerified' | 'lastVerificationAttempt' | 'permissionId'
>;

/**
 * User object that uses snake_case rather than camelCase.
 * This is to covert postges naming convention to js
 */
type DbUser = Omit<
  User,
  | 'firstName'
  | 'lastName'
  | 'isLocked'
  | 'isVerified'
  | 'lastVerificationAttempt'
  | 'permissionId'
> & {
  first_name: string;
  last_name: string;
  is_locked: boolean;
  is_verified: boolean;
  last_verification_attempt: string | null;
  permission_id: string;
};

const userTable = 'user_account';
const permissionTable = 'permission';

const dbUserToUser = (dbUser: DbUser) => {
  return {
    id: dbUser.id,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    email: dbUser.email,
    username: dbUser.username,
    password: dbUser.password,
    permissionId: dbUser.permission_id,
    isLocked: dbUser.is_locked,
    isVerified: dbUser.is_verified,
    lastVerificationAttempt: dbUser.last_verification_attempt
      ? new Date(dbUser.last_verification_attempt)
      : null,
  } as User;
};

/**
 * Adds a new user to the database with 'Normie' permissions
 * @param param0 MinimumUser object
 * @returns User object or null if it failed
 */
const createUser = async ({
  firstName,
  lastName,
  email,
  username,
  password,
}: MinimumUser) => {
  // Getting UUID of 'normie' permission... (Just the default permission for this app)
  let normieId: string;
  try {
    const res = await pool.query({
      text: `SELECT id from permission where name='normie'`,
    });
    if (!res.rowCount) return null;
    normieId = res.rows[0].id;
  } catch (e) {
    console.error(e);
    return null;
  }

  const query = {
    text: `INSERT INTO ${userTable}(first_name, last_name, email, username, password, permission_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
    values: [firstName, lastName, email, username, password, normieId],
  };
  try {
    const res = await pool.query(query);
    if (res.rowCount) return dbUserToUser(res.rows[0]);
    console.error('Error: Could not create user (createUser())');
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Sets last_verification_attempt to the current date time. This is used to prevent
 * verification emails from being spammed
 * @param id User id
 * @returns true if last_verification_attempt was set to the current date time
 */
const setVerificationAttemptDate = async (id: string) => {
  const date = new Date().toISOString();
  const query = {
    text: `UPDATE ${userTable} SET last_verification_attempt = $1 WHERE id = $2`,
    values: [date, id],
  };
  try {
    const res = await pool.query(query);
    if (res.rowCount) return true;
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * Verify a users email. This must be completed before a user can use the system
 * @param id User id
 * @returns True if the user was successfully verified, else false
 */
const verifyUser = async (id: string) => {
  const query = {
    text: `UPDATE ${userTable} SET is_verified = TRUE WHERE id = $1`,
    values: [id],
  };
  try {
    await pool.query(query);
    return true; // TODO: Need to check the return from pool.query to ensure that a row was updated
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * Gets user based on string email
 * @param email String email relating to user
 * @returns User relating to the passed email or null
 */
const getUserByEmail = async (email: string) => {
  const query = {
    text: `SELECT * FROM ${userTable} WHERE email=$1`,
    values: [email],
  };
  try {
    const res = await pool.query(query);
    if (res.rowCount) return dbUserToUser(res.rows[0]);
    console.error('Error: Could not get user by email (getUserByEmail())');
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Gets user based on string username
 * @param username String username relating to user
 * @returns User relating to the passed username or null
 */
const getUserByUsername = async (username: string) => {
  const query = {
    text: `SELECT * FROM ${userTable} WHERE username=$1`,
    values: [username],
  };
  try {
    const res = await pool.query(query);
    if (res.rowCount) return dbUserToUser(res.rows[0]);
    console.error(
      'Error: Could not get user by username (getUserByUsername())',
    );
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Gets user based on string id
 * @param id String id relating to user
 * @returns User relating to the passed id or null
 */
const getUserById = async (id: string) => {
  const query = {
    text: `SELECT *, last_verification_attempt::text FROM ${userTable} WHERE id=$1`,
    values: [id],
  };
  try {
    const res = await pool.query(query);
    if (res.rowCount) return dbUserToUser(res.rows[0]);
    console.error('Error: Could not get user by id (getUserById())');
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Gets a users permission level
 * @param id User id
 * @returns A permission object representing the user's permission level or
 * null implying that the function failed to get the permission
 */
const getUserPermissions = async (id: string) => {
  const query = {
    text: `SELECT p.* FROM ${userTable} as u, ${permissionTable} as p WHERE u.id = $1 AND u.permission_id = p.id;`,
    values: [id],
  };
  try {
    const res = await pool.query(query);
    if (res.rowCount === 0) return null;
    return res.rows[0] as Permission;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export {
  Permissions,
  User,
  MinimumUser,
  createUser,
  setVerificationAttemptDate,
  verifyUser,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  getUserPermissions,
};
