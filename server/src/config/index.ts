import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-key-32chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key-32chars',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  uploads: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'application/pdf,image/jpeg,image/png').split(','),
  },

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    enabled: process.env.AI_ENABLED === 'true',
  },
};
