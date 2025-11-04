import { Router } from "express";
import { verifyAccessToken } from '../middleware/verify'; 
import {createJournalValidation,editJournalValidation,deleteJournalValidation,updateStatusJournal,getJournalBranchValidation,getJournalValidation} from '../validations/journalValidation';
import { handleValidationErrors } from "../middleware/handleValidation";
import journalControllers from '../controllers/journalControllers'
const router=Router();
router.use(verifyAccessToken);
router.get("/getJournal/:branchId",getJournalBranchValidation,handleValidationErrors,journalControllers.getJournal);
router.get("/getById/:id",getJournalValidation,handleValidationErrors,journalControllers.getJournalById)
router.post("/add",createJournalValidation,handleValidationErrors,journalControllers.createJournal);
router.put("/edit",editJournalValidation,handleValidationErrors,journalControllers.updateJournal);
router.put("/editStatus",updateStatusJournal,handleValidationErrors,journalControllers.updateStatusJournal);
router.delete("/delete",deleteJournalValidation,handleValidationErrors,journalControllers.deleteJournal);
export default router;