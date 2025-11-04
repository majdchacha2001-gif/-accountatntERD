import { Router } from "express";
import { verifyAccessToken } from '../middleware/verify'; // المسار حسب مشروعك
import accountTreeControllers from '../controllers/accountTreeControllers';
const router=Router();
router.use(verifyAccessToken);
router.get('/accountTree/:branchId', accountTreeControllers.getAccountTree);
router.get('/finalAccount/:branchId',accountTreeControllers.getFinalAccount);
router.get('/parentAccount/:branchId',accountTreeControllers.getParentAccount);
router.get("/childAccount/:branchId",accountTreeControllers.getChildAccount);
router.get("/getBalance/:accountId",accountTreeControllers.getAccountStatement);
router.get("/getAccountList/:branchId",accountTreeControllers.getAccountList);
router.get("/getTotalAccounts/:branchId",accountTreeControllers.getAccountTotals);
router.get("/getDetails/:id",accountTreeControllers.getAccountById);
router.post('/add',accountTreeControllers.createAccount);
router.put('/edit',accountTreeControllers.editAccount);
router.delete('/delete',accountTreeControllers.deleteAccount);
export default router;