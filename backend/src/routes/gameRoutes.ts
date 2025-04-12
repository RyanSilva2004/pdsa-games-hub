import express from "express";
import { getTestMessage } from "../controllers/eightQueensPuzzleController/testController";

const router = express.Router();

router.get("/eightQueensPuzzle", getTestMessage);

export default router;
