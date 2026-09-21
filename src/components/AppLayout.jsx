// src/components/AppLayout.jsx
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "./Navbar";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../context/AuthContext";

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const appPaths = new Set([
    "/login", "/register", "/upgrade", "/about", "/contact", "/privacy",
    "/terms", "/forgot-password", "/reset-password", "/payment", "/features",
    "/faq", "/dashboard", "/deals", "/pricing", "/analytics", "/deliverables", "/deal-analyzer", "/rates", "/brands", "/money", "/inbound", "/portfolio", "/media-kit",
    "/contracts", "/intelligence", "/roi", "/profile", "/billing"
  ]);
  const publicSingleSegment = /^\/[^/]+\/?$/.test(location.pathname);
  const hideNav =
    /\/work-with-me\/?$/.test(location.pathname) ||
    (publicSingleSegment && !appPaths.has(location.pathname));

  const shellPaths = new Set([
    "/dashboard", "/deals", "/analytics", "/deliverables", "/deal-analyzer", "/rates",
    "/brands", "/money", "/inbound", "/portfolio", "/media-kit", "/contracts",
    "/intelligence", "/roi", "/profile", "/pricing", "/billing"
  ]);
  const isDealWorkspace = /^\/deals\/[^/]+\/?$/.test(location.pathname);
  const useShell = user && (shellPaths.has(location.pathname) || isDealWorkspace) && !hideNav;
  const pageMeta = getPageMeta(location.pathname);

  if (useShell) {
    return (
      <div className="app-shell">
        <aside className="app-sidebar">
          <Link to="/dashboard" className="app-brand">
            <img src="/brandio-logo.png" alt="Brandio" className="brandio-nav-logo" />
            <div>
              <strong>Brandio</strong>
              <small>Business OS</small>
            </div>
          </Link>
          <ShellNav onNavigate={() => setMenuOpen(false)} user={user} />
        </aside>

        <div className="app-mobile-topbar">
          <Link to="/dashboard" className="app-brand compact">
            <img src="/brandio-logo.png" alt="Brandio" className="brandio-nav-logo" />
            <strong>Brandio</strong>
          </Link>
          <div className="app-mobile-actions">
            <NotificationBell />
            <button className="app-avatar" onClick={() => navigate("/profile")} aria-label="Open profile">
              {(user.username || "U").slice(0, 1).toUpperCase()}
            </button>
            <button
              className="app-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="app-mobile-drawer" role="dialog" aria-modal="true">
            <button className="app-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />
            <div className="app-drawer-panel">
              <div className="app-drawer-head">
                <Link to="/dashboard" className="app-brand compact" onClick={() => setMenuOpen(false)}>
                  <img src="/brandio-logo.png" alt="Brandio" className="brandio-nav-logo" />
                  <strong>Brandio</strong>
                </Link>
                <button onClick={() => setMenuOpen(false)} aria-label="Close navigation">Close</button>
              </div>
              <ShellNav onNavigate={() => setMenuOpen(false)} user={user} />
            </div>
          </div>
        )}

        <div className="app-main">
          <header className="app-topbar">
            <div>
              <span>{pageMeta.group}</span>
              <h1>{pageMeta.title}</h1>
            </div>
            <div className="app-topbar-right">
              <Link to="/deal-analyzer" className="app-search">Analyze a deal</Link>
              <NotificationBell />
              <button className="app-avatar" onClick={() => navigate("/profile")}>
                {(user.username || "U").slice(0, 1).toUpperCase()}
              </button>
            </div>
          </header>
          <main className="app-content">{children}</main>
          <nav className="app-bottom-nav" aria-label="Mobile primary navigation">
            <NavLink to="/dashboard" end>Overview</NavLink>
            <NavLink to="/deals">Deals</NavLink>
            <NavLink to="/money">Money</NavLink>
            <NavLink to="/inbound">Inbox</NavLink>
            <button onClick={() => setMenuOpen(true)}>More</button>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <>
      {!hideNav && <Navbar />}
      <main>{children}</main>
    </>
  );
}

const navGroups = [
  {
    label: "Main",
    items: [
      ["Overview", "/dashboard", "OV"],
      ["Deals", "/deals", "DL"],
      ["Brands", "/brands", "BR"],
      ["Deliverables", "/deliverables", "DV"],
      ["Money", "/money", "MO"],
      ["Intelligence", "/intelligence", "AI"]
    ]
  },
  {
    label: "Workspace",
    items: [
      ["Contracts", "/contracts", "CT"],
      ["Portfolio", "/portfolio", "PF"],
      ["Media Kit", "/media-kit", "MK"],
      ["Inbound", "/inbound", "IN"],
      ["Rate Intelligence", "/rates", "RI"],
      ["Deal Analyzer", "/deal-analyzer", "DA"]
    ]
  },
  {
    label: "Account",
    items: [
      ["Profile", "/profile", "PR"],
      ["Billing / Plans", "/billing", "BP"],
      ["Pricing", "/pricing", "ST"]
    ]
  }
];

function ShellNav({ onNavigate, user }) {
  return (
    <nav className="app-nav">
      {navGroups.map((group) => (
        <section key={group.label}>
          <p>{group.label}</p>
          {group.items
            .filter(([label]) => user.plan === "pro" || !["Intelligence"].includes(label))
            .map(([label, to, icon]) => (
              <NavLink
                key={`${label}-${to}`}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) => isActive ? "active" : ""}
                end={to === "/dashboard"}
              >
                <span>{icon}</span>
                {label}
              </NavLink>
            ))}
        </section>
      ))}
    </nav>
  );
}

function getPageMeta(pathname) {
  const map = {
    "/dashboard": ["Main", "Overview"],
    "/deals": ["Main", "Deals"],
    "/analytics": ["Main", "Analytics"],
    "/deliverables": ["Main", "Deliverables"],
    "/deal-analyzer": ["Intelligence", "AI Deal Analyzer"],
    "/rates": ["Intelligence", "Rate Intelligence"],
    "/brands": ["Main", "Brands"],
    "/money": ["Main", "Money"],
    "/inbound": ["Workspace", "Inbound"],
    "/portfolio": ["Workspace", "Portfolio"],
    "/media-kit": ["Workspace", "Media Kit"],
    "/contracts": ["Workspace", "Contracts"],
    "/intelligence": ["Main", "Intelligence"],
    "/roi": ["Intelligence", "Deal ROI"],
    "/profile": ["Account", "Profile"],
    "/billing": ["Account", "Billing & Plans"],
    "/pricing": ["Account", "Plan and billing"]
  };
  const [group, title] = map[pathname] || ["Workspace", "Brandio"];
  return { group, title };
}
