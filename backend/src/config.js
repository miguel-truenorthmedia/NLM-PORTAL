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
  // QuickBooks Online (sandbox development first)
  qboClientId: process.env.QBO_CLIENT_ID || "",
  qboClientSecret: process.env.QBO_CLIENT_SECRET || "",
  /** Legacy/manual tokens — preferred source is Mongo QuickBooksConnection after OAuth */
  qboRefreshToken: process.env.QBO_REFRESH_TOKEN || "",
  qboRealmId: process.env.QBO_REALM_ID || "",
  qboEnvironment: (process.env.QBO_ENVIRONMENT || "sandbox").toLowerCase(),
  /** Must match Redirect URI registered in Intuit Developer (NLM-app) */
  qboRedirectUri: process.env.QBO_REDIRECT_URI || "",
  /** Browser redirect after successful OAuth (no tokens in URL) */
  qboFrontendSuccessUrl:
    process.env.QBO_FRONTEND_SUCCESS_URL ||
    "http://localhost:5173/accounting/invoices?qbo=connected",
  qboFrontendErrorUrl:
    process.env.QBO_FRONTEND_ERROR_URL ||
    "http://localhost:5173/accounting/invoices?qbo=error",
  // Slack — accounting invoice alerts
  slackInvoiceWebhookUrl: process.env.SLACK_INVOICE_WEBHOOK_URL || "",
  // Slack — Sales outreach sheet activity
  slackOutreachWebhookUrl: process.env.SLACK_OUTREACH_WEBHOOK_URL || "",
  // BIGO Ads OpenAPI
  bigoAdsClientId: process.env.BIGO_CLIENT_ID || "",
  bigoAdsClientSecret: process.env.BIGO_CLIENT_SECRET || "",
  bigoAdsAccessToken: process.env.BIGO_ACCESS_TOKEN || "",
  bigoAdsRefreshToken: process.env.BIGO_REFRESH_TOKEN || "",
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
/** App credentials present — enough to start OAuth */
export const hasQuickBooksAppConfig = Boolean(config.qboClientId && config.qboClientSecret);

/**
 * Legacy: env refresh + realm (invoice alerts used this before OAuth).
 * Runtime connection status should use getQuickBooksConnectionStatus().
 */
export const hasQuickBooksConfig = Boolean(
  hasQuickBooksAppConfig && config.qboRefreshToken && config.qboRealmId
);
export const hasSlackInvoiceWebhook = Boolean(config.slackInvoiceWebhookUrl);
export const hasSlackOutreachWebhook = Boolean(config.slackOutreachWebhookUrl);
