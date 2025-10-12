import { Router } from "express";
import { register } from "../controllers/auth/registerController";
import { login } from "../controllers/auth/loginController";
import { refreshToken } from "../controllers/auth/refreshTokenController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refreshToken", refreshToken);

export default router;
