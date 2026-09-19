import { Router } from 'express';
import { availabilityController } from '../controllers/availability.controller';
import { validateBody, availabilityRequestSchema } from '../middleware/requestValidator';

const router = Router();

router.post('/', validateBody(availabilityRequestSchema), (req, res, next) => {
  availabilityController.checkAvailability(req, res, next);
});

export default router;
