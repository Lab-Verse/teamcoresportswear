import { test, expect } from "@playwright/test";

test("hero rotates, pauses, and supports arrows, dots, keyboard and swipe", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const hero = page.getByRole("region", {
    name: "Team Core uniform collections",
  });
  const soccer = hero.getByRole("button", { name: "Show Soccer uniforms" });
  await expect(soccer).toHaveAttribute("aria-pressed", "true");
  await expect(hero.locator("img")).toHaveCount(1);
  await page.clock.runFor(7100);
  await expect(
    hero.getByRole("button", { name: "Show Basketball uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
  await hero.getByRole("button", { name: "Pause uniform slideshow" }).click();
  await page.clock.runFor(14000);
  await expect(
    hero.getByRole("button", { name: "Show Basketball uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
  await soccer.click();
  await hero.getByRole("button", { name: "Next uniform collection" }).click();
  await expect(
    hero.getByRole("button", { name: "Show Basketball uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await expect(
    hero.getByRole("button", { name: "Show American Football uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
  await hero.locator(".tc-carousel-stage").evaluate((element) => {
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 220,
        bubbles: true,
        pointerType: "touch",
      }),
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 100,
        bubbles: true,
        pointerType: "touch",
      }),
    );
  });
  await expect(
    hero.getByRole("button", { name: "Show Baseball uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    hero.getByRole("link", { name: "Explore Baseball" }),
  ).toHaveAttribute("href", "/categories/baseball");
  await hero
    .getByRole("button", { name: "Previous uniform collection" })
    .click();
  await expect(
    hero.getByRole("button", { name: "Show American Football uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("reduced motion keeps slides still and capability cards open matching enquiries", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  const hero = page.getByRole("region", {
    name: "Team Core uniform collections",
  });
  await expect(
    hero.getByRole("button", { name: "Show Soccer uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    hero.getByRole("button", { name: /uniform slideshow/ }),
  ).toHaveCount(0);
  await page.clock.runFor(21000);
  await expect(
    hero.getByRole("button", { name: "Show Soccer uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
  await hero.getByRole("button", { name: "Show Rugby uniforms" }).click();
  await expect(
    hero.getByRole("button", { name: "Show Rugby uniforms" }),
  ).toHaveAttribute("aria-pressed", "true");
  const capabilities = page.getByRole("region", {
    name: "Technology & Fabric Capabilities",
  });
  await expect(capabilities.getByRole("link")).toHaveCount(12);
  await capabilities
    .getByRole("link", { name: /Sublimation printing/ })
    .click();
  await expect(page).toHaveURL(/\/contact\?topic=Sublimation/);
  await expect(
    page.getByRole("textbox", { name: "What can we help with?" }),
  ).toHaveValue("Sublimation printing enquiry");
});
