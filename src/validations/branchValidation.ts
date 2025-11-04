import { body } from 'express-validator';
export const createValidation=[
    body("name").isString().notEmpty().withMessage("name is required").isLength({ min: 3 }).withMessage('name must be at least 3 characters'),
    body("phone").isNumeric().notEmpty().withMessage("phone is required").isLength({ min: 9 }).withMessage('phone must be at least 9 number'),
    body("location").isString().notEmpty().withMessage("location is required").isLength({min:3}).withMessage("location must be least 3 characters"),
    body('username').isString().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isString().notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isString().notEmpty().withMessage('Role is required').isIn(['admin', 'user']).withMessage('Role must be either admin or user'),
]