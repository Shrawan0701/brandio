import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="public-nav">
      <Link className="public-brand" to={user ? "/dashboard" : "/"}>
        <span>B</span>
        <strong>Brandio</strong>
      </Link>

      <div className="public-links">
        <a href="/#product">Product</a>
        <NavLink to="/features">Features</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/faq">FAQ</NavLink>
      </div>

      <div className="public-actions">
        {user ? (
          <Link className="btn-start" to="/dashboard">Open app</Link>
        ) : (
          <>
            <Link className="btn-signin" to="/login">Login</Link>
            <Link className="btn-start" to="/register">Start free</Link>
          </>
        )}
      </div>

      <button className="public-menu-button" onClick={() => setOpen(true)} aria-label="Open menu">
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="public-mobile-menu" role="dialog" aria-modal="true">
          <button className="public-menu-backdrop" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="public-menu-panel">
            <div className="public-menu-head">
              <Link className="public-brand" to="/" onClick={() => setOpen(false)}>
                <span>B</span>
                <strong>Brandio</strong>
              </Link>
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
            <a href="/#product" onClick={() => setOpen(false)}>Product</a>
            <Link to="/features" onClick={() => setOpen(false)}>Features</Link>
            <Link to="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link to="/faq" onClick={() => setOpen(false)}>FAQ</Link>
            {user ? (
              <Link className="menu-cta" to="/dashboard" onClick={() => setOpen(false)}>Open app</Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                <Link className="menu-cta" to="/register" onClick={() => setOpen(false)}>Start free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
