import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const SLATE = '#33414A';
const SAGE = '#5F8467';
const HAIRLINE = 'rgba(31,58,52,0.15)';

export default function ProgressChart({ chartData }) {
  return (
    <div className="progress-chart">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={HAIRLINE}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{
              fontSize: 12,
              fill: SLATE,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            axisLine={{ stroke: HAIRLINE }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: SLATE }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: `1px solid ${HAIRLINE}`,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="planned"
            name="Planned (min)"
            fill={SLATE}
            opacity={0.35}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="completed"
            name="Logged (min)"
            fill={SAGE}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
