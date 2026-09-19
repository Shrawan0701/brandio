import cron from "node-cron";
import { processReminders } from "../services/reminder.service.js";

/* Runs every day at 9 AM */
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Running reminder cron");
  await processReminders();
});
