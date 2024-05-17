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

type DbPurchase = {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  date: string;
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
 * @returns
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
    text: `INSERT INTO ${purchaseTable}(name, description, cost, date, userId, labelId) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
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
    text: `SELECT * FROM ${purchaseTable} WHERE user_id=$1`,
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

export {
  Purchase,
  MinimumPurchase,
  createPurchase,
  deletePurchase,
  getPurchasesByUserId,
};
