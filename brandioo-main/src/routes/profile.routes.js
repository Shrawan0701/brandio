import { Router } from "express";
import {
  getProfileUploadSignature,
  me,
  saveProfilePhoto,
  updateProfile,
  updatePublicSlug,
  updateSocials
} from "../controllers/profile.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";



const router = Router();

router.use(authRequired);

router.get("/me", me);
router.put("/socials", updateSocials);

router.put("/update", updateProfile);
router.put("/public-slug", updatePublicSlug);
router.get("/photo/upload-signature", getProfileUploadSignature);
router.post("/photo", saveProfilePhoto);


export default router;
