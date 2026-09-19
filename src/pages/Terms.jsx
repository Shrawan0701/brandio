import { Helmet } from "react-helmet-async";
import MarketingFooter from "../components/MarketingFooter";

const sections = [
  ["Use of Service", null, ["Brandio is provided on an as-is and as-available basis", "You are responsible for maintaining the accuracy of your data", "You must not attempt unauthorized access or misuse the service"]],
  ["Accounts & Payments", null, ["You are responsible for safeguarding your account credentials", "Paid plans are billed according to the selected pricing", "Refunds, if any, follow our stated billing policy"]],
  ["Limitation of Liability", "Brandio is not responsible for losses resulting from incorrect data, missed payments, or third-party actions."],
  ["Changes to Terms", "We may update these Terms from time to time. Continued use of Brandio means you accept the updated terms."],
  ["Contact", "For questions regarding these terms, contact us at support@brandio.world"]
];

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions - Brandio</title>
        <meta
          name="description"
          content="Read the terms and conditions for using Brandio's brand deal tracking platform."
        />
        <link rel="canonical" href="https://www.brandio.world/terms" />
      </Helmet>

      <div className="static-page legal-page">
        <header className="legal-hero">
          <span className="mk-eyebrow">Legal</span>
          <h1>Terms & Conditions</h1>
          <p>
            By accessing or using Brandio, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.
          </p>
        </header>
        <div className="legal-layout">
          <aside>
            {sections.map(([heading]) => <a href={`#${heading.replaceAll(" ", "-")}`} key={heading}>{heading}</a>)}
          </aside>
          <main>
            {sections.map(([heading, body, list]) => (
              <section id={heading.replaceAll(" ", "-")} key={heading}>
                <h2>{heading}</h2>
                {body && <p>{body}</p>}
                {list && <ul>{list.map((item) => <li key={item}>{item}</li>)}</ul>}
              </section>
            ))}
          </main>
        </div>
      </div>
      <MarketingFooter />
    </>
  );
}
