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

/**
 * Returns the number of milliseconds between the passed unix timestamp and now
 * @param unixTs Unix timestamp
 */
const msSinceDate = (unixTs: number) => Math.abs(Date.now() - unixTs);

export { getEnv, msSinceDate };
