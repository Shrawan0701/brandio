import { Link } from "react-router-dom";

export default function MarketingFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-footer-top">
        <div>
          <h3>Brandio</h3>
          <p>The Business OS for Creators. Manage every brand collaboration from opportunity to payment.</p>
        </div>
        <FooterCol title="Product" links={[["Dashboard", "/dashboard"], ["Deals", "/dashboard"], ["Brands", "/brands"], ["Deliverables", "/deliverables"], ["Money", "/money"], ["Intelligence", "/intelligence"], ["Media Kit", "/profile"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Contact", "/contact"], ["FAQ", "/faq"]]} />
        <FooterCol title="Resources" links={[["Features", "/features"], ["Pricing", "/payment"], ["Support", "/contact"]]} />
        <FooterCol title="Legal" links={[["Privacy", "/privacy"], ["Terms", "/terms"]]} />
      </div>
      <div className="mk-footer-bottom">© 2026 Brandio. All rights reserved.</div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4>{title}</h4>
      {links.map(([label, to]) => <Link to={to} key={label}>{label}</Link>)}
    </div>
  );
}
