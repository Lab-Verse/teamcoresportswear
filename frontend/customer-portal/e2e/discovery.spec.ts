import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const api = "http://127.0.0.1:3011";

test("sport discovery displays the API collection and switches with the keyboard", async ({
  page,
  request,
}) => {
  const initial = (
    await (
      await request.get(
        api + "/storefront/products?limit=4&sort=newest&categorySlug=soccer",
      )
    ).json()
  ).data.items;
  await page.goto("/");
  const section = page.getByRole("region", {
    name: "Explore your sport",
    exact: true,
  });
  await expect(section.locator("article.tc-product")).toHaveCount(
    initial.length,
  );
  await expect(section.locator("article h3 a")).toHaveText(
    initial.map((p: { name: string }) => p.name),
  );
  const baseball = section.getByRole("button", {
    name: "Baseball",
    exact: true,
  });
  await baseball.focus();
  const response = await request.get(
    api + "/storefront/products?limit=4&sort=newest&categorySlug=baseball",
  );
  await page.keyboard.press("Enter");
  const products = (await response.json()).data.items;
  await expect(baseball).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator("article h3 a")).toHaveText(
    products.map((p: { name: string }) => p.name),
  );
  await expect(
    section.getByRole("link", { name: "View the full range" }),
  ).toHaveAttribute("href", "/categories/baseball");
});

test("bulk planner preserves details in the real contact submission", async ({
  page,
}) => {
  await page.goto("/wholesale");
  const planner = page.getByRole("region", { name: "Plan your bulk order" });
  await planner
    .getByRole("combobox", { name: "Your sport", exact: true })
    .selectOption("soccer");
  await planner
    .getByRole("spinbutton", { name: "Approximate quantity" })
    .fill("35");
  await planner
    .getByRole("combobox", { name: "Buying for" })
    .selectOption("School or academy");
  await expect(
    planner.getByRole("link", { name: "Browse quote-ready designs" }),
  ).toHaveAttribute("href", "/products?mode=quote&category=soccer");
  await planner.getByRole("button", { name: "Continue your brief" }).click();
  await expect(page).toHaveURL(/\/contact\?topic=Bulk/);
  await page
    .getByText("Add team order details (optional)", { exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Sport", exact: true }),
  ).toHaveValue("Soccer");
  await expect(
    page.getByRole("textbox", { name: "Approximate quantity" }),
  ).toHaveValue("35");
  await expect(page.getByRole("textbox", { name: "Your message" })).toHaveValue(
    "Buying for: School or academy\n\n",
  );
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Discovery Review");
  await page
    .getByRole("textbox", { name: "Email address", exact: true })
    .fill("discovery-review@example.test");
  await page
    .getByRole("textbox", { name: "Your message" })
    .fill(
      "Buying for: School or academy\nWe need a custom team kit for our academy.",
    );
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/storefront/contact") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send your message" }).click();
  const sent = await response;
  expect(sent.ok()).toBeTruthy();
  expect(sent.request().postDataJSON().message).toContain("sport: Soccer");
  expect(sent.request().postDataJSON().message).toContain("quantity: 35");
  await expect(
    page.getByRole("heading", { name: "Your message has been received." }),
  ).toBeVisible();
});

test("recent history stores links only, reloads API details and can be cleared", async ({
  page,
}) => {
  await page.goto("/products/soccer-smsc-101");
  await expect(page.locator("h1")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("teamcore-browsing-v2") || "{}").state
            ?.recentlyViewed,
      ),
    )
    .toEqual(["soccer-smsc-101"]);
  await page.route(
    "**/api/storefront/products/soccer-smsc-101",
    async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.name = "Current API uniform name";
      await route.fulfill({ response, json: body });
    },
  );
  await page.goto("/");
  const recent = page.getByRole("region", {
    name: "Pick up where you left off",
  });
  await expect(recent.locator("article h3 a")).toHaveText([
    "Current API uniform name",
  ]);
  await recent.getByRole("button", { name: "Clear history" }).click();
  await expect(recent).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("teamcore-browsing-v2") || "{}").state
          .recentlyViewed,
    ),
  ).toEqual([]);
});

test("related designs come from the same category and exclude the viewed product", async ({
  page,
  request,
}) => {
  const response = await request.get(
    api + "/storefront/products?limit=5&sort=newest&categorySlug=soccer",
  );
  const products = (await response.json()).data.items
    .filter((p: { slug: string }) => p.slug !== "soccer-smsc-101")
    .slice(0, 4);
  await page.goto("/products/soccer-smsc-101");
  const related = page.getByRole("region", {
    name: "Find another look for your team.",
  });
  await expect(related.locator("article h3 a")).toHaveText(
    products.map((p: { name: string }) => p.name),
  );
  await expect(
    related.locator('article a[href="/products/soccer-smsc-101"]'),
  ).toHaveCount(0);
});

test("API failure can be retried and empty categories offer a useful next step", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/storefront/products?*", (route) => {
    const url = new URL(route.request().url());
    if (
      fail &&
      url.searchParams.get("categorySlug") === "soccer" &&
      url.searchParams.get("limit") === "4"
    )
      return route.fulfill({
        status: 503,
        json: { message: "Catalogue temporarily unavailable" },
      });
    return route.continue();
  });
  await page.goto("/");
  const section = page.getByRole("region", {
    name: "Explore your sport",
    exact: true,
  });
  await expect(section.getByRole("alert")).toContainText(
    "We couldn't load these designs.",
  );
  fail = false;
  await section.getByRole("button", { name: "Try again" }).click();
  await expect(section.locator("article.tc-product")).toHaveCount(4);
  await page.route("**/api/storefront/categories", (route) =>
    route.fulfill({ json: { success: true, data: [] } }),
  );
  await page.goto("/");
  await expect(
    section.getByText("Our collection is being prepared."),
  ).toBeVisible();
  await expect(
    section.getByRole("link", { name: /Tell us about your sport/ }),
  ).toHaveAttribute("href", "/contact");
});

test("new sections, lazy images and transparent logo work across mobile layouts", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page
        .getByRole("region", { name: "Explore your sport" })
        .locator("article.tc-product"),
    ).toHaveCount(4);
    const pause = page.getByRole("button", { name: "Pause uniform slideshow" });
    if (await pause.count()) await pause.click();
    const images = page.locator("img:visible");
    for (let i = 0; i < (await images.count()); i++) {
      await images.nth(i).scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          images
            .nth(i)
            .evaluate(
              (image: HTMLImageElement) =>
                image.complete && !!image.naturalWidth,
            ),
        )
        .toBeTruthy();
    }
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            [...document.images].filter(
              (i) =>
                i.getClientRects().length && (!i.complete || !i.naturalWidth),
            ).length,
        ),
      )
      .toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      `Home at ${width}`,
    ).toBeFalsy();
    expect(
      await page
        .locator("header .tc-brand img")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgba(0, 0, 0, 0)");
    expect(
      await page.evaluate(async () => {
        const image = new Image();
        image.src = "/teamcore/logo.png";
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return false;
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
      }),
    ).toBeTruthy();
  }
  for (const route of ["/", "/categories", "/wholesale", "/custom-uniforms"]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations, route).toEqual([]);
  }
});
