export default function Contact() {
  return (
    <div className="static-page text-center">
      <h1>Contact Us</h1>

      <p className="subtitle">
        Have a question, feedback, or need support? Reach out to us anytime.
      </p>

      <a
        href="mailto:support@brandio.world?subject=Brandio%20Support"
        className="contact-button"
      >
        Email support@brandio.world
      </a>

      <p className="note">
        We usually respond within 24-48 hours.
      </p>
    </div>
  );
}
