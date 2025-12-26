export default function Contact() {
  return (
    <div className="container py-5 text-center" style={{ maxWidth: "700px" }}>
      <h1 className="fw-bold mb-3">Contact Us</h1>

      <p className="text-muted mb-4">
        Have a question, feedback, or need support?  
        Reach out to us and we’ll get back to you shortly.
      </p>

     <a
  href="mailto:brandioapp@gmail.com?subject=Brandio%20Support"
  target="_self"
  rel="noopener noreferrer"
  className="btn btn-dark rounded-pill px-4 py-2"
>
  Contact via Email
</a>


      <p className="text-muted mt-3 small">
        We usually respond within 24-48 hours.
      </p>
    </div>
  );
}
