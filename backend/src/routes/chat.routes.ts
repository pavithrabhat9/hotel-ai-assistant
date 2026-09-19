import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { validateBody, chatRequestSchema } from '../middleware/requestValidator';

const router = Router();

router.post('/', validateBody(chatRequestSchema), (req, res, next) => {
  chatController.sendMessage(req, res, next);
});

router.get('/topics', (req, res, next) => {
  chatController.getTopics(req, res, next);
});

export default router;
