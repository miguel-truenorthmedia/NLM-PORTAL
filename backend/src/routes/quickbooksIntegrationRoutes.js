import { Router } from "express";
import { config } from "../config.js";
import { requireAuth, requireAdminOrCeo } from "../middleware/authMiddleware.js";
import {
  getNormalizedInvoiceDetail,
  listNormalizedInvoices,
} from "../services/quickbooksInvoiceService.js";
import {
  beginQuickBooksConnect,
  completeQuickBooksCallback,
  getQuickBooksConnectionStatus,
} from "../services/quickbooksOAuthService.js";

const router = Router();

function safeErrorMessage(error, fallback = "QuickBooks request failed") {
  const raw = String(error?.message || fallback);
  // Avoid leaking internal paths / token-ish strings
  if (/token|secret|authorization|bearer/i.test(raw)) {
    return fallback;
  }
  return raw.slice(0, 300);
}

function frontendRedirect(kind, reason = "") {
  const base =
    kind === "error" ? config.qboFrontendErrorUrl : config.qboFrontendSuccessUrl;
  try {
    const url = new URL(base);
    if (kind === "error" && reason) {
      url.searchParams.set("reason", reason.slice(0, 120));
    }
    return url.toString();
  } catch {
    return base;
  }
}

/** Connection status — never returns tokens */
router.get("/status", requireAuth, requireAdminOrCeo, async (_req, res) => {
  try {
    const status = await getQuickBooksConnectionStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error) });
  }
});

/**
 * Start OAuth — redirects admin browser to Intuit.
 * Must be opened in the browser while logged in as admin (Bearer token via
 * Authorization header does not apply to top-level redirects; use a short-lived
 * session fetch that returns the URL, or navigate with cookie — we return URL
 * as JSON when Accept wants JSON, else redirect).
 */
router.get("/connect", requireAuth, requireAdminOrCeo, async (req, res) => {
  try {
    if (config.qboEnvironment === "production") {
      return res.status(403).json({
        error: "Production QuickBooks connect is disabled for Phase 1. Use sandbox.",
      });
    }
    const url = await beginQuickBooksConnect(req.user);
    const wantsJson =
      req.query.format === "json" ||
      String(req.headers.accept || "").includes("application/json");
    if (wantsJson) {
      return res.json({ authorizeUrl: url });
    }
    return res.redirect(302, url);
  } catch (error) {
    return res.status(400).json({ error: safeErrorMessage(error) });
  }
});

/**
 * Intuit OAuth callback — validates state, stores tokens, redirects to frontend.
 * Auth is via OAuth state (bound to admin user at connect time), not Bearer JWT.
 */
router.get("/callback", async (req, res) => {
  try {
    if (req.query.error) {
      return res.redirect(
        302,
        frontendRedirect("error", String(req.query.error_description || req.query.error))
      );
    }

    await completeQuickBooksCallback({
      code: req.query.code,
      state: req.query.state,
      realmId: req.query.realmId,
    });

    return res.redirect(302, frontendRedirect("success"));
  } catch (error) {
    console.warn("[quickbooks] OAuth callback failed:", safeErrorMessage(error));
    return res.redirect(302, frontendRedirect("error", safeErrorMessage(error)));
  }
});

/** Read-only sandbox/production invoices (normalized) */
router.get("/invoices", requireAuth, requireAdminOrCeo, async (req, res) => {
  try {
    const maxResults = Number(req.query.limit || req.query.maxResults || 1000);
    const result = await listNormalizedInvoices({ maxResults });
    res.json(result);
  } catch (error) {
    const status = Number(error.status) >= 400 ? Number(error.status) : 500;
    res.status(status).json({ error: safeErrorMessage(error) });
  }
});

/** Read-only: single invoice detail from QuickBooks (normalized) */
router.get("/invoices/:invoiceId", requireAuth, requireAdminOrCeo, async (req, res) => {
  try {
    const result = await getNormalizedInvoiceDetail(req.params.invoiceId);
    res.json(result);
  } catch (error) {
    const status = Number(error.status) >= 400 ? Number(error.status) : 500;
    if (status === 404) {
      return res.status(404).json({ error: "Invoice not found in QuickBooks" });
    }
    res.status(status).json({ error: safeErrorMessage(error) });
  }
});

export default router;
