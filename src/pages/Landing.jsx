import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Landing() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "Brandio transformed how I manage brand partnerships. I've recovered $12K in missed payments just in the first quarter.",
      author: "Ahmed Khan",
      role: "Fashion & Lifestyle Creator",
      metric: "180K followers"
    },
    {
      quote: "Finally, a tool that treats creator business like actual business. No more spreadsheet chaos or missed deadlines.",
      author: "Lara",
      role: "Tech Reviewer",
      metric: "420K subscribers"
    },
    {
      quote: "The payment reminders alone have saved me countless hours of follow-ups. This is essential infrastructure for creators.",
      author: "Lokesh Patel",
      role: "Travel Content Creator",
      metric: "290K followers"
    },
    {
      quote: "Went from tracking deals in notes app to having a complete business dashboard. My accountant actually thanked me.",
      author: "Max Morrison",
      role: "Fitness Coach",
      metric: "510K followers"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-badge-top">Trusted by 1,000+ creators worldwide</div>
        <h1>
          Never miss a <span>Brand</span> payment again.
        </h1>
        <p>
          Track, manage, and grow your creator brand deals - without spreadsheets.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn-primary btn-lg">
            Start free
          </Link>
        </div>

        <div className="platforms">
          For creators on Social Media
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">$500k+</div>
            <div className="stat-label">Tracked in deals</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">1,000+</div>
            <div className="stat-label">Active creators</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">99%</div>
            <div className="stat-label">Accurate payment reminders</div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem">
        <div className="problem-inner">
          <div className="problem-text">
            <h2>Creator income shouldn't be messy.</h2>
            <p>
              Deals live across DMs, emails, and spreadsheets.
              <br />Payments slip. <br />Follow-ups get forgotten.
            </p>
            <span className="problem-pill">
              That's money leaking out of your business.
            </span>
          </div>

          <ul className="problem-list">
            <li><span></span> Track brand deals</li>
            <li><span></span> Payment & posting reminders</li>
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
            <p>See what's active, paid, or overdue.</p>
          </div>

          <div className="step">
            <span>3</span>
            <h4>Get paid</h4>
            <p>Reminders help you close deals on time.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <div className="testimonials-header">
          <h2>Loved by creators everywhere</h2>
          <p>Join thousands of creators who've taken control of their income</p>
        </div>

        <div className="testimonial-carousel">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`testimonial-card ${index === currentTestimonial ? 'active' : ''}`}
            >
              <div className="testimonial-quote">"{testimonial.quote}"</div>
              <div className="testimonial-author">
                <div className="author-name">{testimonial.author}</div>
                <div className="author-role">{testimonial.role}</div>
                <div className="author-metric">{testimonial.metric}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="testimonial-dots">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentTestimonial ? 'active' : ''}`}
              onClick={() => setCurrentTestimonial(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
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
      <p>Track brand deals, payments, and deadlines.</p>
    </div>

    <div>
      <h5>Product</h5>
      <ul>
        <li><Link to="/payment">Pricing</Link></li>
        <li><Link to="/features">Features</Link></li>
        <li><Link to="/faq">FAQ</Link></li>
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
    © 2026 Brandio
  </div>
</footer>

    </>
  );
}