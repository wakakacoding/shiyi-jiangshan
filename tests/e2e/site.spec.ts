import { test, expect } from "@playwright/test";

test("home opens the poetry collection", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("皆有诗意");
  await expect(page.locator(".poem-card")).toHaveCount(3);
  await page.getByRole("link", { name: "循诗入境", exact: true }).click();
  await expect(page).toHaveURL(/\/poems$/);
  await expect(page.locator("h1")).toHaveText("循诗入境");
});

test("keyword search and empty states work", async ({ page }) => {
  await page.goto("/poems");
  const search = page.getByRole("searchbox", { name: "搜索诗词" });
  await search.fill("寒江雪");
  await expect(page.locator(".poem-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "江雪", exact: true })).toBeVisible();
  await search.fill("绝不存在的一句诗");
  await expect(page.getByRole("heading", { name: "暂未寻得这首诗" })).toBeVisible();
  await page.getByRole("button", { name: "查看全部诗词" }).click();
  await expect(page.locator(".poem-card")).toHaveCount(12);
});

test("combined filters and direct URLs restore results", async ({ page }) => {
  await page.goto("/poems?q=%E6%98%8E%E6%9C%88&dynasty=%E5%AE%8B");
  await expect(page.getByRole("searchbox")).toHaveValue("明月");
  await expect(page.getByLabel("朝代", { exact: true })).toHaveValue("宋");
  await expect(page.locator(".poem-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "水调歌头·明月几时有" })).toBeVisible();
  await page.getByLabel("朝代", { exact: true }).selectOption("");
  await page.getByLabel("题材", { exact: true }).selectOption("山水田园");
  await expect(page.getByRole("heading", { name: "山居秋暝" })).toBeVisible();
});

test("detail sections and audio controls are usable", async ({ page }) => {
  await page.goto("/poems/shan-ju-qiu-ming");
  for (const heading of ["诗词原文", "白话译文", "创作背景", "作品赏析", "古意情怀", "作者小传", "参考与素材"]) {
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  const audio = page.locator(".detail-audio-button");
  await audio.click();
  await expect(audio).toHaveAttribute("aria-pressed", "true", { timeout: 15000 });
  await expect(page.locator(".audio-dock")).toBeVisible();
  await audio.click();
  await expect(audio).toHaveAttribute("aria-pressed", "false");
  await page.locator(".audio-dock-close").click();
  await expect(page.locator(".audio-dock")).toHaveCount(0);
});

test("artwork loads and changing poems never overlaps audio", async ({ page }) => {
  const failedResponses: string[] = [];
  page.on("response", (response) => { if (response.status() >= 400) failedResponses.push(response.url()); });
  await page.goto("/poems/shan-ju-qiu-ming");
  const artwork = page.locator(".artwork-frame img");
  await expect(artwork).toBeVisible();
  await expect.poll(() => artwork.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.locator(".detail-audio-button").click();
  await expect(page.locator(".detail-audio-button")).toHaveAttribute("aria-pressed", "true", { timeout: 15000 });
  await page.locator(".previous-next a").nth(1).click();
  await expect(page).toHaveURL(/\/poems\/jing-ye-si$/);
  await expect(page.locator(".detail-audio-button")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".detail-audio-button")).toHaveAttribute("data-state", "paused");
  expect(failedResponses).toEqual([]);
});

test("mobile navigation and layouts do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".mobile-nav summary").click();
  await page.locator(".mobile-nav-panel").getByRole("link", { name: "宋词" }).click();
  await expect(page).toHaveURL(/\/dynasty\/song$/);
  for (const path of ["/", "/poems", "/poems/shui-diao-ge-tou", "/authors/su-shi"]) {
    await page.goto(path);
    const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
  }
});

test("author, dynasty and topic pages list the right poems", async ({ page }) => {
  await page.goto("/authors/su-shi");
  await expect(page.getByRole("heading", { name: "苏轼", exact: true })).toBeVisible();
  await expect(page.locator(".poem-card")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "水调歌头·明月几时有" })).toBeVisible();
  await page.getByRole("link", { name: "水调歌头·明月几时有" }).click();
  await expect(page).toHaveURL(/\/poems\/shui-diao-ge-tou$/);

  await page.goto("/dynasty/tang");
  await expect(page.getByRole("heading", { name: "唐诗词" })).toBeVisible();
  await expect(page.locator(".poem-card")).toHaveCount(5);

  await page.goto("/topics/seasons");
  await expect(page.getByRole("heading", { name: "节令风物", exact: true })).toBeVisible();
  expect(await page.locator(".poem-card").count()).toBeGreaterThan(0);
});

test("unknown slugs and paths fall back to the 404 page", async ({ page }) => {
  for (const path of ["/poems/not-a-poem", "/authors/not-an-author", "/dynasty/not-a-dynasty", "/topics/not-a-topic", "/nowhere"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "此处无诗，只有山色" })).toBeVisible();
  }
});

test("audio failure shows the error state and can be retried", async ({ page }) => {
  await page.route("**/audio/**", (route) => route.abort());
  await page.goto("/poems/shan-ju-qiu-ming");
  await page.locator(".detail-audio-button").click();
  const button = page.locator(".detail-audio-button");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button).toHaveAttribute("data-state", "error");
  await expect(page.locator(".audio-dock")).toBeVisible();
  await expect(page.locator(".audio-dock")).toHaveAttribute("data-status", "error");
  await expect(page.getByText("加载失败，点击重试")).toBeVisible();
  await page.getByRole("button", { name: "暂停并关闭播放器" }).click();
  await expect(page.locator(".audio-dock")).toHaveCount(0);
});

test("about page does not overflow on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  await expect(page.locator("h1")).toBeVisible();
  const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
});
