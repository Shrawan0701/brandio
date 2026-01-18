import { Helmet } from "react-helmet-async";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions - Brandio</title>
        <meta
          name="description"
          content="Read the terms and conditions for using Brandio’s brand deal tracking platform."
        />
        <link rel="canonical" href="https://www.brandio.world/terms" />
      </Helmet>

      <div className="static-page">
        <h1>Terms & Conditions</h1>

        <p>
          By accessing or using Brandio, you agree to be bound by these Terms and
          Conditions. If you do not agree, please do not use the platform.
        </p>

        <h3>Use of Service</h3>
        <ul>
          <li>Brandio is provided on an “as-is” and “as-available” basis</li>
          <li>You are responsible for maintaining the accuracy of your data</li>
          <li>You must not attempt unauthorized access or misuse the service</li>
        </ul>

        <h3>Accounts & Payments</h3>
        <ul>
          <li>You are responsible for safeguarding your account credentials</li>
          <li>Paid plans are billed according to the selected pricing</li>
          <li>Refunds, if any, follow our stated billing policy</li>
        </ul>

        <h3>Limitation of Liability</h3>
        <p>
          Brandio is not responsible for losses resulting from incorrect data,
          missed payments, or third-party actions.
        </p>

        <h3>Changes to Terms</h3>
        <p>
          We may update these Terms from time to time. Continued use of Brandio
          means you accept the updated terms.
        </p>

        <h3>Contact</h3>
        <p>
          For questions regarding these terms, contact us at{" "}
          <strong>support@brandio.world</strong>
        </p>
      </div>
    </>
  );
}
