export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4010', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://inventrack:inventrack_dev_2024@inventrack-database:5432/inventrack_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'inventrack_jwt_secret_dev_2024_change_in_production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'inventrack_refresh_secret_dev_2024_change_in_production',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
};
