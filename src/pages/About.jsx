export default function About() {
  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h1 className="fw-bold mb-4">About Brandio</h1>

      <p className="text-muted">
        Brandio helps creators and freelancers stay in control of their brand
        collaborations.
      </p>

      <p className="text-muted">
        We built Brandio to replace messy spreadsheets and scattered notes with a
        simple, reliable way to track brand deals, payments, and deadlines - all
        in one place.
      </p>

      <p className="text-muted">
        Whether you’re working with one brand or managing dozens of
        collaborations, Brandio helps you run your creator work like a real
        business.
      </p>

      <ul className="mt-4 text-muted">
        <li>Track brand deals and payment status</li>
        <li>Never miss posting or payment deadlines</li>
        <li>Keep all collaborations organized</li>
      </ul>
    </div>
  );
}
