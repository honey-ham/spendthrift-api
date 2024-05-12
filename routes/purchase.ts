import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/purchases/:userId?', (req: Request, res: Response) => {});

router.post('/purchases/create/', (req: Request, res: Response) => {});

router.delete(
    '/purchases/:purchaseId/:userId?',
    (req: Request, res: Response) => {},
);

export default router;
