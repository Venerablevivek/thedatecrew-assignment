"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { pretty } from "@/lib/matching";
// Sky scale, strongest first, so the most common reason reads darkest.
const shades = ["#0095e0", "#00bfff", "#33ccff", "#66d9ff", "#99e5ff", "#c2f0ff"];
export function ReasonChart({ data }) {
  const rows = data.slice(0, 6).map((r) => ({ ...r, label: pretty(r.category) }));
  return (
    <div className="reason-chart">
      <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 40)}>
        <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={104}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 13, fill: "#5b6b80" }}
          />
          <Tooltip
            cursor={{ fill: "#ebf9ff" }}
            contentStyle={{ borderRadius: 10, border: "1px solid #e2ebf3", fontSize: 13 }}
          />
          <Bar
            dataKey="count"
            name="Feedback records"
            barSize={18}
            radius={[0, 6, 6, 0]}
            isAnimationActive={false}
            label={{ position: "right", fontSize: 12, fill: "#5b6b80" }}
          >
            {rows.map((r, i) => (
              <Cell key={r.category} fill={shades[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Funnel({ data }) {
  return (
    <div className="funnel">
      {data.map((item, i) => (
        <div className="funnel-row" key={item.stage}>
          <div className="funnel-label">{item.stage}</div>
          <div className="funnel-track">
            <div
              style={{
                width: `${Math.max(2, (item.value / (data[0].value || 1)) * 100)}%`,
                background: shades[Math.min(i, shades.length - 1)],
              }}
            />
          </div>
          <strong>{item.value.toLocaleString()}</strong>
          <span className="conversion">{i ? `${item.conversion}%` : ""}</span>
        </div>
      ))}
    </div>
  );
}
