export default function AuthLayout({ title, children }) {
  return (
    <div className="auth-wrapper">
      <div className="auth-bg" />

      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-left-card">
            <div className="brand">Brandio</div>
            <h2>Track brand deals like a business.</h2>

            <p>
              Stop losing money to forgotten invoices, missed follow-ups,
              and messy spreadsheets.
            </p>

            <ul>
              <li>Track brand deals from first pitch to payment</li>
              <li>See overdue payments and follow-ups before they slip</li>
              <li>Manage deliverables, contracts, and posting dates</li>
              <li>Build a portfolio and public media kit from real work</li>
              <li>Understand revenue, brand history, and deal momentum</li>
              <li>Keep your creator business in one clean workspace</li>
            </ul>
          </div>
        </div>

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
