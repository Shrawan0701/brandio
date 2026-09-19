import pool from "../config/db.js";
import { sendEmail } from "./email.service.js";
import {
  contractReminderTemplate,
  deliverableDueTemplate,
  postingReminderTemplate,
  paymentTomorrowTemplate,
  paymentTodayTemplate,
  paymentOverdueTemplate
} from "../utils/email.templates.js";
import { createNotificationOnce } from "./notification.service.js";

const sendOnce = async ({ userId, email, eventKey, template, notification }) => {
  if (notification) {
    await createNotificationOnce({
      userId,
      eventKey,
      ...notification
    }).catch(() => null);
  }

  const inserted = await pool.query(
    `INSERT INTO notification_events (user_id, event_key, channel, status)
     VALUES ($1,$2,'email','pending')
     ON CONFLICT (user_id, event_key, channel) DO NOTHING
     RETURNING id`,
    [userId, eventKey]
  );
  if (!inserted.rows.length) return false;

  try {
    await sendEmail({ to: email, ...template, event: eventKey, meta: { userId } });
    await pool.query(`UPDATE notification_events SET status='sent' WHERE id=$1`, [inserted.rows[0].id]);
    return true;
  } catch (err) {
    await pool.query(`UPDATE notification_events SET status='failed' WHERE id=$1`, [inserted.rows[0].id]);
    return false;
  }
};

export const processReminders = async () => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  /* ================= POSTING REMINDERS ================= */
  const posting = await pool.query(
    `
    SELECT d.id, d.user_id, d.brand_name, u.email
    FROM deals d
    JOIN users u ON u.id = d.user_id
    WHERE d.posting_date = $1
      AND d.status != 'completed'
    `,
    [todayStr]
  );

  for (const deal of posting.rows) {
    await sendOnce({
      userId: deal.user_id,
      email: deal.email,
      eventKey: `deal:${deal.id}:posting:${todayStr}`,
      template: postingReminderTemplate(deal.brand_name),
      notification: {
        type: "posting_reminder",
        title: "Posting reminder",
        message: `You have scheduled content for ${deal.brand_name} today.`,
        entityType: "deal",
        entityId: deal.id,
        actionUrl: "/deals"
      }
    });
  }

  /* ================= PAYMENT REMINDERS ================= */

  // 1️⃣ Due Tomorrow
  const dueTomorrow = await pool.query(
    `
    SELECT d.*, u.email
    FROM deals d
    JOIN users u ON u.id = d.user_id
    WHERE d.payment_due_date = $1
      AND d.status != 'completed'
    `,
    [tomorrowStr]
  );

  for (const deal of dueTomorrow.rows) {
    await sendOnce({
      userId: deal.user_id,
      email: deal.email,
      eventKey: `deal:${deal.id}:payment_due_tomorrow:${tomorrowStr}`,
      template: paymentTomorrowTemplate(
        deal.brand_name,
        deal.amount,
        deal.currency
      ),
      notification: {
        type: "payment_due_tomorrow",
        title: "Payment due tomorrow",
        message: `${deal.currency} ${deal.amount} from ${deal.brand_name} is due tomorrow.`,
        entityType: "deal",
        entityId: deal.id,
        actionUrl: "/money"
      }
    });
  }

  // 2️⃣ Due Today
  const dueToday = await pool.query(
    `
    SELECT d.*, u.email
    FROM deals d
    JOIN users u ON u.id = d.user_id
    WHERE d.payment_due_date = $1
      AND d.status != 'completed'
    `,
    [todayStr]
  );

  for (const deal of dueToday.rows) {
    await sendOnce({
      userId: deal.user_id,
      email: deal.email,
      eventKey: `deal:${deal.id}:payment_due_today:${todayStr}`,
      template: paymentTodayTemplate(
        deal.brand_name,
        deal.amount,
        deal.currency
      ),
      notification: {
        type: "payment_due_today",
        title: "Payment due today",
        message: `${deal.currency} ${deal.amount} from ${deal.brand_name} is due today.`,
        entityType: "deal",
        entityId: deal.id,
        actionUrl: "/money"
      }
    });
  }

  // 3️⃣ Overdue
  const overdue = await pool.query(
    `
    SELECT d.*, u.email
    FROM deals d
    JOIN users u ON u.id = d.user_id
    WHERE d.payment_due_date < $1
      AND d.status != 'completed'
    `,
    [todayStr]
  );

  for (const deal of overdue.rows) {
    await sendOnce({
      userId: deal.user_id,
      email: deal.email,
      eventKey: `deal:${deal.id}:payment_overdue:${todayStr}`,
      template: paymentOverdueTemplate(
        deal.brand_name,
        deal.amount,
        deal.currency
      ),
      notification: {
        type: "payment_overdue",
        title: "Payment overdue",
        message: `${deal.currency} ${deal.amount} from ${deal.brand_name} is overdue.`,
        entityType: "deal",
        entityId: deal.id,
        actionUrl: "/money"
      }
    });
  }

  const deliverablesTomorrow = await pool.query(
    `
    SELECT dl.id, dl.user_id, dl.title, dl.due_date::text AS due_date, d.brand_name, u.email
    FROM deliverables dl
    JOIN deals d ON d.id = dl.deal_id
    JOIN users u ON u.id = dl.user_id
    WHERE dl.due_date = $1
      AND dl.status NOT IN ('approved','published','completed')
    `,
    [tomorrowStr]
  );

  for (const item of deliverablesTomorrow.rows) {
    await sendOnce({
      userId: item.user_id,
      email: item.email,
      eventKey: `deliverable:${item.id}:due_tomorrow:${tomorrowStr}`,
      template: deliverableDueTemplate(item.title, item.brand_name, "due tomorrow"),
      notification: {
        type: "deliverable_due_tomorrow",
        title: "Deliverable due soon",
        message: `Your ${item.title} for ${item.brand_name} is due tomorrow.`,
        entityType: "deliverable",
        entityId: item.id,
        actionUrl: "/deliverables"
      }
    });
  }

  const contractsExpiring = await pool.query(
    `
    SELECT c.id, c.user_id, c.title, c.expires_at::text AS expires_at, d.brand_name, u.email
    FROM contracts c
    JOIN deals d ON d.id = c.deal_id
    JOIN users u ON u.id = c.user_id
    WHERE c.expires_at = CURRENT_DATE + INTERVAL '7 days'
      AND c.status != 'signed'
    `
  );

  for (const contract of contractsExpiring.rows) {
    await sendOnce({
      userId: contract.user_id,
      email: contract.email,
      eventKey: `contract:${contract.id}:expires_soon:${contract.expires_at}`,
      template: contractReminderTemplate(contract.title, contract.brand_name, "expiring soon"),
      notification: {
        type: "contract_expires_soon",
        title: "Contract expiring soon",
        message: `Your contract with ${contract.brand_name} expires in 7 days.`,
        entityType: "contract",
        entityId: contract.id,
        actionUrl: "/contracts"
      }
    });
  }

  console.log("✅ Reminder emails processed");
};
