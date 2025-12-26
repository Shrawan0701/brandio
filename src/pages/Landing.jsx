import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <>
      {/* NAVBAR */}
      

      {/* HERO */}
      <section className="hero">
        <h1>
          Never miss a <span>Brand</span> payment again.
        </h1>
        <p>
          Track, manage, and grow your creator brand deals - without spreadsheets or chaos.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn-primary btn-lg">
            Start free
          </Link>
            
        </div>

        <div className="platforms">
          Built for creators on Instagram · YouTube · X · Telegram · Reddit
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem">
  <div className="problem-inner">
    <div className="problem-text">
      <h2>Creator income shouldn’t be messy.</h2>
      <p>
        Deals live across DMs, emails, and spreadsheets.
        <br />Payments slip. <br />Follow-ups get forgotten.
      </p>
      <span className="problem-pill">
        That’s money leaking out of your business.
      </span>
    </div>

    <ul className="problem-list">
  <li><span></span> Track brand deals</li>
  <li><span></span>Payment & posting reminders</li>
  
  <li><span></span> One dashboard for creators</li>
</ul>

  </div>
</section>



      {/* HOW IT WORKS */}
      <section className="steps">
        <h2>How Brandio works</h2>

        <div className="steps-grid">
          <div className="step">
            <span>1</span>
            <h4>Add your deal</h4>
            <p>Brand name, amount, posting & payment dates.</p>
          </div>

          <div className="step">
            <span>2</span>
            <h4>Track progress</h4>
            <p>See what’s active, paid, or overdue.</p>
          </div>

          <div className="step">
            <span>3</span>
            <h4>Get paid</h4>
            <p>Reminders help you close deals on time.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Built for creators who take their work seriously</h2>
        <p>Stop spreadsheets. Start tracking like a real business.</p>

        <Link to="/register" className="btn-primary btn-lg cta-btn">
          Get started 
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="footer dark-footer">
        <div className="footer-grid">
          <div>
            <h4>Brandio</h4>
            <p>
              Track brand deals, payments, and deadlines.
            </p>
          </div>

          <div>
            <h5>Product</h5>
            <ul>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/reminders">Reminders</Link></li>
            </ul>
          </div>

          <div>
            <h5>Company</h5>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © 2025 Brandio
        </div>
      </footer>
    </>
  );
}
