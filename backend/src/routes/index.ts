import { Router } from 'express';
import chatRoutes from './chat.routes';
import availabilityRoutes from './availability.routes';
import { healthController } from '../controllers/health.controller';

const router = Router();

router.get('/health', (req, res) => healthController.check(req, res));
router.use('/chat', chatRoutes);
router.use('/availability', availabilityRoutes);

export default router;
