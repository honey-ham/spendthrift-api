import { getUserByUsername } from './user.js';
import pool from './db.js';

type Label = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
};

type MinimalLabel = Omit<Label, 'id'>;

/**
 * Label object that uses snake_case rather than camelCase.
 * This is to covert postges naming convention to js
 */
type DBLabel = Omit<Label, 'userId'> & { user_id: string };

const labelTable = 'label';

const dbLabelToLabel = (dbLabel: DBLabel) => {
  return {
    id: dbLabel.id,
    name: dbLabel.name,
    description: dbLabel.description,
    userId: dbLabel.user_id,
  } as Label;
};

/**
 * Gets all default labels
 * All default lables are attached to the 'superuser' user
 */
const getDefaultLabels = async () => {
  const superUser = await getUserByUsername('superuser');
  if (!superUser) return null;

  const query = {
    text: `SELECT * FROM ${labelTable} where user_id=$1`,
    values: [superUser.id],
  };

  try {
    const res = await pool.query(query);
    if (res.rowCount) {
      const listOfLabels: Label[] = [];
      for (const row of res.rows) listOfLabels.push(dbLabelToLabel(row));
      return listOfLabels;
    }
    console.error('Error: Could not get labels (getDefaultLabels())');
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const getDefaultLabelByName = async (name: string) => {
  const superUser = await getUserByUsername('superuser');
  if (!superUser) return null;

  const query = {
    text: `SELECT * FROM ${labelTable} where user_id=$1 AND name=$2`,
    values: [superUser.id, name],
  };

  try {
    const res = await pool.query(query);
    if (res.rowCount) return dbLabelToLabel(res.rows[0]);
    console.error('Error: Could not get label (getDefaultLabelByName())');
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export { Label, MinimalLabel, getDefaultLabels, getDefaultLabelByName };
