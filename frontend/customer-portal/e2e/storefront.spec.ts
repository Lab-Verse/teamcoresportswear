import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const api = "http://127.0.0.1:3011";
const accounts = JSON.parse(
  readFileSync(resolve("../../.local/review-accounts.json"), "utf8"),
);
let auth: {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
};
const publicRoutes = [
  "/",
  "/categories",
  "/products",
  "/categories/soccer",
  "/products/soccer-smsc-101",
  "/custom-uniforms",
  "/private-label",
  "/manufacturing-process",
  "/about",
  "/wholesale",
  "/contact",
  "/faq",
  "/help",
  "/size-guide",
  "/shipping-delivery",
  "/returns-refunds",
  "/payment-options",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
  "/accessibility",
  "/cart",
  "/quote-basket",
  "/design-studio",
];
test.beforeAll(async ({ request }) => {
  const response = await request.post(api + "/auth/login", {
    data: { email: accounts.buyer.email, password: accounts.buyer.password },
  });
  expect(response.ok()).toBeTruthy();
  auth = (await response.json()).data;
});
async function signIn(page: Page) {
  await page.addInitScript(
    (value) =>
      localStorage.setItem(
        "teamcore-customer-auth-v1",
        JSON.stringify({
          state: { ...value, isAuthenticated: true },
          version: 0,
        }),
      ),
    auth,
  );
}
test("all public routes render and retain working local assets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of publicRoutes) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("header .tc-brand")).toHaveAttribute(
      "aria-label",
      "Team Core Sports Wear home",
    );
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((i) => i.complete && !i.naturalWidth && i.getAttribute("src"))
        .map((i) => i.src),
    );
    expect(broken, route).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      route,
    ).toBeFalsy();
  }
  expect(errors).toEqual([]);
});
test("responsive home and product layouts fit six viewport sizes", async ({
  page,
}) => {
  for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of ["/", "/products/soccer-smsc-101", "/private-label"]) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        `${route} at ${width}`,
      ).toBeFalsy();
    }
    if (width === 390 || width === 1440) {
      await page.goto("/");
      await expect(
        page.getByRole("heading", {
          name: "TEAM CORE SPORTS WEAR. MADE FOR YOUR TEAM.",
        }),
      ).toBeVisible();
      await page.screenshot({
        path: `../../docs/teamcore/home-${width}.png`,
        fullPage: true,
      });
    }
  }
});
test("header search, URL sorting, no results and mobile sport filters work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("Soccer");
  await page
    .getByRole("button", { name: "Search products", exact: true })
    .click();
  await expect(page).toHaveURL(/search\?search=Soccer/);
  await expect(page.locator(".tc-product").first()).toBeVisible();
  await page
    .getByRole("combobox", { name: "Sort by", exact: true })
    .selectOption("name_asc");
  await expect(page).toHaveURL(/sort=name_asc/);
  await page.goto("/search?search=does-not-exist-98765");
  await expect(
    page.getByRole("heading", { name: "No products match just yet." }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Basketball", exact: true })
    .click();
  await expect(page).toHaveURL(/categories\/basketball/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".tc-product").first()).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
});
test("variant quantities and quote submission preserve the customer journey", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/products/soccer-smsc-101");
  await page.getByRole("button", { name: "Size: M", exact: true }).click();
  await page.getByLabel("Quantity", { exact: true }).fill("14");
  await expect(
    page.getByRole("button", { name: /Add to quote basket/ }),
  ).toBeDisabled();
  await page.getByLabel("Quantity", { exact: true }).fill("15");
  await page.getByRole("button", { name: /Add to quote basket/ }).click();
  await page.goto("/quote-basket");
  await expect(
    page.getByText("Elite Sublimated Soccer Jersey", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Request your quotation", exact: true })
    .click();
  await page
    .getByLabel("Company / team name", { exact: true })
    .fill("Local Team Review");
  await page.getByLabel("Country code (e.g. PK)", { exact: true }).fill("PK");
  await page.getByLabel("Delivery city", { exact: true }).fill("Sialkot");
  await page
    .getByLabel("Delivery address", { exact: true })
    .fill("Local review address");
  await page
    .getByLabel("Anything else we should know?")
    .fill("Local regression request; no production order.");
  await page
    .getByRole("button", { name: "Send quotation request", exact: true })
    .click();
  await expect(page).toHaveURL(/request-quote\/success\//);
  await expect(page.getByText(/Reference:/)).toBeVisible();
  await page.screenshot({
    path: "../../docs/teamcore/quote-success.png",
    fullPage: false,
  });
});
test("customer account routes and private redirects remain functional", async ({
  page,
}) => {
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/login/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await signIn(page);
  for (const path of [
    "/account",
    "/account/profile",
    "/account/orders",
    "/account/wholesale",
    "/account/designs",
    "/account/addresses",
    "/account/wishlist",
    "/account/reviews",
    "/account/returns",
    "/account/notifications",
    "/account/chat",
    "/account/settings",
  ]) {
    await page.goto(path);
    await expect(page.locator("#account-content")).toBeVisible();
    await expect(page.locator(".account-nav")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      path,
    ).toBeFalsy();
  }
  await page.screenshot({
    path: "../../docs/teamcore/account-review.png",
    fullPage: false,
  });
});
test("contact requirements are sent through the real local contact service", async ({
  page,
}) => {
  await page.goto("/contact?topic=Private%20label%20enquiry");
  await page.getByLabel("Your name", { exact: true }).fill("Local Reviewer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("review@teamcore.example");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Please review this isolated private label test brief.");
  await page
    .getByText("Add team order details (optional)", { exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Sport", exact: true })
    .selectOption("Soccer");
  await page.getByLabel("Approximate quantity", { exact: true }).fill("30");
  await page.getByLabel("Delivery country", { exact: true }).fill("Pakistan");
  await page
    .getByRole("button", { name: "Send your message", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your message has been received." }),
  ).toBeVisible();
  await expect(page.getByText(/Reference:/)).toBeVisible();
});
test("core screens have no automated AA accessibility violations", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/products",
    "/products/soccer-smsc-101",
    "/contact",
    "/login",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
});
test("design studio saves a real private draft and restores it from the account", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/design-studio");
  await page.locator(".studio-product").first().click();
  await expect(page.locator(".studio-stage svg").first()).toBeVisible();
  await page
    .locator(".studio-steps button")
    .filter({ hasText: "Save & refine" })
    .click();
  await page
    .getByLabel("Give your design a name", { exact: true })
    .fill("Local browser design review");
  const saved = page.waitForResponse(
    (r) =>
      r.url().includes("/api/design-studio/projects") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save design", exact: true }).click();
  expect((await saved).ok()).toBeTruthy();
  await page.screenshot({
    path: "../../docs/teamcore/studio-review.png",
    fullPage: false,
  });
  await page.goto("/account/designs");
  await expect(
    page.getByText("Local browser design review", { exact: true }).first(),
  ).toBeVisible();
});
