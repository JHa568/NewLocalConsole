import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers";

test("unauthenticated visit redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("authenticated user can move between all tabs", async ({ page }) => {
  await loginViaApi(page, "featureuser", "feature-pass-123");
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard")).toBeVisible();

  await page.getByRole("link", { name: "Finance" }).click();
  await expect(page.getByTestId("finance")).toBeVisible();

  await page.getByRole("link", { name: "Calendar" }).click();
  await expect(page.getByTestId("calendar")).toBeVisible();

  await page.getByRole("link", { name: "Console" }).click();
  await expect(page).toHaveURL(/\/console/);

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByTestId("dashboard")).toBeVisible();
});
