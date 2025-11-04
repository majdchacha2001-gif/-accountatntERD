import { body ,param} from "express-validator";
export const createProductValidation = [
    body("name").trim().isString().withMessage("Name must be a string").notEmpty().withMessage("Name is required").isLength({ min: 5 }).withMessage("Name must be at least 5 characters"),
    body('userId').isInt({ min: 1 }).withMessage('userId must be a positive integer').toInt(),
    body("branchId").isInt({ min: 1 }).withMessage('branchId must be a positive integer').toInt(),
    body("companyId").isInt({ min: 1 }).withMessage('companyId must be a positive integer').toInt(),
    body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number").toFloat(),
    body("pricePurchases").isFloat({ min: 0 }).withMessage("pricePurchases must be a positive number").toFloat(),
    body("priceSales").isFloat({ min: 0 }).withMessage("priceSales must be a positive number").toFloat(),
    body("description").optional(),
    body("unit").trim().isString().withMessage("Unit must be a string").notEmpty().withMessage("Unit is required").isLength({ max: 5 }).withMessage("Unit must not exceed 5 characters")
];
export const getProductValidation=[
    // param("branchId").isInt({ min: 1 }).withMessage('Invalid branchId').toInt()
]
export const updateProductValidation=[
    body("id").isInt({ min: 1 }).withMessage('Invalid id').toInt(),
    body("name").trim().isString().withMessage("Name must be a string").notEmpty().withMessage("Name is required").isLength({ min: 5 }).withMessage("Name must be at least 5 characters"),
    body("companyId").isInt({ min: 1 }).withMessage('companyId must be a positive integer').toInt(),
    body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number").toFloat(),
    body("description").trim().isString().withMessage("Description must be a string").notEmpty().withMessage("Description is required").isLength({ min: 5 }).withMessage("Description must be at least 5 characters"),
    body("pricePurchases").isFloat({ min: 0 }).withMessage("pricePurchases must be a positive number").toFloat(),
    body("priceSales").isFloat({ min: 0 }).withMessage("priceSales must be a positive number").toFloat(),
    body("unit").trim().isString().withMessage("Unit must be a string").notEmpty().withMessage("Unit is required").isLength({ max: 5 }).withMessage("Unit must not exceed 5 characters")
]
export const deleteProductValidation=[
    body("id").isInt({ min: 1 }).withMessage('Invalid id').toInt()
]