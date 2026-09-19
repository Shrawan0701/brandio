import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();

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
            <Link className="btn-start" to="/register">Sign up</Link>
          </>
        )}
      </div>

    </nav>
  );
}
