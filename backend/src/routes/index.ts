import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'This is from the backend' });
});

export default router;