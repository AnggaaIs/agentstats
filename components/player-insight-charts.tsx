"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  accent: "#ff4655",
  accentSoft: "#ff8b94",
  paper: "#f3f0e9",
  muted: "#9aa6b4",
  panel: "#151b22",
  grid: "rgba(255,255,255,0.08)",
  positive: "#5ee6a8",
  warning: "#f4c95d",
};

const tooltipStyle = {
  backgroundColor: COLORS.panel,
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 0,
  color: COLORS.paper,
  fontSize: 12,
};

interface MatchChartPoint {
  label: string;
  acs: number;
  adr: number;
}

interface MetricPoint {
  label: string;
  value: number;
}

interface EconomyPoint {
  label: string;
  damage: number;
  kills: number;
}

interface DuelPoint {
  label: string;
  kills: number;
  deaths: number;
}

interface AgentMapPoint {
  label: string;
  games: number;
  acs: number;
  winRate: number;
}

interface SessionPoint {
  label: string;
  games: number;
  acs: number;
  winRate: number;
}

interface UtilityPoint {
  name: string;
  value: number;
}

interface BenchmarkPoint {
  metric: string;
  player: number;
  cohort: number;
}

interface PlayerInsightChartsProps {
  matchTrend: MatchChartPoint[];
  roundImpact: MetricPoint[];
  economy: EconomyPoint[];
  duelTiming: DuelPoint[];
  rollingAcs: Array<{ label: string; acs: number }>;
  agentMaps: AgentMapPoint[];
  sessions: SessionPoint[];
  utility: UtilityPoint[];
  benchmark: BenchmarkPoint[];
  benchmarkLabel: string | null;
}

function ChartPanel({
  eyebrow,
  title,
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="min-w-0 border border-white/10 bg-[var(--panel)]">
      <figcaption className="border-b border-white/8 p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
          {eyebrow}
        </p>
        <h3 className="mt-1 font-display text-lg font-black uppercase">
          {title}
        </h3>
        <p className="mt-1 text-[9px] leading-4 text-white/45">{note}</p>
      </figcaption>
      <div className="h-64 min-w-0 p-2 sm:h-72 sm:p-4">{children}</div>
    </figure>
  );
}

function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full place-items-center px-5 text-center text-xs leading-5 text-[var(--muted)]">
      {children}
    </div>
  );
}

export function PlayerInsightCharts({
  matchTrend,
  roundImpact,
  economy,
  duelTiming,
  rollingAcs,
  agentMaps,
  sessions,
  utility,
  benchmark,
  benchmarkLabel,
}: PlayerInsightChartsProps) {
  return (
    <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-2">
      <ChartPanel
        eyebrow="Performance timeline"
        title="ACS and damage trend"
        note="Oldest to newest. Tooltip values come from each official match payload."
      >
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <LineChart
            data={matchTrend}
            accessibilityLayer
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10, color: COLORS.muted }} />
            <Line
              name="ACS"
              dataKey="acs"
              type="monotone"
              stroke={COLORS.accent}
              strokeWidth={3}
              dot={{ r: 2, fill: COLORS.paper }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            <Line
              name="ADR"
              dataKey="adr"
              type="monotone"
              stroke={COLORS.paper}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        eyebrow="Round outcomes"
        title="Impact conversion"
        note="Percentages show conversion, recovery, survival, and avoidable death pressure."
      >
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart
            data={roundImpact}
            layout="vertical"
            accessibilityLayer
            margin={{ top: 8, right: 16, left: 18, bottom: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={88}
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Rate"]}
            />
            <Bar
              dataKey="value"
              fill={COLORS.accent}
              radius={[0, 2, 2, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        eyebrow="Economy"
        title="Loadout efficiency"
        note="Damage and kills per 1,000 credits of loadout value."
      >
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart
            data={economy}
            accessibilityLayer
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="damage"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis yAxisId="kills" orientation="right" hide />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10, color: COLORS.muted }} />
            <Bar
              yAxisId="damage"
              name="Damage / 1k"
              dataKey="damage"
              fill={COLORS.accent}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="kills"
              name="Kills / 1k"
              dataKey="kills"
              fill={COLORS.paper}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        eyebrow="Duel timing"
        title="Kills and deaths by phase"
        note="Early 0–30s, mid 31–70s, and late after 70s."
      >
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart
            data={duelTiming}
            accessibilityLayer
            margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10, color: COLORS.muted }} />
            <Bar
              name="Kills"
              dataKey="kills"
              fill={COLORS.positive}
              isAnimationActive={false}
            />
            <Bar
              name="Deaths"
              dataKey="deaths"
              fill={COLORS.accent}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        eyebrow="Consistency"
        title="Rolling five-match ACS"
        note="Smooths individual match noise while preserving direction."
      >
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <LineChart
            data={rollingAcs}
            accessibilityLayer
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              name="Rolling ACS"
              dataKey="acs"
              type="monotone"
              stroke={COLORS.accent}
              strokeWidth={3}
              dot={{ r: 2, fill: COLORS.paper }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        eyebrow="Agent × map"
        title="Top combination output"
        note="Top combinations by sample size. Bar length represents average ACS."
      >
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart
            data={agentMaps}
            layout="vertical"
            accessibilityLayer
            margin={{ top: 8, right: 16, left: 30, bottom: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={112}
              tick={{ fill: COLORS.muted, fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              name="Average ACS"
              dataKey="acs"
              fill={COLORS.accent}
              radius={[0, 2, 2, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        eyebrow="Session progression"
        title="Output by match position"
        note="A new play session begins after a 90-minute gap."
      >
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart
            data={sessions}
            accessibilityLayer
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              name="Average ACS"
              dataKey="acs"
              fill={COLORS.accent}
              isAnimationActive={false}
            >
              {sessions.map((entry, index) => (
                <Cell
                  key={`${entry.label}:${entry.games}`}
                  fill={
                    index === 0
                      ? COLORS.paper
                      : index === 1
                        ? COLORS.accentSoft
                        : COLORS.accent
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        eyebrow="Utility usage"
        title="Ability cast distribution"
        note="Cast volume only. Riot does not expose a universal effectiveness score."
      >
        {utility.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <PieChart accessibilityLayer>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 10, color: COLORS.muted }}
              />
              <Pie
                data={utility}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius="43%"
                outerRadius="72%"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {utility.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      [
                        COLORS.accent,
                        COLORS.paper,
                        COLORS.accentSoft,
                        COLORS.warning,
                      ][index % 4]
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart>
            Ability cast counters are absent from the current Riot match sample.
          </EmptyChart>
        )}
      </ChartPanel>

      <ChartPanel
        eyebrow="Cohort benchmark"
        title={benchmarkLabel ?? "Rank + agent comparison"}
        note="Cohort is normalized to 100. Player values show relative output, capped at 160 for readability."
      >
        {benchmark.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <RadarChart
              data={benchmark}
              accessibilityLayer
              outerRadius="68%"
            >
              <PolarGrid stroke={COLORS.grid} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: COLORS.muted, fontSize: 10 }}
              />
              <PolarRadiusAxis
                domain={[0, 160]}
                tick={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 10, color: COLORS.muted }}
              />
              <Radar
                name="Cohort"
                dataKey="cohort"
                stroke={COLORS.paper}
                fill={COLORS.paper}
                fillOpacity={0.08}
                isAnimationActive={false}
              />
              <Radar
                name="Player"
                dataKey="player"
                stroke={COLORS.accent}
                fill={COLORS.accent}
                fillOpacity={0.28}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart>
            The privacy-thresholded opt-in cohort is not large enough yet.
          </EmptyChart>
        )}
      </ChartPanel>
    </div>
  );
}
