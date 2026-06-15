import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers";

test.beforeEach(async ({ page }) => {
  await loginViaApi(page, "featureuser", "feature-pass-123");
});

test("console tab embeds CasaOS in an iframe at the configured URL", async ({
  page,
}) => {
  await page.goto("/console");
  const iframe = page.getByTestId("casaos-iframe");
  await expect(iframe).toHaveAttribute("src", "http://casaos.example.test/");
});
