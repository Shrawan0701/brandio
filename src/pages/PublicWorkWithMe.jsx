import { cloneElement, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { fetchCreatorWorkPage, submitInboundInquiry } from "../lib/api";

const initial = {
  campaign_type: "", platform: "", budget: "", deliverables: "", deadline: "",
  usage_requirements: "", brand: "", contact: "", email: "", website: "", campaign: "", description: ""
};
const campaignTypes = ["Sponsored post", "UGC", "Affiliate", "Event", "Product launch", "Other"];
const steps = [
  { label: "Campaign", title: "What do you have in mind?", description: "Share the idea, even if it’s still taking shape." },
  { label: "Scope & budget", title: "Let’s talk about the details.", description: "A little context helps set the right expectations." },
  { label: "Contact", title: "Who’s behind the brief?", description: "Leave your details so the creator can get back to you." }
];

export default function PublicWorkWithMe() {
  const { username } = useParams();
  const [creator, setCreator] = useState(null);
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const headingRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setSubmitError("");
    setForm(initial);
    setStep(0);
    setSent(false);
    setPhotoFailed(false);
    fetchCreatorWorkPage(username)
      .then((data) => {
        if (!active) return;
        if (!data?.creator) throw new Error("Creator not found");
        setCreator(data.creator);
      })
      .catch(() => { if (active) setLoadError("This creator page is not available."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [step, sent]);
  useEffect(() => { if (submitError) errorRef.current?.focus(); }, [submitError]);

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (step < steps.length - 1) { setStep((current) => current + 1); return; }
    setSaving(true);
    setSubmitError("");
    try {
      await submitInboundInquiry(username, form);
      setSent(true);
      setForm(initial);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Your brief couldn’t be sent. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const name = creator?.display_name || creator?.username || "Creator";
  const publicHandle = creator?.public_slug || creator?.username || username;
  const profilePath = `/${publicHandle}`;

  return <div className="collab-page">
    <Helmet><title>Work with {name} - Brandio</title></Helmet>
    <header className="cb-topbar cb-container">
      <Link to={profilePath} className="cb-back-link"><span aria-hidden="true">←</span> Back to profile</Link>
      <Link to="/" className="cb-brand"><img src="/brandio-logo.png" alt="" />Brandio<span> / COLLABORATIONS</span></Link>
    </header>

    {loading || loadError ? <div className="cb-state cb-container" role="status"><span className="cb-kicker">COLLABORATION REQUEST</span><h1>{loading ? "Getting things ready…" : "Profile unavailable"}</h1><p>{loading ? "Loading the creator’s details." : loadError}</p></div> : <>
      <div className="cb-page-heading cb-container"><span className="cb-kicker">A NEW COLLABORATION</span><h1>Start with a brief.</h1><p>A few details to get the conversation started.</p></div>

      <div className="cb-layout cb-container">
        <aside className="cb-sidebar" aria-label="Creator and brief guidance">
          <section className="cb-recipient">
            <span className="cb-kicker">YOU’RE REACHING OUT TO</span>
            <div className="cb-creator">
              {creator?.profile_image_url && !photoFailed ? <img src={creator.profile_image_url} alt={name} onError={() => setPhotoFailed(true)} /> : <span className="cb-avatar" aria-label={name}>{name.slice(0, 1).toUpperCase()}</span>}
              <div><h2>{name}</h2><span>@{publicHandle}</span></div>
            </div>
            <Link to={profilePath}>View creator profile <Arrow /></Link>
          </section>
          <div className="cb-guidance"><span className="cb-kicker">A USEFUL BRIEF INCLUDES</span><ul><li><span>01</span>The idea and the goal</li><li><span>02</span>Deliverables and timing</li><li><span>03</span>A budget or a starting point</li></ul><p>You don’t need every detail figured out. Add what you know.</p></div>
          <div className="cb-sidebar-note"><span aria-hidden="true">↗</span><p>Your request goes directly to {name}’s collaboration inbox.</p></div>
        </aside>

        <section className="cb-form-panel" aria-label="Collaboration brief">
          {sent ? <div className="cb-success">
            <span className="cb-success-mark" aria-hidden="true">✓</span><span className="cb-kicker">BRIEF DELIVERED</span>
            <h2 ref={headingRef} tabIndex={-1}>Your brief has been sent.</h2>
            <p>Your collaboration request has been sent to {name}. They can reply using the email you provided.</p>
            <Link to={profilePath} className="cb-primary">Back to creator profile <Arrow /></Link>
          </div> : <>
            <nav className="cb-steps" aria-label="Brief steps"><ol>{steps.map((item, index) => <li key={item.label}><button type="button" aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)} disabled={saving}><span className={`cb-step-number ${step > index ? "is-done" : ""}`}>{step > index ? "✓" : `0${index + 1}`}</span><span>{item.label}</span></button></li>)}</ol></nav>
            <div className="cb-step-heading"><span className="cb-step-count">STEP 0{step + 1} / 03</span><h2 ref={headingRef} tabIndex={-1}>{steps[step].title}</h2><p>{steps[step].description}</p></div>

            <form onSubmit={submit}>
              <fieldset className="cb-fields" disabled={saving}>
                <legend className="cb-sr-only">{steps[step].label}</legend>
                {step === 0 && <>
                  <BriefField name="campaign" label="Campaign name"><input name="campaign" maxLength={180} placeholder="e.g. Summer collection launch" value={form.campaign} onChange={(e) => update("campaign", e.target.value)} /></BriefField>
                  <fieldset className="cb-type-group"><legend>Collaboration type <span>Optional</span></legend><div className="cb-type-options">{campaignTypes.map((type) => <label key={type}><input type="radio" name="campaign_type" value={type} checked={form.campaign_type === type} onChange={() => update("campaign_type", type)} /><span>{type}</span><span className="cb-radio-mark" aria-hidden="true" /></label>)}</div></fieldset>
                  <BriefField name="platform" label="Platform"><input name="platform" list="cb-platforms" maxLength={80} placeholder="e.g. Instagram, YouTube" value={form.platform} onChange={(e) => update("platform", e.target.value)} /></BriefField>
                  <datalist id="cb-platforms">{["Instagram", "YouTube", "TikTok", "X / Twitter", "LinkedIn", "Multiple platforms"].map((platform) => <option key={platform} value={platform} />)}</datalist>
                  <BriefField name="description" label="The idea" hint="The goal, the audience, and what you’d like to create."><textarea name="description" rows={4} maxLength={2000} placeholder="Give me a little context about your campaign…" value={form.description} onChange={(e) => update("description", e.target.value)} /></BriefField>
                </>}
                {step === 1 && <>
                  <div className="cb-field-grid"><BriefField name="budget" label="Budget range"><input name="budget" maxLength={80} placeholder="e.g. ₹10,000–₹25,000" value={form.budget} onChange={(e) => update("budget", e.target.value)} /></BriefField><BriefField name="deadline" label="Campaign deadline"><input name="deadline" type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} /></BriefField></div>
                  <BriefField name="deliverables" label="Deliverables" hint="Formats, quantities, and anything you already have planned."><textarea name="deliverables" rows={3} maxLength={1000} placeholder="e.g. 1 Reel and 3 Stories on Instagram" value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} /></BriefField>
                  <BriefField name="usage_requirements" label="Usage rights & requirements" hint="Paid ads, exclusivity, licensing, or other expectations."><textarea name="usage_requirements" rows={3} maxLength={1000} placeholder="e.g. Organic use for 30 days, no exclusivity" value={form.usage_requirements} onChange={(e) => update("usage_requirements", e.target.value)} /></BriefField>
                  <p className="cb-optional-note">Still working out the scope? You can leave these details open.</p>
                </>}
                {step === 2 && <>
                  <BriefField name="brand" label="Brand / company name" required><input name="brand" autoComplete="organization" required maxLength={150} placeholder="Your brand or company" value={form.brand} onChange={(e) => update("brand", e.target.value)} /></BriefField>
                  <div className="cb-field-grid"><BriefField name="contact" label="Your name" required><input name="contact" autoComplete="name" required maxLength={150} placeholder="Full name" value={form.contact} onChange={(e) => update("contact", e.target.value)} /></BriefField><BriefField name="email" label="Email address" required><input name="email" autoComplete="email" type="email" required maxLength={180} placeholder="you@company.com" value={form.email} onChange={(e) => update("email", e.target.value)} /></BriefField></div>
                  <BriefField name="website" label="Website"><input name="website" autoComplete="url" inputMode="url" maxLength={300} placeholder="Your website or brand’s social profile" value={form.website} onChange={(e) => update("website", e.target.value)} /></BriefField>
                  {(form.campaign || form.campaign_type || form.platform || form.budget || form.description) && <div className="cb-review"><div><span className="cb-kicker">YOUR BRIEF, AT A GLANCE</span><button type="button" onClick={() => setStep(0)}>Edit brief <span aria-hidden="true">↗</span></button></div><strong>{form.campaign || form.campaign_type || "New collaboration"}</strong>{(form.campaign_type || form.platform || form.budget) && <p>{[form.campaign_type, form.platform, form.budget].filter(Boolean).join(" · ")}</p>}{form.description && <p className="cb-review-description">{form.description}</p>}</div>}
                </>}
              </fieldset>

              {submitError && <div className="cb-error" role="alert" ref={errorRef} tabIndex={-1}>{submitError}</div>}
              <div className="cb-form-footer"><button className="cb-previous" type="button" onClick={() => setStep((current) => current - 1)} disabled={step === 0 || saving}><span aria-hidden="true">←</span> Back</button><button className="cb-primary" type="submit" disabled={saving}>{saving ? "Sending brief…" : step === 2 ? "Send collaboration request" : "Continue"}{!saving && <Arrow />}</button></div>
              <p className="cb-footer-note">{step === 2 ? "Fields marked * are required. Your contact details are shared with the creator." : "Your progress is kept while you move between steps."}</p>
            </form>
          </>}
        </section>
      </div>
      <footer className="cb-page-footer cb-container"><span>A direct conversation. A better collaboration.</span><Link to="/">Powered by Brandio <Arrow /></Link></footer>
    </>}
  </div>;
}

function BriefField({ name, label, required = false, hint, children }) {
  const id = `cb-${name}`;
  return <div className="cb-field"><label htmlFor={id}>{label}{required ? <span className="cb-required" aria-hidden="true">*</span> : <span className="cb-optional">Optional</span>}</label>{cloneElement(children, { id, "aria-describedby": hint ? `${id}-hint` : undefined })}{hint && <span className="cb-field-hint" id={`${id}-hint`}>{hint}</span>}</div>;
}

function Arrow() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>; }
