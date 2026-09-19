import { Router } from "express";
import {
  getPortfolio,
  getCandidates,
  getUploadSignature,
  createPortfolioItem,
  updatePortfolioItem,
  toggleVisibility,
  toggleFeatured,
  deletePortfolioItem
} from "../controllers/portfolio.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

/* Portfolio is a creator-only surface — same auth as every other creator API */
router.use(authRequired);

/* named routes first so they can never be read as :id params */
router.get("/", getPortfolio);
router.get("/candidates", getCandidates);
router.get("/upload-signature", getUploadSignature);

router.post("/", createPortfolioItem);
router.put("/:id", updatePortfolioItem);
router.delete("/:id", deletePortfolioItem);
router.patch("/:id/visibility", toggleVisibility);
router.patch("/:id/featured", toggleFeatured);

export default router;