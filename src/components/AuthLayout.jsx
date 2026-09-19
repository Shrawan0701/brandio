export default function AuthLayout({ title, children }) {
  return (
    <div className="auth-wrapper">
      <div className="auth-bg" />

      <div className="auth-container">
        {/* LEFT PANEL */}
        <div className="auth-left">
          <div className="auth-left-card">
            <div className="brand">Brandio</div>
            <h2>Track brand deals like a business.</h2>

            <p>
              Stop losing money to forgotten invoices, missed follow-ups,
              and messy spreadsheets.
            </p>

            <ul>
              <li>✓ Track brand deals</li>
              <li>✓ Payment & posting reminders</li>
              <li>✓ One dashboard for creators</li>
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="auth-card">
            <h3>{title}</h3>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
