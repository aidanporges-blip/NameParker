/* System test: the "class complete" story the way a professor uses it, in a real browser (Playwright).
   Opens the app, resets, practices Section D by matching initials to names until the class is complete,
   then checks the completion card and the home screen. Everything runs: page, styles, clicks, saving. */

const { test, expect } = require("@playwright/test");

// Initials of a full name, the same way the app shows them on the face card ("Noah Patel" -> "NP").
const initialsOf = (name) => name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase();

test("practicing Research Seminar to 6 of 6 shows Class complete", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Moderator controls/ }).click();
  await page.getByRole("button", { name: "Reset all progress" }).click();

  await page.getByRole("button", { name: /Research Seminar/ }).click();
  await page.getByRole("button", { name: /Practice these names/ }).click();
  await page.getByRole("button", { name: /Start practice/ }).click();

  // Answer by matching the initials on screen to a name, until the completion card appears.
  const doneCard = page.locator(".done-card");
  for (let i = 0; i < 30 && !(await doneCard.isVisible()); i++) {
    const shown = (await page.locator(".q-initials").innerText()).trim();
    const options = page.locator('[data-action="answer"]');
    const names = await options.allInnerTexts();
    await options.nth(names.findIndex((n) => initialsOf(n) === shown)).click();
    if (!(await doneCard.isVisible())) await page.getByRole("button", { name: /Next name/ }).click();
  }

  await expect(doneCard).toContainText("Class complete!");
  await expect(doneCard).toContainText("You know all 6 names in Research Seminar.");

  // Leave practice and look at the home screen.
  await page.getByRole("button", { name: "End practice" }).click();
  await page.getByRole("button", { name: "Back to roster" }).click();
  await page.getByRole("button", { name: "Today" }).click();
  await expect(page.locator('[data-arg="D"]')).toContainText("Complete");
});
