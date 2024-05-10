import pool from './db.js';

/** User permissions */
enum Permissions {
    Superuser = 'superuser',
}

/** Includes only user_account fields that are required */
type UserNotNull = {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
};

/** Includes ALL user_account fields */
type User = UserNotNull & {
    id: string;
    /** Prevents a user from using their account (Admin control)*/
    isLocked: boolean;
    /** Indicates when a user has verified their email + Prevents a user from using their account */
    isVerified: boolean;
    /** Unix timestamp of the last verification sent to the user. Prevents spamming */
    lastVerificationAttempt: number | null;
};

type dbUser = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password: string;
    /** Prevents a user from using their account */
    is_locked: boolean;
    is_verified: boolean;
    last_verification_attempt: string | null;
};

const userTable = 'user_account';
const userPermissionTable = 'user_permissions';
const permissionTable = 'permission';

const dbUserToUser = (dbUser: dbUser) => {
    return {
        id: dbUser.id,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        email: dbUser.email,
        username: dbUser.username,
        password: dbUser.password,
        isLocked: dbUser.is_locked,
        isVerified: dbUser.is_verified,
        lastVerificationAttempt: dbUser.last_verification_attempt
            ? Number(dbUser.last_verification_attempt)
            : null,
    } as User;
};

/** Adds a new user to the database */
const createUser = async ({
    firstName,
    lastName,
    email,
    username,
    password,
}: UserNotNull) => {
    const query = {
        text: `INSERT INTO ${userTable}(first_name, last_name, email, username, password) VALUES($1, $2, $3, $4, $5) RETURNING *`,
        values: [firstName, lastName, email, username, password],
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
    const date = Date.now(); // UNIX timestamp
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
 * @returns List of string permissions for the passed user id. Empty list implies no elevated permissions above default. Null implies failure to retrieve
 */
const getUserPermissions = async (id: string) => {
    const query = {
        text: `SELECT p.name FROM ${userTable} as u, ${userPermissionTable} as up, ${permissionTable} as p WHERE u.id = $1 AND u.id = up.user_id AND up.permission_id = p.id;`,
        values: [id],
    };
    try {
        const res = await pool.query(query);
        if (res.rowCount === 0) return [];
        return res.rows.map((row) => row.name);
    } catch (e) {
        console.error(e);
        return null;
    }
};

export {
    Permissions,
    User,
    UserNotNull,
    createUser,
    setVerificationAttemptDate,
    verifyUser,
    getUserByEmail,
    getUserByUsername,
    getUserById,
    getUserPermissions,
};
