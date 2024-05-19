import { Router, type Request, type Response } from 'express';

import { createPurchase, type MinimumPurchase } from '../lib/purchase.js';
import { getDefaultLabelByName } from '../lib/label.js';

const router = Router();

router.get('/purchase/all/:userId?', (req: Request, res: Response) => {});

router.get(
  '/purchase/:purchaseId/:userId?',
  async (req: Request, res: Response) => {},
);

router.post('/purchase/:userId?', async (req: Request, res: Response) => {
  const id = req.params.userId ?? res.locals.userId;

  if (
    !res.locals.isSuperuser &&
    req.params.userId &&
    res.locals.userId !== req.params.userId
  )
    return res
      .status(401)
      .json({ error: 'You cannot verify another users account' });

  const name: string | null = req.body.name ?? null;
  const description: string | null = req.body.description ?? null;
  let cost: number | string | null = req.body.cost ?? null;
  if (cost !== null) cost = Math.round(Number(cost) * 1000) / 1000; // Rounding to 3 decimal places
  let date: number | string | null = req.body.date ?? null; // UNIX Timestamp
  if (date !== null) date = date?.toString();
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
  else if (!date)
    return res
      .status(400)
      .json({ error: 'Date is a required field for purchase' });
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

  createPurchase({
    name,
    description,
    cost,
    date,
    userId: id,
    labelId: labelObj.id,
  } as MinimumPurchase);
});

router.put('/purchase', (req: Request, res: Response) => {});

router.delete(
  '/purchase/:purchaseId/:userId?',
  (req: Request, res: Response) => {},
);

export default router;
