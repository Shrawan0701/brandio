import { Router } from "express";
import {
  listContracts,
  getContract,
  getDealContract,
  getUploadSignature,
  attachContract,
  updateContract,
  setContractStatus,
  setContractSignature,
  removeContract
} from "../controllers/contracts.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

/* Contracts are a creator-only surface — same auth as every other creator API */
router.use(authRequired);

/* named routes first so they can never be read as :id params */
router.get("/", listContracts);
router.get("/upload-signature", getUploadSignature);
router.get("/deal/:dealId", getDealContract);
router.get("/:id", getContract);

router.post("/", attachContract);
router.post("/deal/:dealId", attachContract);
router.put("/:id", updateContract);
router.delete("/:id", removeContract);
router.patch("/:id/status", setContractStatus);
router.patch("/:id/signature", setContractSignature);

export default router;
