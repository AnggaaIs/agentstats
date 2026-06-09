import * as cheerio from "cheerio";
import type { Element } from "domhandler";

const PATCH_INDEX_URL =
  "https://playvalorant.com/en-us/news/tags/patch-notes/";
const PLAY_VALORANT_URL = "https://playvalorant.com";
const PATCH_CACHE_SECONDS = 60 * 60 * 6;

export interface PatchSummary {
  version: string;
  publishedAt: string;
  title: string;
  url: string;
  agentChanges: Array<{
    agent: string;
    label: "Balance update" | "Bug fix";
    summary: string;
  }>;
  highlights: string[];
}

export interface PatchComparison {
  current: PatchSummary | null;
  previous: PatchSummary | null;
  source: "official" | "fallback";
}

interface PatchIndexItem {
  title?: string;
  publishedAt?: string;
  description?: { body?: string };
  action?: { payload?: { url?: string } };
}

interface RiotPageBlade {
  type?: string;
  title?: string;
  description?: { body?: string };
  publishDate?: string;
  richText?: { body?: string };
  items?: PatchIndexItem[];
}

interface RiotPage {
  title?: string;
  displayedPublishDate?: string;
  blades?: RiotPageBlade[];
}

interface NextData {
  props?: {
    pageProps?: {
      page?: RiotPage;
    };
  };
}

const FALLBACK_PATCH_SUMMARIES: PatchSummary[] = [
  {
    version: "12.10",
    publishedAt: "2026-05-27",
    title: "New Skirmish maps and replay sharing",
    url: "https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-12-10/",
    agentChanges: [
      {
        agent: "Miks",
        label: "Bug fix",
        summary: "M-Pulse received several reliability fixes.",
      },
      {
        agent: "Harbor",
        label: "Bug fix",
        summary: "Reckoning no longer disappears early when cast repeatedly.",
      },
    ],
    highlights: [
      "Skirmish maps D and E were added.",
      "Friend replay sharing became available for eligible modes.",
      "No direct agent or weapon balance changes were announced.",
    ],
  },
  {
    version: "12.09",
    publishedAt: "2026-05-12",
    title: "Neon and shotgun nerfs",
    url: "https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-12-09/",
    agentChanges: [
      {
        agent: "Neon",
        label: "Balance update",
        summary:
          "Air speed and High Gear fuel behavior were reduced to create more counterplay.",
      },
    ],
    highlights: [
      "Neon's airborne mobility and fuel economy were reduced.",
      "All shotguns became less accurate while moving.",
      "Bucky damage and spread were reduced at close range.",
    ],
  },
];

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function plainText(value: string): string {
  return normalizeText(cheerio.load(value, null, false).text());
}

function parseNextData(html: string): RiotPage {
  const $ = cheerio.load(html);
  const value = $("#__NEXT_DATA__").text();

  if (!value) {
    throw new Error("Official patch data was not found.");
  }

  const data = JSON.parse(value) as NextData;
  const page = data.props?.pageProps?.page;

  if (!page) {
    throw new Error("Official patch page was not found.");
  }

  return page;
}

function getVersion(title: string): string | null {
  return title.match(/patch notes\s+(\d+\.\d+)/i)?.[1] ?? null;
}

async function fetchOfficialPage(url: string): Promise<RiotPage> {
  const response = await fetch(url, {
    next: {
      revalidate: PATCH_CACHE_SECONDS,
      tags: ["official-patch-notes"],
    },
  });

  if (!response.ok) {
    throw new Error(`Official patch request failed with ${response.status}.`);
  }

  return parseNextData(await response.text());
}

async function getOfficialPatchItems(): Promise<PatchIndexItem[]> {
  const page = await fetchOfficialPage(PATCH_INDEX_URL);
  const grid = page.blades?.find((blade) => blade.type === "articleCardGrid");

  return (grid?.items ?? []).filter((item) =>
    /VALORANT Patch Notes \d+\.\d+/i.test(item.title ?? ""),
  );
}

function directListText(
  $: cheerio.CheerioAPI,
  element: Element,
): string {
  const clone = $(element).clone();
  clone.children("ul,ol").remove();
  return normalizeText(clone.text());
}

function extractHighlights(body: string): string[] {
  const $ = cheerio.load(body, null, false);
  const preferred: string[] = [];
  const secondary: string[] = [];
  let section = "";

  $.root()
    .children()
    .each((_, element) => {
      const tag = element.tagName?.toLowerCase();

      if (tag && /^h[1-6]$/.test(tag)) {
        section = normalizeText($(element).text()).toUpperCase();
        return;
      }

      if (tag !== "ul" && tag !== "ol") return;

      $(element)
        .children("li")
        .each((__, item) => {
          const text = directListText($, item);
          if (text.length < 24 || text.length > 220) return;

          if (
            /AGENT|WEAPON|MAP|MODE|GENERAL|GAMEPLAY|COMPETITIVE/.test(section)
          ) {
            preferred.push(text);
          } else if (/BUG FIX/.test(section)) {
            secondary.push(text);
          }
        });
    });

  return [...new Set([...preferred, ...secondary])].slice(0, 3);
}

function firstChangeText(
  $: cheerio.CheerioAPI,
  marker: cheerio.Cheerio<Element>,
  agent: string,
): string {
  const listItem = marker.closest("li");

  if (listItem.length) {
    const nestedChange = listItem.find("ul li, ol li").first();
    if (nestedChange.length) return normalizeText(nestedChange.text());

    const text = normalizeText(listItem.text());
    return normalizeText(text.replace(new RegExp(`^${agent}\\s*`, "i"), ""));
  }

  const container = marker.is("p") ? marker : marker.closest("p");
  const nextListItem = container.nextAll("ul,ol").first().find("li").first();
  if (nextListItem.length) return normalizeText(nextListItem.text());

  const nextParagraph = container.nextAll("p").first();
  return normalizeText(nextParagraph.text());
}

function extractAgentChanges(
  body: string,
  agentNames: readonly string[],
): PatchSummary["agentChanges"] {
  const $ = cheerio.load(body, null, false);
  const agents = new Map(
    agentNames.map((agent) => [agent.toLocaleLowerCase(), agent]),
  );
  const changes = new Map<string, PatchSummary["agentChanges"][number]>();

  $("strong, b, h3, h4, h5, li").each((_, element) => {
    const marker = $(element);
    const markerText =
      element.tagName === "li"
        ? directListText($, element)
        : normalizeText(marker.text());
    const agent = agents.get(markerText.toLocaleLowerCase());

    if (!agent || changes.has(agent)) return;

    const summary = firstChangeText($, marker, agent);
    if (!summary || summary.toLocaleLowerCase() === agent.toLocaleLowerCase()) {
      return;
    }

    changes.set(agent, {
      agent,
      label: /\bfix(?:ed|es)?\b|\bbug\b/i.test(summary)
        ? "Bug fix"
        : "Balance update",
      summary:
        summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}...` : summary,
    });
  });

  return [...changes.values()];
}

async function createPatchSummary(
  item: PatchIndexItem,
  agentNames: readonly string[],
): Promise<PatchSummary> {
  const relativeUrl = item.action?.payload?.url;
  const version = getVersion(item.title ?? "");

  if (!relativeUrl || !version) {
    throw new Error("Official patch entry is incomplete.");
  }

  const url = new URL(relativeUrl, PLAY_VALORANT_URL).toString();
  const page = await fetchOfficialPage(url);
  const masthead = page.blades?.find(
    (blade) => blade.type === "articleMasthead",
  );
  const article = page.blades?.find(
    (blade) => blade.type === "articleRichText",
  );
  const body = article?.richText?.body ?? "";
  const title =
    plainText(masthead?.description?.body ?? item.description?.body ?? "") ||
    `VALORANT Patch ${version}`;
  const highlights = extractHighlights(body);

  return {
    version,
    publishedAt:
      masthead?.publishDate ??
      item.publishedAt ??
      page.displayedPublishDate ??
      new Date(0).toISOString(),
    title,
    url,
    agentChanges: extractAgentChanges(body, agentNames),
    highlights:
      highlights.length > 0
        ? highlights
        : ["Read the official patch notes for the complete change list."],
  };
}

function getFallbackComparison(currentVersion: string): PatchComparison {
  const currentIndex = FALLBACK_PATCH_SUMMARIES.findIndex(
    (patch) => patch.version === currentVersion,
  );

  if (currentIndex === -1) {
    return {
      current: null,
      previous: FALLBACK_PATCH_SUMMARIES[0] ?? null,
      source: "fallback",
    };
  }

  return {
    current: FALLBACK_PATCH_SUMMARIES[currentIndex] ?? null,
    previous: FALLBACK_PATCH_SUMMARIES[currentIndex + 1] ?? null,
    source: "fallback",
  };
}

export async function getPatchComparison(
  currentVersion: string,
  agentNames: readonly string[],
): Promise<PatchComparison> {
  try {
    const items = await getOfficialPatchItems();
    const currentIndex = items.findIndex(
      (item) => getVersion(item.title ?? "") === currentVersion,
    );

    if (currentIndex === -1) {
      return getFallbackComparison(currentVersion);
    }

    const currentItem = items[currentIndex];
    const previousItem = items[currentIndex + 1];
    const [current, previous] = await Promise.all([
      currentItem
        ? createPatchSummary(currentItem, agentNames)
        : Promise.resolve(null),
      previousItem
        ? createPatchSummary(previousItem, agentNames)
        : Promise.resolve(null),
    ]);

    return { current, previous, source: "official" };
  } catch {
    return getFallbackComparison(currentVersion);
  }
}
