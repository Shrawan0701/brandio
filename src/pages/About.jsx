import { Helmet } from "react-helmet-async";

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Brandio - Brand Deal Tracker for Creators</title>
        <meta
          name="description"
          content="Brandio is a professional brand deal tracker built for creators, influencers, and freelancers to manage collaborations, payments, and earnings in one place."
        />
        <link rel="canonical" href="https://www.brandio.world/about" />
      </Helmet>

      <div className="static-page">
        <h1>About Brandio</h1>

        <p>
          Brandio was built to help creators, influencers, and freelancers manage
          brand collaborations like a real business — not a messy side hustle.
        </p>

        <p>
          Most creators track deals using spreadsheets, WhatsApp chats, emails,
          or random notes. This often leads to missed deadlines, unpaid invoices,
          and confusion around deliverables. Brandio replaces that chaos with a
          single, structured dashboard.
        </p>

        <p>
          With Brandio, you can track brand deals from start to finish — from
          initial collaboration details to final payments — all in one place.
          Whether you’re handling one sponsorship or managing multiple ongoing
          partnerships, Brandio keeps everything clear and organized.
        </p>

        <h3>Why Brandio Exists</h3>
        <p>
          Creators deserve professional tools built specifically for their
          workflow. Brandio exists to remove stress from deal management so you
          can focus on what actually matters: creating content and growing your
          brand.
        </p>

        <h3>What You Can Do With Brandio</h3>
        <ul>
          <li>Track brand deals and collaborations</li>
          <li>Monitor payments, earnings, and due dates</li>
          <li>Manage deliverables and deadlines</li>
          <li>Stay organized without spreadsheets</li>
        </ul>

        <p>
          Brandio is continuously evolving based on feedback from real creators.
          Our goal is simple: make brand deal management effortless.
        </p>
      </div>
    </>
  );
}
