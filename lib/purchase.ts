import pool from './db.js';

/** Includes ALL purchase fields */
type Purchase = {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  /** Unix timestamp */
  date: string;
  userId: string;
  labelId: string;
};

/** Purchase object that has omitted unrequired fields (Except for description) */
type MinimumPurchase = Omit<Purchase, 'id'>;

/**
 * Purchase object that uses snake_case rather than camelCase.
 * This is to covert postges naming convention to js
 */
type DbPurchase = Omit<Purchase, 'userID' | 'labelId'> & {
  user_id: string;
  label_id: string;
};

const purchaseTable = 'purchase';

const dbPurchaseToPurchase = (dbPurchase: DbPurchase) => {
  return {
    id: dbPurchase.id,
    name: dbPurchase.name,
    description: dbPurchase.description,
    cost: Number(dbPurchase.cost),
    date: dbPurchase.date,
    userId: dbPurchase.user_id,
    labelId: dbPurchase.label_id,
  } as Purchase;
};

/**
 * Creates a purchase
 * @param param0.name Purchase name
 * @param param0.description Purchase description
 * @param param0.cost Purchase cost
 * @param param0.date Purchase date
 * @param param0.userId User uuid associated with the purchase
 * @returns Purchase object or null if it failed
 */
const createPurchase = async ({
  name,
  description,
  cost,
  date,
  userId,
  labelId,
}: MinimumPurchase) => {
  const query = {
    text: `INSERT INTO ${purchaseTable}(name, description, cost, date, user_id, label_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
    values: [name, description, cost, date, userId, labelId],
  };

  try {
    const res = await pool.query(query);
    if (res.rowCount) return dbPurchaseToPurchase(res.rows[0]);
    console.error('Error: Could not create purchase (createPurchase())');
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Updates an existing purchase. Specify user within Purchase obj
 * @param purchase Purchase obj
 * @returns Updated Purchase obj if successful, else null
 */
const updatePurchase = async (purchase: Purchase) => {
  let count = 1;
  let text = `UPDATE ${purchaseTable} SET `;
  const values = [];
  for (const key in purchase) {
    if (key === 'id') continue;
    else if (purchase[key as keyof Purchase] === undefined) continue;

    text += `${key}=$${count++} `;
    values.push(purchase[key as keyof Purchase]);
  }
  text += `WHERE user_id=$${count}`;
  values.push(purchase.id);

  const query = { text, values };

  try {
    const res = await pool.query(query);
    if (res.rowCount) return dbPurchaseToPurchase(res.rows[0]);
    console.error('Error: Could not update purchase (updatePurchase())');
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Deletes a purchase
 * @param purchaseId UUID of a purchase
 * @returns True if the purchase was successfully deleted, else false
 */
const deletePurchase = async (purchaseId: string) => {
  const query = {
    text: `DELETE FROM ${purchaseTable} WHERE id=$1`,
    values: [purchaseId],
  };

  try {
    const res = await pool.query(query);
    if (res.rowCount) return true;
    console.error('Error: Could not delete purchase (deletePurchase())');
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * Gets all purchases related to a user
 * @param userId User uuid associated with the desired purchases
 * @returns List of Purchase objects associated with the user else null
 */
const getPurchasesByUserId = async (userId: string) => {
  const query = {
    text: `SELECT * FROM ${purchaseTable} WHERE user_id=$1 ORDER BY date`,
    values: [userId],
  };

  try {
    const res = await pool.query(query);
    if (res.rowCount) {
      const listOfPurchases: Purchase[] = [];
      for (const row of res.rows) {
        listOfPurchases.push(dbPurchaseToPurchase(row));
      }
      return listOfPurchases;
    }
    console.error('Error: Could not get purchases (getPurchasesByUserId())');
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Gets all purchases between the dates provided for the user referenced
 * @param param0.userId User id
 * @param param0.start Optional start date (Inclusive)
 * @param param0.end Optional end date (Inclusive)
 * @returns All Purchase obj between the start and end date for the user id provided
 */
const getPurchasesByUserIdAndDate = async ({
  userId,
  start,
  end,
}: {
  userId: string;
  start: Date | undefined;
  end: Date | undefined;
}) => {
  let query;
  if (end && !start) {
    query = {
      text: `SELECT * FROM ${purchaseTable} WHERE user_id=$1 AND date <= $3 ORDER BY date`,
      values: [userId, end.toISOString()],
    };
  } else if (!end && start) {
    query = {
      text: `SELECT * FROM ${purchaseTable} WHERE user_id=$1 AND date >= $2 ORDER BY date`,
      values: [userId, start.toISOString()],
    };
  } else if (end && start) {
    query = {
      text: `SELECT * FROM ${purchaseTable} WHERE user_id=$1 AND date >= $2 AND date <= $3 ORDER BY date`,
      values: [userId, start.toISOString(), end.toISOString()],
    };
  } else {
    query = {
      text: `SELECT * FROM ${purchaseTable} WHERE user_id=$1 ORDER BY date`,
      values: [userId],
    };
  }

  try {
    const res = await pool.query(query);
    if (res.rowCount) {
      const listOfPurchases: Purchase[] = [];
      for (const row of res.rows) {
        listOfPurchases.push(dbPurchaseToPurchase(row));
      }
      return listOfPurchases;
    }
    console.error(
      'Error: Could not get purchases (getPurchasesByUserIdAndDate())',
    );
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export {
  Purchase,
  MinimumPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchasesByUserId,
  getPurchasesByUserIdAndDate,
};
