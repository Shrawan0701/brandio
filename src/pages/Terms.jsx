export default function Terms() {
  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h1 className="fw-bold mb-4">Terms & Conditions</h1>

      <p className="text-muted">
        By using Brandio, you agree to the following terms:
      </p>

      <ul className="text-muted">
        <li>Brandio is provided as-is without guaranteed uptime</li>
        <li>You are responsible for the accuracy of the data you enter</li>
        <li>You must not misuse or attempt unauthorized access to the platform</li>
        <li>Premium features are subject to applicable pricing and billing</li>
      </ul>

      <p className="text-muted mt-3">
        Brandio reserves the right to update these terms at any time. Continued
        use of the platform indicates acceptance of updated terms.
      </p>
    </div>
  );
}
