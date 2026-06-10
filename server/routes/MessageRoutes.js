import { Router } from "express";
import {
  addAudioMessage,
  addImageMessage,
  addMessage,
  getInitialContactsWithMessages,
  getMessages,
  searchMessages,
} from "../controllers/MessageController.js";
import multer from "multer";

const upload = multer({ dest: "uploads/recordings/" });
const uploadImage = multer({ dest: "uploads/images/" });

const router = Router();

router.post("/add-message", addMessage);
router.get("/search", searchMessages);
router.get("/get-messages/:from/:to", getMessages);
router.get("/get-initial-contacts/:from", getInitialContactsWithMessages);

router.post("/add-audio-message", upload.single("audio"), addAudioMessage);
router.post("/add-image-message", uploadImage.single("image"), addImageMessage);

export default router;