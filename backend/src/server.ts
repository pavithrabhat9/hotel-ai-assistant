import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`\n🏨 Hotel Guest Assistant Backend`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Server:      http://localhost:${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/api/health`);
  console.log(`   Frontend:    ${env.FRONTEND_URL}`);
  console.log(`   LLM:         Google Gemini`);
  console.log(`\n   Ready to assist guests! 🛎️\n`);
});
