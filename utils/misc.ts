import 'dotenv/config';

/** A function to get environment variables...
 * Serves as a way to more elegantly inform the user when
 * an env variable is missing
 */
const getEnv = (key: string) => {
    const value = process.env[key];
    if (value === undefined || value === null)
        throw Error(
            `Missing environment variable '${key}'. This should be added to the root of the project in the '.env' file`,
        );
    else return value;
};

export { getEnv };
