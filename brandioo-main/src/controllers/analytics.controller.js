import { getAnalytics, getDealsForCSV } from "../services/analytics.service.js";
import { Parser } from "json2csv";

export const analytics = async (req, res) => {
  const data = await getAnalytics(req.user.id, req.query.currency);
  res.json(data);
};

export const exportCSV = async (req, res) => {
  const deals = await getDealsForCSV(req.user.id);
  const parser = new Parser();
  const csv = parser.parse(deals);

  res.header("Content-Type", "text/csv");
  res.attachment("brandio-analytics.csv");
  res.send(csv);
};
