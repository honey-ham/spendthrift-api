import { Router, type Request, type Response } from 'express';

import {
  createPurchase,
  type MinimumPurchase,
  getPurchasesByUserId,
  getPurchasesByUserIdAndDate,
} from '../lib/purchase.js';
import { getDefaultLabelByName } from '../lib/label.js';

const router = Router();

router.get('/purchase/:userId?', async (req: Request, res: Response) => {
  const id = req.params.userId ?? res.locals.userId;

  if (
    !res.locals.isSuperuser &&
    req.params.userId &&
    res.locals.userId !== req.params.userId
  )
    return res
      .status(401)
      .json({ error: 'You cannot see another users purchases' });

  // Optional query params
  let startDate: Date | undefined = new Date(req.query.start as string);
  if (isNaN(startDate as unknown as number)) startDate = undefined;
  let endDate: Date | undefined = new Date(req.query.end as string);
  if (isNaN(endDate as unknown as number)) endDate = undefined;

  let purchases;
  if (startDate || endDate)
    purchases = await getPurchasesByUserIdAndDate({
      userId: id,
      start: startDate,
      end: endDate,
    });
  else purchases = await getPurchasesByUserId(id);

  if (!purchases)
    return res.status(500).json({ error: 'Unable to get purchases' });
  return res.status(200).json({ data: purchases });
});

// TODO: Get a specific purchase
// router.get(
//   '/purchase/:purchaseId/:userId?',
//   async (req: Request, res: Response) => {},
// );

router.post('/purchase/:userId?', async (req: Request, res: Response) => {
  const id = req.params.userId ?? res.locals.userId;

  if (
    !res.locals.isSuperuser &&
    req.params.userId &&
    res.locals.userId !== req.params.userId
  )
    return res
      .status(401)
      .json({ error: 'You cannot create a purchase for another user' });

  const name: string | null = req.body.name ?? null;
  const description: string | null = req.body.description ?? null;
  let cost: number | string | null = req.body.cost ?? null;
  if (cost !== null) cost = Math.round(Number(cost) * 1000) / 1000; // Rounding to 3 decimal places
  let date: Date = req.body.date ? new Date(req.body.date) : new Date();
  // Label name
  const label: string | null = req.body.label ?? null;

  if (!name)
    return res
      .status(400)
      .json({ error: 'Name is a required field for purchase' });
  else if (!cost)
    return res
      .status(400)
      .json({ error: 'Cost is a required field for purchase' });
  else if (isNaN(date as unknown as number))
    return res.status(400).json({
      error: `Invalid date format. Try something like ${new Date().toISOString()}`,
    });
  else if (cost > 999999999999)
    return res.status(400).json({ error: 'Cost is too large to store' });
  else if (!label)
    return res
      .status(400)
      .json({ error: 'Label is a required field for purchase' });

  // Getting label id
  const labelObj = await getDefaultLabelByName(label);
  if (!labelObj)
    return res.status(400).json({ error: `Could not find label '${label}'` });

  const purchase = await createPurchase({
    name,
    description,
    cost,
    date,
    userId: id,
    labelId: labelObj.id,
  } as MinimumPurchase);

  if (!purchase)
    return res.status(500).json({ error: 'Unable to create purchase' });
  return res.status(200).json({ message: 'Purchase successfully created' });
});

router.put('/purchase', (req: Request, res: Response) => {});

router.delete(
  '/purchase/:purchaseId/:userId?',
  (req: Request, res: Response) => {},
);

export default router;
