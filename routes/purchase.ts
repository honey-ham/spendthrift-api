import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/purchase/all/:userId?', (req: Request, res: Response) => {});

router.get(
    '/purchase/:purchaseId/:userId?',
    (req: Request, res: Response) => {},
);

router.post('/purchase', (req: Request, res: Response) => {});

router.put('/purchase', (req: Request, res: Response) => {});

router.delete(
    '/purchase/:purchaseId/:userId?',
    (req: Request, res: Response) => {},
);

export default router;
