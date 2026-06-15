import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers";

// Google Calendar/Tasks are mocked at the network boundary so these tests need
// no real Google account. We keep a tiny in-memory store to emulate create+list.
test.beforeEach(async ({ page }) => {
  await loginViaApi(page, "featureuser", "feature-pass-123");

  const events: Record<string, unknown>[] = [];
  const tasks: Record<string, unknown>[] = [];

  await page.route("**/api/calendar/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    if (url.pathname.endsWith("/events/")) {
      if (method === "POST") {
        const body = req.postDataJSON();
        const event = {
          id: `evt-${events.length + 1}`,
          summary: body.summary,
          start: body.all_day
            ? { date: body.start }
            : { dateTime: body.start },
        };
        events.push(event);
        return route.fulfill({ status: 201, json: event });
      }
      return route.fulfill({ status: 200, json: events });
    }

    if (url.pathname.endsWith("/tasks/")) {
      if (method === "POST") {
        const body = req.postDataJSON();
        const task = {
          id: `task-${tasks.length + 1}`,
          title: body.title,
          due: body.due,
          status: "needsAction",
        };
        tasks.push(task);
        return route.fulfill({ status: 201, json: task });
      }
      return route.fulfill({ status: 200, json: tasks });
    }

    return route.fulfill({ status: 200, json: { connected: true } });
  });
});

test("create a timed event, an all-day event, and a task", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByTestId("calendar")).toBeVisible();
  await expect(page.getByText("Sun")).toBeVisible();

  // Timed event.
  await page.getByRole("button", { name: "+ Add" }).click();
  await page.getByRole("button", { name: "Event" }).click();
  await page.getByLabel("Summary").fill("Standup");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Standup").first()).toBeVisible();

  // All-day event.
  await page.getByRole("button", { name: "+ Add" }).click();
  await page.getByRole("button", { name: "All-day" }).click();
  await page.getByLabel("Summary").fill("Holiday");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Holiday").first()).toBeVisible();

  // Task.
  await page.getByRole("button", { name: "+ Add" }).click();
  await page.getByRole("button", { name: "Task" }).click();
  await page.getByLabel("Title").fill("Pay rent");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Pay rent").first()).toBeVisible();
});
