import { getAnalytics, getDealsForCSV } from "../services/analytics.service.js";
import { Parser } from "json2csv";
import pool from "../config/db.js";

export const analytics = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT plan FROM users WHERE id=$1`,
    [req.user.id]
  );

  if (!rows.length || rows[0].plan !== "pro") {
    return res.status(403).json({ message: "Pro only feature" });
  }

  const data = await getAnalytics(req.user.id);
  res.json(data);
};

export const exportCSV = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT plan FROM users WHERE id=$1`,
    [req.user.id]
  );

  if (!rows.length || rows[0].plan !== "pro") {
    return res.status(403).json({ message: "Pro only feature" });
  }

  const deals = await getDealsForCSV(req.user.id);
  const parser = new Parser();
  const csv = parser.parse(deals);

  res.header("Content-Type", "text/csv");
  res.attachment("brandio-analytics.csv");
  res.send(csv);
};

