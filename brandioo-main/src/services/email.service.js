import { emailApi } from "../config/brevo.js";
import {
  inboundInquiryTemplate,
  dealCreatedTemplate,
  passwordResetOtpTemplate,
  paymentActivatedTemplate,
  signupTemplate
} from "../utils/email.templates.js";

const logEmailError = (event, err, meta = {}) => {
  const status = err?.response?.status || err?.statusCode;
  const message = err?.response?.body?.message || err?.message || "Unknown email error";
  console.error("EMAIL_SEND_FAILED", {
    event,
    status,
    message,
    userId: meta.userId,
    timestamp: new Date().toISOString()
  });
};

export const sendEmail = async ({ to, subject, html, event = "transactional", meta = {} }) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME || "Brandio"
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    });
    return { sent: true };
  } catch (err) {
    logEmailError(event, err, meta);
    throw err;
  }
};

export const sendWelcomeEmail = async ({ to, username, userId }) =>
  sendEmail({ to, ...signupTemplate(username), event: "welcome", meta: { userId } });

export const sendPasswordResetOtp = async ({ to, otp, userId }) =>
  sendEmail({ to, ...passwordResetOtpTemplate(otp), event: "password_reset_otp", meta: { userId } });

export const sendNewInquiryEmail = async ({ to, inquiry, userId }) =>
  sendEmail({ to, ...inboundInquiryTemplate(inquiry), event: "inbound_inquiry", meta: { userId } });

export const sendDealCreatedEmail = async ({ to, deal, userId }) =>
  sendEmail({ to, ...dealCreatedTemplate(deal), event: "deal_created", meta: { userId } });

export const sendPaymentActivatedEmail = async ({ to, username, planType, planExpiry, amount, currency, userId }) =>
  sendEmail({
    to,
    ...paymentActivatedTemplate({ username, planType, planExpiry, amount, currency }),
    event: "subscription_payment_success",
    meta: { userId }
  });
