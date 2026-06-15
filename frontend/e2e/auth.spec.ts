import { expect, test } from "@playwright/test";
import { addVirtualYubiKey } from "./helpers";

// Full lifecycle on e2euser: password-only login → register a YubiKey →
// log out → log back in, this time requiring the key (simulated touch).
test("password login, register key, then key-gated login", async ({ page }) => {
  await addVirtualYubiKey(page);

  // 1. First login — no key registered yet, so password alone logs in.
  await page.goto("/login");
  await page.getByLabel("Username").fill("e2euser");
  await page.getByLabel("Password").fill("e2e-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("dashboard")).toBeVisible();

  // 2. Register a security key via the virtual authenticator.
  await page.getByRole("link", { name: "Security keys" }).click();
  await page.getByRole("button", { name: "Register a new key" }).click();
  await expect(page.getByText("Added", { exact: false })).toBeVisible();

  // 3. Log out.
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  // 4. Log back in — now a second factor is required and the virtual key
  //    auto-verifies it.
  await page.getByLabel("Username").fill("e2euser");
  await page.getByLabel("Password").fill("e2e-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("dashboard")).toBeVisible();
});

test("unknown credentials are rejected", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("e2euser");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});
