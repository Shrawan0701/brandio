import { Helmet } from "react-helmet-async";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Brandio</title>
        <meta
          name="description"
          content="Brandio’s privacy policy explains how we collect, use, and protect your data while using our platform."
        />
        <link rel="canonical" href="https://www.brandio.world/privacy" />
      </Helmet>

      <div className="static-page">
        <h1>Privacy Policy</h1>

        <p>
          At Brandio, your privacy is important to us. This Privacy Policy
          explains what information we collect, how we use it, and how we protect
          your data.
        </p>

        <h3>Information We Collect</h3>
        <p>
          We collect only the information necessary to provide and improve our
          services. This may include:
        </p>
        <ul>
          <li>Email address and authentication details</li>
          <li>Brand deal data you voluntarily enter</li>
          <li>Basic usage and analytics data</li>
        </ul>

        <h3>How We Use Your Information</h3>
        <ul>
          <li>To operate and maintain the Brandio platform</li>
          <li>To improve product features and performance</li>
          <li>To communicate important updates and support messages</li>
        </ul>

        <h3>What We Do Not Do</h3>
        <ul>
          <li>We do not sell your personal data</li>
          <li>We do not share your data with advertisers</li>
          <li>We do not access your data without permission</li>
        </ul>

        <h3>Data Security</h3>
        <p>
          We use industry-standard security measures to protect your data.
          However, no online service can guarantee absolute security.
        </p>

        <h3>Contact</h3>
        <p>
          If you have any questions about this Privacy Policy, contact us at{" "}
          <strong>support@brandio.world</strong>
        </p>
      </div>
    </>
  );
}
