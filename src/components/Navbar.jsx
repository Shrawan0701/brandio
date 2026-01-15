import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  /* ---------------- ROUTE HELPERS ---------------- */
  const pathname = location.pathname;

  const isAuthPage =
    pathname === "/login" || pathname === "/register";

  const isPublicUpgrade = pathname === "/upgrade"; // public pricing
  const isPrivatePricing = pathname === "/pricing"; // in-app pricing

  const isDashboard = pathname === "/dashboard";
  const isProfile = pathname === "/profile";
  const isAnalytics = pathname === "/analytics";


  return (
    <nav className="navbar px-4 py-3 bg-white border-bottom sticky-top">
      {/* ================= BRAND ================= */}
      <Link
        className="navbar-brand fw-bold text-dark text-decoration-none"
        to="/"
      >
        Brandio
      </Link>

      {/* ================= RIGHT SIDE ================= */}
      <div className="d-flex gap-3 align-items-center">
        {/* ================= NOT LOGGED IN ================= */}
        {!user && !isAuthPage && (
          <>
            {/* Public Pricing */}
            {!isPublicUpgrade && (
              <Link
                to="/upgrade"
                
              >
                
              </Link>
            )}

            <Link
              to="/login"
              className="btn btn-dark btn-sm"
            >
              Login
            </Link>
          </>
        )}

        {/* ================= LOGGED IN ================= */}
       {user && (
  <div className="d-flex align-items-center gap-2">
    {/* Dashboard */}
    {!isDashboard && (
      <Link
        to="/dashboard"
        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
      >
        Dashboard
      </Link>
    )}

    {/* Profile */}
    {!isProfile && (
      <Link
        to="/profile"
        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
      >
        Profile
      </Link>
    )}
    {user.plan === "pro" && !isAnalytics && (
  <Link
    to="/analytics"
    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
  >
    Analytics
  </Link>
)}



    {/* Upgrade CTA */}
    {!isPrivatePricing && user.plan === "free" && (
      <Link
        to="/pricing"
        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
      >
        Upgrade
      </Link>
    )}
  </div>
)}

      </div>
    </nav>
  );
}
