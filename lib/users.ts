import pool from './db.js';

type User = {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    /** Prevents a user from using their account */
    isLocked?: boolean;
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
};

const dbUserToUser = (dbUser: dbUser) => {
    return {
        id: dbUser.id,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        email: dbUser.email,
        username: dbUser.username,
        password: dbUser.password,
        isLocked: dbUser.is_locked,
    } as User;
};

/** Adds a new user to the database */
const createUser = async ({
    firstName,
    lastName,
    email,
    username,
    password,
}: User) => {
    const query = {
        text: 'INSERT INTO user_account(first_name, last_name, email, username, password) VALUES($1, $2, $3, $4, $5) RETURNING *',
        values: [firstName, lastName, email, username, password],
    };
    const res = await pool.query(query);
    if (res.rowCount) return dbUserToUser(res.rows[0]);
    return null;
};

/**
 * Verify a users email. This must be completed before a user can use the system
 * @param id User id
 * @returns True if the user was successfully verified, else false
 */
const verifyUser = async (id: string) => {
    const query = {
        text: 'UPDATE user_account SET is_verified = TRUE WHERE id = $1',
        values: [id],
    };
    try {
        await pool.query(query);
        return true;
    } catch (e) {
        console.error(`Error: Could not verify user (${id}).\n\n${e ?? ''}`);
        return false;
    }
};

/**
 * @returns User relating to the passed email or null
 */
const getUserByEmail = async (email: string) => {
    const query = {
        text: 'SELECT * FROM user_account WHERE email=$1',
        values: [email],
    };
    const res = await pool.query(query);
    if (res.rowCount) return dbUserToUser(res.rows[0]);
    return null;
};

/**
 * @returns User relating to the passed username or null
 */
const getUserByUsername = async (username: string) => {
    const query = {
        text: 'SELECT * FROM user_account WHERE username=$1',
        values: [username],
    };
    const res = await pool.query(query);
    if (res.rowCount) return dbUserToUser(res.rows[0]);
    return null;
};

/**
 * @returns User relating to the passed id or null
 */
const getUserById = async (id: string) => {
    const query = {
        text: 'SELECT * FROM user_account WHERE id=$1',
        values: [id],
    };
    const res = await pool.query(query);
    if (res.rowCount) return dbUserToUser(res.rows[0]);
    return null;
};

export {
    User,
    createUser,
    verifyUser,
    getUserByEmail,
    getUserByUsername,
    getUserById,
};
