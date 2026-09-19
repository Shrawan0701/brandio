import pool from "../config/db.js";

export const downgradeExpiredPlans = async () => {
  await pool.query(`
    UPDATE users
    SET plan='free', plan_expiry=NULL
    WHERE plan='pro' AND plan_expiry < NOW()
  `);
};
