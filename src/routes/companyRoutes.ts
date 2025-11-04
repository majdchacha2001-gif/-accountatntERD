import { Router } from "express";
import companyNameControllers from "../controllers/companyNameControllers";
import {createCompanyValidation,updateCompanyValidation,deleteCompanyValidation} from '../validations/CompanyValidation';
import { handleValidationErrors } from "../middleware/handleValidation";
import { verifyAccessToken } from '../middleware/verify'; // المسار حسب مشروعك
const router=Router();
router.use(verifyAccessToken);
router.get('/get',companyNameControllers.getCompany);
router.post('/add',createCompanyValidation,handleValidationErrors,companyNameControllers.createCompany);
router.put('/edit',updateCompanyValidation,handleValidationErrors,companyNameControllers.updateCompany);
router.delete('/delete/:id',companyNameControllers.deleteCompany);
export default router;