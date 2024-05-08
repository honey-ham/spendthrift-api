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

const tableName = 'user_account';

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
        text: `INSERT INTO ${tableName}(first_name, last_name, email, username, password) VALUES($1, $2, $3, $4, $5) RETURNING *`,
        values: [firstName, lastName, email, username, password],
    };
    try {
        const res = await pool.query(query);
        if (res.rowCount) return dbUserToUser(res.rows[0]);
        console.error('Error: Could not create user (createUser())');
        return null;
    } catch (e) {
        console.error(
            `Error: Could not create user (createUser()).\n\n${e ?? ''}`,
        );
        return null;
    }
};

const setVerificationAttemptDate = (id: string) => {
    const date = new Date().toISOString();
    const query = {
        text: `UPDATE ${tableName} SET last_verification_attempt = $1 WHERE id = $2`,
        values: [date, id],
    };
    try {
        // TODO: Finish this function
    } catch (e) {}
};

/**
 * Verify a users email. This must be completed before a user can use the system
 * @param id User id
 * @returns True if the user was successfully verified, else false
 */
const verifyUser = async (id: string) => {
    const query = {
        text: `UPDATE ${tableName} SET is_verified = TRUE WHERE id = $1`,
        values: [id],
    };
    try {
        await pool.query(query);
        return true; // TODO: Need to check the return from pool.query to ensure that a row was updated
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
        text: `SELECT * FROM ${tableName} WHERE email=$1`,
        values: [email],
    };
    try {
        const res = await pool.query(query);
        if (res.rowCount) return dbUserToUser(res.rows[0]);
        console.error('Error: Could not get user by email (getUserByEmail())');
        return null;
    } catch (e) {
        console.error(
            `Error: Could not get user by email (getUserByEmail()).\n\n${e ?? ''}`,
        );
        return null;
    }
};

/**
 * @returns User relating to the passed username or null
 */
const getUserByUsername = async (username: string) => {
    const query = {
        text: `SELECT * FROM ${tableName} WHERE username=$1`,
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
        console.error(
            `Error: Could not get user by username (getUserByUsername()).\n\n${e ?? ''}`,
        );
        return null;
    }
};

/**
 * @returns User relating to the passed id or null
 */
const getUserById = async (id: string) => {
    const query = {
        text: `SELECT * FROM ${tableName} WHERE id=$1`,
        values: [id],
    };
    try {
        const res = await pool.query(query);
        if (res.rowCount) return dbUserToUser(res.rows[0]);
        console.error('Error: Could not get user by id (getUserById())');
        return null;
    } catch (e) {
        console.error(
            `Error: Could not get user by id (getUserById()).\n\n${e ?? ''}`,
        );
        return null;
    }
};

export {
    User,
    createUser,
    verifyUser,
    getUserByEmail,
    getUserByUsername,
    getUserById,
};
