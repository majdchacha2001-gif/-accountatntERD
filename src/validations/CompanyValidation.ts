import { body } from "express-validator";
export const createCompanyValidation=[
    body("name").isString().notEmpty().withMessage("name company is required").isLength({min:5}).withMessage('company name is leasts 5 character'),
    body('userId').isInt({ min: 1 }).withMessage('userId must be a positive integer').toInt()
]
export const updateCompanyValidation=[
    body("id").isInt({min:1}).withMessage('id must be a positive integer').toInt(),
    body("name").isString().notEmpty().withMessage("name company is required").isLength({min:5}).withMessage('company name is leasts 5 character'),
]
export const deleteCompanyValidation=[
    body("id").isInt({min:1}).withMessage('id must be a positive integer').toInt(),
]