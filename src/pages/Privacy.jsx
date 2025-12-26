export default function Privacy() {
  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h1 className="fw-bold mb-4">Privacy Policy</h1>

      <p className="text-muted">
        Your privacy matters to us. Brandio only collects the information
        necessary to provide and improve our services.
      </p>

      <h5 className="mt-4 fw-semibold">What we collect</h5>
      <ul className="text-muted">
        <li>Account details such as email and authentication data</li>
        <li>Brand deal information you choose to store</li>
        <li>Basic usage data to improve the product</li>
      </ul>

      <h5 className="mt-4 fw-semibold">What we don’t do</h5>
      <ul className="text-muted">
        <li>We do not sell your personal data</li>
        <li>We do not share data for marketing purposes</li>
      </ul>

      <p className="text-muted mt-3">
        By using Brandio, you agree to this privacy policy.
      </p>
    </div>
  );
}
