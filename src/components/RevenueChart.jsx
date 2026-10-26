import { useEffect, useRef, useState } from "react";
import { formatMoney } from "../utils/deals";
import { WorkspaceIcon } from "./WorkspaceUI";

export default function RevenueChart({ data, currency = "INR" }) {
  const container = useRef(null);
  const [width, setWidth] = useState(640);
  const [selectedKey, setSelectedKey] = useState(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const height = 215;
  const pad = { top: 20, right: 10, bottom: 33, left: 44 };
  const plotHeight = height - pad.top - pad.bottom;
  const maxValue = Math.max(1, ...data.map((item) => item.revenue));
  const unit = 10 ** Math.floor(Math.log10(maxValue));
  const max = Math.ceil(maxValue / (unit / 5)) * (unit / 5);
  const slot = (width - pad.left - pad.right) / Math.max(1, data.length);
  const selected = data.find((item) => item.key === selectedKey) || data.at(-1);
  return <div className="ov-chart" ref={container}>{data.some((item) => item.revenue > 0) ? <>
    <div className="ov-chart-caption"><span><i />Completed revenue</span><span>{selected?.fullLabel || selected?.label}<strong>{formatMoney(selected?.revenue || 0, currency)}</strong></span></div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Completed deal revenue for the last ${data.length} months`}>
      {[0, .5, 1].map((ratio) => { const y = pad.top + (1 - ratio) * plotHeight; return <g key={ratio}><line className="ov-chart-gridline" x1={pad.left} x2={width - pad.right} y1={y} y2={y} /><text className="ov-chart-axis" x={pad.left - 10} y={y + 4} textAnchor="end">{formatCompact(max * ratio)}</text></g>; })}
      {data.map((item, index) => {
        const barHeight = item.revenue > 0 ? (item.revenue / max) * plotHeight : 2;
        const barWidth = Math.min(36, slot * .48);
        const x = pad.left + slot * index + (slot - barWidth) / 2;
        const selectedBar = item.key === selected?.key;
        return <g key={item.key} className={`ov-chart-column ${selectedBar ? "is-selected" : ""}`} tabIndex={0} role="img" aria-label={`${item.fullLabel || item.label}: ${formatMoney(item.revenue, currency)}`} onMouseEnter={() => setSelectedKey(item.key)} onFocus={() => setSelectedKey(item.key)}><title>{item.fullLabel || item.label}: {formatMoney(item.revenue, currency)}</title><rect className="ov-chart-hit" x={pad.left + slot * index} y={pad.top} width={slot} height={plotHeight} fill="transparent" /><rect className="ov-chart-bar" x={x} y={height - pad.bottom - barHeight} width={barWidth} height={barHeight} rx={Math.min(5, barWidth / 3)} />{(width > 500 || data.length <= 6 || index % 2 === 0 || index === data.length - 1) && <text className="ov-chart-axis" x={pad.left + slot * (index + .5)} y={height - 10} textAnchor="middle">{item.label}</text>}</g>;
      })}
    </svg>
  </> : <div className="ov-empty"><span className="ov-empty-icon"><WorkspaceIcon name="money" /></span><strong>A fresh start for your revenue.</strong><p>Complete a deal with revenue to see your monthly performance.</p></div>}</div>;
}


function formatCompact(value) { if (value >= 1000000) return `${Math.round(value / 100000) / 10}m`; if (value >= 1000) return `${Math.round(value / 100) / 10}k`; return String(Math.round(value)); }
