import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  GEMINI_API_KEY: string;
  FRONTEND_URL: string;
  ALLOWED_ORIGINS: string[];
}

function loadEnv(): EnvConfig {
  const required = ['GEMINI_API_KEY'] as const;
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key] || process.env[key]!.trim() === '' || process.env[key] === `your_${key.toLowerCase()}_here`) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n❌ Missing required environment variables:\n${missing.map((k) => `   - ${k}`).join('\n')}\n\nCopy .env.example to .env and fill in the values.\n`
    );
    process.exit(1);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Support comma-separated list for multiple origins (e.g. localhost + Vercel preview URLs)
  const allowedOrigins = frontendUrl.split(',').map((u) => u.trim()).filter(Boolean);

  return {
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    FRONTEND_URL: frontendUrl,
    ALLOWED_ORIGINS: allowedOrigins,
  };
}

export const env = loadEnv();
