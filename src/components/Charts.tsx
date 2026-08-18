import type { ReactNode } from 'react';
import { formatScore } from '../lib/format';

/**
 * 手写内联 SVG 图表，不引图表库。
 * 每个图表同时提供 <table> 形式的无障碍替代内容，
 * 读屏器读到的是数值本身而不是「图形」。
 */

const CHART_PALETTE: readonly string[] = [
  'var(--color-accent)',
  'var(--color-positive)',
  'var(--color-caution)',
];

export interface RadarSeries {
  readonly label: string;
  /** 每个维度的取值，0-100，顺序与 axes 一致 */
  readonly values: readonly number[];
}

export interface RadarChartProps {
  readonly axes: readonly string[];
  readonly series: readonly RadarSeries[];
  readonly caption: string;
}

/** 计算雷达图上某个点的坐标 */
function radarPoint(
  index: number,
  total: number,
  ratio: number,
  radius: number,
): readonly [number, number] {
  // 从正上方开始顺时针排布
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return [Math.cos(angle) * radius * ratio, Math.sin(angle) * radius * ratio];
}

function radarPolygon(values: readonly number[], radius: number): string {
  return values
    .map((value, index) => {
      const [x, y] = radarPoint(
        index,
        values.length,
        Math.max(0, Math.min(1, value / 100)),
        radius,
      );
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function RadarChart({ axes, series, caption }: RadarChartProps): ReactNode {
  const radius = 78;
  const viewSize = 220;
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <figure className="m-0">
      <svg
        viewBox={`${-viewSize / 2} ${-viewSize / 2} ${viewSize} ${viewSize}`}
        className="mx-auto block h-56 w-full max-w-sm"
        role="img"
        aria-label={caption}
      >
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={radarPolygon(
              axes.map(() => ring * 100),
              radius,
            )}
            fill="none"
            stroke="var(--color-line-subtle)"
            strokeWidth="1"
          />
        ))}
        {axes.map((axis, index) => {
          const [x, y] = radarPoint(index, axes.length, 1, radius);
          const [labelX, labelY] = radarPoint(index, axes.length, 1.26, radius);
          return (
            <g key={axis}>
              <line x1="0" y1="0" x2={x} y2={y} stroke="var(--color-line-subtle)" strokeWidth="1" />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill="var(--color-ink-muted)"
              >
                {axis}
              </text>
            </g>
          );
        })}
        {series.map((item, seriesIndex) => (
          <polygon
            key={item.label}
            points={radarPolygon(item.values, radius)}
            fill={CHART_PALETTE[seriesIndex % CHART_PALETTE.length]}
            fillOpacity="0.16"
            stroke={CHART_PALETTE[seriesIndex % CHART_PALETTE.length]}
            strokeWidth="1.75"
          />
        ))}
      </svg>

      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {series.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5 text-[var(--color-ink-body)]">
            <span
              aria-hidden="true"
              className="inline-block size-2.5 rounded-sm"
              style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }}
            />
            {item.label}
          </li>
        ))}
      </ul>

      <details className="mt-2 text-xs text-[var(--color-ink-muted)]">
        <summary className="cursor-pointer">查看图表数据表</summary>
        <table className="mt-2 w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="border-b border-[var(--color-line-subtle)] py-1 pr-2">
                维度
              </th>
              {series.map((item) => (
                <th
                  key={item.label}
                  scope="col"
                  className="border-b border-[var(--color-line-subtle)] py-1 pr-2"
                >
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {axes.map((axis, axisIndex) => (
              <tr key={axis}>
                <th scope="row" className="py-1 pr-2 font-normal">
                  {axis}
                </th>
                {series.map((item) => (
                  <td key={item.label} className="numeric py-1 pr-2">
                    {formatScore(item.values[axisIndex] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export interface MetricBarProps {
  readonly label: string;
  /** 0-1 的比例值 */
  readonly ratio: number;
  readonly display: string;
  readonly tone?: 'accent' | 'positive' | 'caution' | 'critical' | undefined;
}

const BAR_TONES = {
  accent: 'var(--color-accent)',
  positive: 'var(--color-positive)',
  caution: 'var(--color-caution)',
  critical: 'var(--color-critical)',
} as const;

/** 单指标横条。用 progressbar 语义让读屏器读出数值。 */
export function MetricBar({ label, ratio, display, tone = 'accent' }: MetricBarProps): ReactNode {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-[var(--color-ink-muted)]">{label}</span>
        <span className="numeric text-[var(--color-ink-body)]">{display}</span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-inset)]"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clamped * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={display}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped * 100}%`, backgroundColor: BAR_TONES[tone] }}
        />
      </div>
    </div>
  );
}
