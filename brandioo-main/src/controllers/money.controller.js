import {
  getMoneyCockpitDB,
  normalizeMoneySettings,
  updateMoneySettingsDB
} from "../services/money.service.js";

const text = (value, max = 120) => String(value || "").trim().slice(0, max);

export const getMoneyCockpit = async (req, res) => {
  try {
    const data = await getMoneyCockpitDB(req.user.id, req.query.currency);
    res.json(data);
  } catch (err) {
    console.error("GET MONEY COCKPIT ERROR:", err);
    res.status(500).json({ message: "Could not load money cockpit" });
  }
};

export const updateMoneySettings = async (req, res) => {
  try {
    const payload = normalizeMoneySettings({
      tax_reserve_percentage: req.body.tax_reserve_percentage,
      gst_number: text(req.body.gst_number, 30),
      pan_number: text(req.body.pan_number, 20),
      business_name: text(req.body.business_name, 160),
      tds_tracking_enabled: req.body.tds_tracking_enabled === true,
      invoice_prefix: text(req.body.invoice_prefix, 30)
    });
    const settings = await updateMoneySettingsDB(req.user.id, payload);
    res.json({ settings });
  } catch (err) {
    console.error("UPDATE MONEY SETTINGS ERROR:", err);
    res.status(500).json({ message: "Could not update money settings" });
  }
};
