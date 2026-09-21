import { analyzeDealTerms } from "../services/deal-analyzer.service.js";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const analyzeDeal = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (text.length < 40) {
      return res.status(400).json({ message: "Paste enough deal or contract text to analyze." });
    }
    if (text.length > 60000) {
      return res.status(400).json({ message: "Text is too long. Please analyze a shorter excerpt." });
    }

    const analysis = await analyzeDealTerms(text);
    res.json(analysis);
  } catch (err) {
    console.error("DEAL ANALYZER ERROR:", err);
    res.status(500).json({ message: "Could not analyze deal terms" });
  }
};

export const extractDealFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Choose a PDF, DOCX, or text file." });

    const name = file.originalname || "";
    const mime = file.mimetype || "";
    const ext = name.toLowerCase().split(".").pop();
    let text = "";

    if (mime === "application/pdf" || ext === "pdf") {
      const parser = new PDFParse({ data: file.buffer });
      const parsed = await parser.getText();
      text = parsed.text || "";
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      const parsed = await mammoth.extractRawText({ buffer: file.buffer });
      text = parsed.value || "";
    } else if (["txt", "md", "csv", "rtf"].includes(ext)) {
      text = file.buffer.toString("utf8");
    } else if (ext === "doc") {
      return res.status(400).json({ message: "Old .doc files are not supported yet. Save it as .docx or PDF and upload again." });
    } else {
      return res.status(400).json({ message: "Upload a PDF, DOCX, or text file." });
    }

    const cleaned = text.replace(/\u0000/g, "").trim();
    if (cleaned.length < 40) {
      return res.status(400).json({ message: "Could not read enough text from this file." });
    }
    if (cleaned.length > 60000) {
      return res.status(400).json({ message: "File text is too long. Upload a shorter document or paste an excerpt." });
    }

    res.json({ text: cleaned });
  } catch (err) {
    console.error("DEAL ANALYZER FILE ERROR:", err);
    res.status(500).json({ message: "Could not read this file." });
  }
};
