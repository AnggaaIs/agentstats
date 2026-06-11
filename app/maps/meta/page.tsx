import type { Metadata } from "next";
import Image from "next/image";

import { PageHeading } from "@/components/page-heading";
import { RouteLink } from "@/components/route-link";
import {
  buildEmptyMapMetaDataset,
  getMapMetaDataset,
  type MapMetaRow,
} from "@/lib/agent-meta";
import { createMetadata } from "@/lib/seo";
import { getCurrentAct, getMaps } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Valorant Map Frequency by Mode",
  description:
    "See which Valorant maps appear most often in competitive and other modes from opt-in AgentStats match observations.",
  path: "/maps/meta",
});

function formatNumber(value: number, digits = 0): string {
  return value.toFixed(digits);
}

function formatPercent(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}%`;
}

function percent(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100;
}

function getModeSections(rows: MapMetaRow[]) {
  const sections = new Map<string, MapMetaRow[]>();

  for (const row of rows) {
    const existing = sections.get(row.modeId);

    if (existing) {
      existing.push(row);
    } else {
      sections.set(row.modeId, [row]);
    }
  }

  return Array.from(sections.entries())
    .map(([modeId, modeRows]) => ({
      modeId,
      mode: modeRows[0]?.mode ?? modeId,
      rows: modeRows,
      appearances: modeRows.reduce((total, row) => total + row.appearances, 0),
      rounds: modeRows.reduce((total, row) => total + row.rounds, 0),
    }))
    .sort((left, right) => {
      if (left.modeId === "competitive") return -1;
      if (right.modeId === "competitive") return 1;
      return left.mode.localeCompare(right.mode);
    });
}

export default async function MapMetaPage() {
  const [maps, currentAct] = await Promise.all([
    getMaps(),
    getCurrentAct().catch(() => null),
  ]);
  const mapMeta = await getMapMetaDataset(maps, currentAct?.uuid).catch(() =>
    buildEmptyMapMetaDataset(maps),
  );
  const modeSections = getModeSections(mapMeta.rows);

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <PageHeading
          eyebrow={currentAct?.displayLabel ?? "Map meta"}
          title="Map frequency"
          description="Match-map frequency by Riot queue. Only synced match samples are counted."
        />
        <div className="flex flex-wrap gap-2">
          <RouteLink
            href="/"
            className="valorant-action inline-flex min-h-10 items-center border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.12em]"
          >
            Back home
          </RouteLink>
          <RouteLink
            href="/maps"
            className="valorant-action inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em]"
          >
            Browse maps
          </RouteLink>
        </div>
      </div>

      <div className="mt-7 grid border border-white/10 bg-[var(--panel)] sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Sample matches", mapMeta.totalMatches.toString()],
          ["Map appearances", mapMeta.totalAppearances.toString()],
          ["Modes indexed", modeSections.length.toString()],
          ["Last sync", mapMeta.lastObservedAt ? "Ready" : "Pending"],
        ].map(([label, value]) => (
          <div key={label} className="border-white/10 p-5 sm:border-l first:border-l-0">
            <p className="font-display text-3xl font-black tracking-[-0.05em]">
              {value}
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              {label}
            </p>
          </div>
        ))}
      </div>

      {modeSections.length > 0 ? (
        <div className="mt-6 space-y-6">
          {modeSections.map((section) => (
            <section
              key={section.modeId}
              className="overflow-hidden border border-white/10 bg-[var(--panel)]"
            >
              <div className="flex flex-col gap-2 border-b border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
                <div>
                  <p className="eyebrow">{section.modeId}</p>
                  <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[-0.05em]">
                    {section.mode}
                  </h2>
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {section.appearances} appearances / {section.rounds} rounds
                </p>
              </div>

              <div
                role="region"
                aria-label={`${section.mode} map frequency table`}
                tabIndex={0}
                className="tactical-scrollbar overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <table className="w-full min-w-[46rem] border-collapse text-left">
                  <thead className="bg-black/20 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 sm:px-5">Map</th>
                      <th className="px-4 py-3 text-right sm:px-5">Share</th>
                      <th className="px-4 py-3 text-right sm:px-5">
                        Appearances
                      </th>
                      <th className="px-4 py-3 text-right sm:px-5">Rounds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((map) => {
                      const modeRate = percent(
                        map.appearances,
                        section.appearances,
                      );

                      return (
                        <tr
                          key={`${map.modeId}:${map.mapId}`}
                          className="border-t border-white/8 transition-colors hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-3 sm:px-5">
                            <div className="flex items-center gap-4">
                              <div className="relative h-14 w-24 shrink-0 overflow-hidden bg-[#202832]">
                                {map.image ? (
                                  <Image
                                    src={map.image}
                                    alt=""
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                ) : null}
                                <div className="absolute inset-0 bg-black/20" />
                              </div>
                              <div>
                                <p className="font-display text-xl font-black uppercase tracking-[-0.04em]">
                                  {map.name}
                                </p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                  {section.mode}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right sm:px-5">
                            <div className="ml-auto w-32">
                              <p className="font-display text-lg font-black">
                                {formatPercent(modeRate)}
                              </p>
                              <div className="mt-1 h-1 bg-white/10">
                                <div
                                  className="h-full bg-[var(--accent)]"
                                  style={{
                                    width: `${Math.min(100, modeRate)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm sm:px-5">
                            {map.appearances}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-[var(--muted)] sm:px-5">
                            {map.rounds}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="mt-6 border border-white/10 bg-[var(--panel)] p-6">
          <p className="eyebrow">No samples</p>
          <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em]">
            Map frequency is empty
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            After opt-in match sync runs, maps from Riot match payloads will
            appear here by mode.
          </p>
        </section>
      )}
    </section>
  );
}
