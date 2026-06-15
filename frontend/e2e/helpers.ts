import type { Page } from "@playwright/test";

const BACKEND = "http://localhost:8000";

/**
 * Attach a virtual FIDO2 authenticator via the Chrome DevTools Protocol so the
 * full YubiKey ceremony runs without physical hardware. User presence + user
 * verification are auto-simulated, mimicking a key touch.
 */
export async function addVirtualYubiKey(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");
  const { authenticatorId } = await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "usb",
      hasResidentKey: false,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return { client, authenticatorId };
}

/**
 * Log in by injecting a refresh token into localStorage. Works for users
 * without a security key (password-only). The app's axios interceptor exchanges
 * the refresh token for an access token on first load.
 */
export async function loginViaApi(page: Page, username: string, password: string) {
  const resp = await page.request.post(`${BACKEND}/api/auth/login/`, {
    data: { username, password },
  });
  const body = await resp.json();
  const refresh = body.tokens.refresh as string;
  await page.addInitScript((token) => {
    window.localStorage.setItem("nlc.refresh", token);
  }, refresh);
}
