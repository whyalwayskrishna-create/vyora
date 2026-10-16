"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tip = { contentStyle: { background: "var(--elevated)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 12, color: "var(--fg)" }, labelStyle: { color: "var(--muted)", fontWeight: 600 }, cursor: { fill: "var(--elevated-2)", opacity: 0.6 } };
const axis = { stroke: "var(--muted)", fontSize: 11, tickLine: false, axisLine: false } as const;
type Row = Record<string, string | number | null>;

export function BarsChart({ data, x, y, height = 200, unit = "", color = "var(--accent)", target, name }: { data: Row[]; x: string; y: string; height?: number; unit?: string; color?: string; target?: number; name?: string }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
          <XAxis dataKey={x} {...axis} interval="preserveStartEnd" />
          <YAxis {...axis} width={44} />
          <Tooltip {...tip} formatter={(v) => [`${Math.round(Number(v) * 10) / 10}${unit}`, name ?? y]} />
          {target ? <ReferenceLine y={target} stroke="var(--warn)" strokeDasharray="4 4" /> : null}
          <Bar dataKey={y} fill={color} radius={[6, 6, 2, 2]} maxBarSize={34} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function LinesChart({ data, x, lines, height = 220, unit = "", area }: { data: Row[]; x: string; lines: { key: string; color: string; name: string }[]; height?: number; unit?: string; area?: boolean }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        {area ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>{lines.map((l) => <linearGradient key={l.key} id={`g-${l.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={l.color} stopOpacity={0.35} /><stop offset="100%" stopColor={l.color} stopOpacity={0} /></linearGradient>)}</defs>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey={x} {...axis} interval="preserveStartEnd" /><YAxis {...axis} width={44} domain={["auto", "auto"]} />
            <Tooltip {...tip} formatter={(v, n) => [`${Math.round(Number(v) * 10) / 10}${unit}`, n]} />
            {lines.map((l) => <Area key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} fill={`url(#g-${l.key})`} connectNulls animationDuration={700} />)}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey={x} {...axis} interval="preserveStartEnd" /><YAxis {...axis} width={44} domain={["auto", "auto"]} />
            <Tooltip {...tip} formatter={(v, n) => [`${Math.round(Number(v) * 10) / 10}${unit}`, n]} />
            {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} dot={{ r: 3, fill: l.color }} connectNulls animationDuration={700} />)}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
