const appUrl = process.env.APP_URL || "https://brandio.world";

const baseTemplate = ({ title, content, ctaText, ctaLink }) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px;">
          <table width="600" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:100%;">
            <tr>
              <td style="background:#0f172a;padding:24px;">
                <div style="color:#99f6e4;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Brandio</div>
                <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#334155;font-size:15px;line-height:1.6;">
                ${content}
                ${ctaText ? `
                  <div style="margin-top:28px;text-align:center;">
                    <a href="${ctaLink}" style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:700;">
                      ${ctaText}
                    </a>
                  </div>
                ` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:20px;background:#f8fafc;color:#64748b;font-size:13px;text-align:center;">
                <p style="margin:0;">You are receiving this email because you use Brandio.</p>
                <p style="margin:6px 0 0;">© ${new Date().getFullYear()} Brandio</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const signupTemplate = (username) => ({
  subject: "Welcome to Brandio",
  html: baseTemplate({
    title: "Welcome to Brandio",
    content: `
      <p>Hi <b>${username}</b>,</p>
      <p>Your Brandio account has been created. You can now track brand deals, manage payments, and stay organized.</p>
      <ul>
        <li>Add your first brand deal</li>
        <li>Set posting and payment dates</li>
        <li>Use reminders to avoid missed work or payments</li>
      </ul>
    `,
    ctaText: "Go to Dashboard",
    ctaLink: `${appUrl}/dashboard`
  })
});

export const passwordResetOtpTemplate = (otp) => ({
  subject: "Brandio password reset OTP",
  html: baseTemplate({
    title: "Password reset OTP",
    content: `
      <p>Use this OTP to reset your Brandio password:</p>
      <p style="font-size:28px;font-weight:800;letter-spacing:0.18em;color:#0f172a;">${otp}</p>
      <p>This code is valid for 10 minutes. If you did not request this, you can ignore this email.</p>
    `
  })
});

export const inboundInquiryTemplate = (inquiry) => ({
  subject: `New collaboration inquiry from ${inquiry.brand}`,
  html: baseTemplate({
    title: "New collaboration inquiry",
    content: `
      <p>You received a new Work With Me inquiry.</p>
      <p><b>Brand:</b> ${inquiry.brand}</p>
      <p><b>Contact:</b> ${inquiry.contact} (${inquiry.email})</p>
      <p><b>Platform:</b> ${inquiry.platform || "Not specified"}</p>
      <p><b>Budget:</b> ${inquiry.budget || "Not specified"}</p>
      <p><b>Deadline:</b> ${inquiry.deadline || "Not specified"}</p>
      ${inquiry.description ? `<p>${inquiry.description}</p>` : ""}
    `,
    ctaText: "View inbound",
    ctaLink: `${appUrl}/inbound`
  })
});

export const dealCreatedTemplate = (deal) => {
  const amount = Number(deal.total_earned ?? deal.amount ?? 0);
  const currency = deal.currency || "₹";
  return {
    subject: `Deal created - ${deal.brand_name}`,
    html: baseTemplate({
      title: "Deal created",
      content: `
        <p>Your deal with <b>${deal.brand_name}</b> has been added to Brandio.</p>
        <p><b>Platform:</b> ${deal.platform_custom || deal.platform || "Not specified"}</p>
        <p><b>Status:</b> ${deal.status || "pending"}</p>
        ${amount ? `<p><b>Value:</b> ${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>` : ""}
        ${deal.posting_date ? `<p><b>Posting date:</b> ${new Date(deal.posting_date).toLocaleDateString()}</p>` : ""}
        ${deal.payment_due_date ? `<p><b>Payment due:</b> ${new Date(deal.payment_due_date).toLocaleDateString()}</p>` : ""}
      `,
      ctaText: "View deal",
      ctaLink: `${appUrl}/deals/${deal.id}`
    })
  };
};

export const paymentActivatedTemplate = ({ username, planType, planExpiry, amount, currency }) => ({
  subject: "Payment successful - Brandio PRO is active",
  html: baseTemplate({
    title: "Your PRO plan is active",
    content: `
      <p>Hi <b>${username || "creator"}</b>,</p>
      <p>Your Brandio PRO ${planType} payment was verified and your plan is now active.</p>
      ${amount ? `<p><b>Payment:</b> ${currency} ${amount}</p>` : ""}
      ${planExpiry ? `<p><b>Valid until:</b> ${new Date(planExpiry).toLocaleDateString()}</p>` : ""}
      <p>Welcome to the full Brandio creator business OS.</p>
    `,
    ctaText: "Open Billing",
    ctaLink: `${appUrl}/billing`
  })
});

export const postingReminderTemplate = (brand) => ({
  subject: "Posting reminder",
  html: baseTemplate({
    title: "Posting reminder",
    content: `<p>You have scheduled content for <b>${brand}</b> today.</p><p>Publish as agreed and update the deal once the work is done.</p>`,
    ctaText: "View deals",
    ctaLink: `${appUrl}/deals`
  })
});

export const paymentTomorrowTemplate = (brand, amount, currency) => ({
  subject: "Payment due tomorrow",
  html: baseTemplate({
    title: "Payment due tomorrow",
    content: `<p>Your payment from <b>${brand}</b> is due tomorrow.</p><p><b>Amount:</b> ${currency} ${amount}</p>`,
    ctaText: "View deals",
    ctaLink: `${appUrl}/deals`
  })
});

export const paymentTodayTemplate = (brand, amount, currency) => ({
  subject: "Payment due today",
  html: baseTemplate({
    title: "Payment due today",
    content: `<p>Your payment from <b>${brand}</b> is due today.</p><p><b>Amount:</b> ${currency} ${amount}</p>`,
    ctaText: "View deals",
    ctaLink: `${appUrl}/deals`
  })
});

export const paymentOverdueTemplate = (brand, amount, currency) => ({
  subject: "Payment overdue",
  html: baseTemplate({
    title: "Payment overdue",
    content: `<p>Your payment from <b>${brand}</b> is overdue.</p><p><b>Amount:</b> ${currency} ${amount}</p><p>Consider following up and updating the deal when payment arrives.</p>`,
    ctaText: "View deals",
    ctaLink: `${appUrl}/deals`
  })
});

export const deliverableDueTemplate = (title, brand, dueLabel) => ({
  subject: `Deliverable ${dueLabel}`,
  html: baseTemplate({
    title: `Deliverable ${dueLabel}`,
    content: `<p><b>${title}</b> for <b>${brand}</b> is ${dueLabel}.</p><p>Review the deliverable in Brandio and keep the campaign moving.</p>`,
    ctaText: "View deliverables",
    ctaLink: `${appUrl}/deliverables`
  })
});

export const contractReminderTemplate = (title, brand, status) => ({
  subject: `Contract ${status}`,
  html: baseTemplate({
    title: `Contract ${status}`,
    content: `<p><b>${title}</b> for <b>${brand}</b> is ${status}.</p><p>Review the contract status in Brandio.</p>`,
    ctaText: "View contracts",
    ctaLink: `${appUrl}/contracts`
  })
});
