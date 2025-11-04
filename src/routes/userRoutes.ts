import { Router } from "express";
import userControllers from "../controllers/userControllers";
import {registerValidation ,refreshTokenValidation, loginValidation} from '../validations/userValidation'
import {handleValidationErrors } from '../middleware/handleValidation'
const router=Router();
router.post("/register",registerValidation,handleValidationErrors,userControllers.register);
router.post("/login",loginValidation,handleValidationErrors,userControllers.login);
router.post("/refresh",refreshTokenValidation,handleValidationErrors,userControllers.refreshToken);
export default router;