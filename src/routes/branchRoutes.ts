import { Router } from "express";
import branchControllers from "../controllers/branchControllers";
import {createValidation} from '../validations/branchValidation';
import {handleValidationErrors } from '../middleware/handleValidation'
import { verifyAccessToken } from "../middleware/verify";
const router=Router();
// router.use(verifyAccessToken);
router.post("/add",branchControllers.createBranch);
router.get("/get",branchControllers.getBranch);
router.put("/edit",branchControllers.updateBranch);
export default router;