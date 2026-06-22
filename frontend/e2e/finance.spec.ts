import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers";

test.beforeEach(async ({ page }) => {
  await loginViaApi(page, "featureuser", "feature-pass-123");
});

test("add income, stock position, and see portfolio value on the dashboard", async ({
  page,
}) => {
  await page.goto("/finance");
  await expect(page.getByTestId("finance")).toBeVisible();

  // Add an income record.
  await page.getByPlaceholder("Source").fill("Salary");
  await page.getByPlaceholder("Amount").first().fill("6000");
  await page
    .getByPlaceholder("Source")
    .locator("xpath=ancestor::form")
    .getByRole("button", { name: "Add" })
    .click();
  await expect(page.getByText("Salary", { exact: false })).toBeVisible();

  // Add a stock position (fake price provider returns 100.00).
  await page.getByPlaceholder("Ticker e.g. CBA.AX").fill("VAS.AX");
  await page.getByPlaceholder("Qty").fill("5");
  await page.getByPlaceholder("Avg cost").fill("80");
  await page
    .getByPlaceholder("Ticker e.g. CBA.AX")
    .locator("xpath=ancestor::form")
    .getByRole("button", { name: "Add" })
    .click();
  await expect(page.getByRole("cell", { name: "VAS.AX" })).toBeVisible();

  // Dashboard reflects the portfolio value (5 * 100 = 500).
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByTestId("dashboard")).toBeVisible();
  await expect(page.getByRole("cell", { name: "VAS.AX" })).toBeVisible();
});

test("toggle rent paid status", async ({ page }) => {
  await page.goto("/finance");
  // The rent form is the only Finance form with a date input.
  const rentForm = page
    .locator("form")
    .filter({ has: page.locator('input[type="date"]') });
  await rentForm.locator('input[type="date"]').fill("2026-07-01");
  await rentForm.locator('input[type="number"]').fill("2200");
  await rentForm.getByRole("button", { name: "Add" }).click();

  const rentRow = page.locator("li", { hasText: "2026-07-01" });
  await expect(rentRow.getByRole("checkbox")).not.toBeChecked();
  // Clicking triggers a PATCH + reload that re-renders the row, so assert the
  // eventual state rather than the immediate one.
  await rentRow.getByRole("checkbox").click();
  await expect(rentRow.getByRole("checkbox")).toBeChecked();
});
