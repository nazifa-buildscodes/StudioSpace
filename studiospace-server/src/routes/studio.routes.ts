
import { Router } from "express";
import {
  getStudios,
  getStudioById,
  createStudio,
  updateStudio,
  deleteStudio,
} from "../controllers/studio.controller";

const router = Router();

// GET all studios
router.get("/", getStudios);

// GET single studio
router.get("/:id", getStudioById);

// CREATE studio
router.post("/", createStudio);

// UPDATE studio
router.patch("/:id", updateStudio);

// DELETE studio
router.delete("/:id", deleteStudio);

export default router;
