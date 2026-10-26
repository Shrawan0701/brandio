import { useId } from "react";

export function WorkspaceHeader({ eyebrow = "Workspace", title, description, actions, children }) {
  return <header className="ws-page-header"><div className="ws-page-intro"><span className="ws-eyebrow">{eyebrow}</span><h1>{title}<span className="ws-title-dot">.</span></h1>{description && <p>{description}</p>}{children}</div>{actions && <div className="ws-header-actions">{actions}</div>}</header>;
}

export function WorkspaceStats({ items, className = "" }) {
  return <section className={`ws-stats ${className}`} aria-label="Page summary">{items.map(({ label, value, note, icon = "chart", tone = "purple" }) => <article className={`ws-stat ws-tone-${tone}`} key={label}><div className="ws-stat-top"><span>{label}</span><span className="ws-stat-icon"><WorkspaceIcon name={icon} /></span></div><strong>{value ?? "—"}</strong>{note && <small>{note}</small>}</article>)}</section>;
}

export function WorkspaceSearch({ value, onChange, placeholder = "Search…", label = "Search", className = "" }) {
  const id = useId();
  return <div className={`ws-search ${className}`}><label htmlFor={id} className="ws-sr-only">{label}</label><WorkspaceIcon name="search" /><input id={id} type="search" value={value} onChange={onChange} placeholder={placeholder} /></div>;
}

export function WorkspaceIcon({ name = "arrow" }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M6 18 18 6M6 6h12v12" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    chart: <><path d="M4 4v16h16M8 15v-4m5 4V7m5 8v-6" /></>,
    deals: <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V4h8v3M3 12a22 22 0 0 0 18 0" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m7 12 3 3 7-7" /></>,
    alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v4m0 4v.1" /></>,
    brands: <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5" /></>,
    money: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18m-6 5h3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18" /></>,
    file: <><path d="M5 3h9l5 5v13H5V3Zm9 0v5h5M8 13h8m-8 4h5" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    star: <path d="m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1 3-6Z" />,
    inbox: <><path d="M4 4h16l2 15H2L4 4Z" /><path d="M2 14h6l2 3h4l2-3h6" /></>
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.arrow}</svg>;
}
