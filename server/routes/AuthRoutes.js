import { Router } from "express";
import multer from "multer";
import {
  checkUser,
  generateToken,
  getAllUsers,
  onBoardUser,
  updateProfileImage,
  uploadProfileImage,
} from "../controllers/AuthController.js";

const router = Router();

const uploadProfile = multer({
  dest: "uploads/profile-pictures/",
});

router.post("/check-user", checkUser);
router.post("/onBoardUser", onBoardUser);
router.post("/upload-profile-image", uploadProfile.single("image"), uploadProfileImage);
router.patch("/update-profile-image/:userId", updateProfileImage);
router.get("/get-contacts", getAllUsers);
router.get("/generate-token/:userId", generateToken);

export default router;