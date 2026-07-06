import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  useMongoDb: process.env.USE_MONGODB === "true",
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  ringbaToken: process.env.RINGBA_API_TOKEN || "",
  ringbaAccountId: process.env.RINGBA_ACCOUNT_ID || "",
  googleSheetsId: process.env.GOOGLE_SHEETS_ID || "",
  googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  bigoEmailClientId: process.env.BIGO_EMAIL_GMAIL_CLIENT_ID || "",
  bigoEmailClientSecret: process.env.BIGO_EMAIL_GMAIL_CLIENT_SECRET || "",
  bigoEmailRefreshToken: process.env.BIGO_EMAIL_GMAIL_REFRESH_TOKEN || "",
};

export const hasMongoConfig = Boolean(config.useMongoDb && config.mongoUri);
export const hasAuthConfig = Boolean(config.jwtSecret);

export const hasRingbaConfig = Boolean(config.ringbaToken && config.ringbaAccountId);
export const hasGoogleSheetsConfig = Boolean(
  config.googleSheetsId && config.googleServiceAccountEmail && config.googlePrivateKey
);
export const hasBigoEmailConfig = Boolean(
  config.bigoEmailClientId && config.bigoEmailClientSecret && config.bigoEmailRefreshToken
);
