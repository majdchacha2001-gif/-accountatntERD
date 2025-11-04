import { body } from 'express-validator';
export const registerValidation = [
    body('username')
        .isString()
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters'),

    body('password')
        .isString()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),

    body('role')
        .isString()
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['admin', 'user']) // adjust allowed roles
        .withMessage('Role must be either admin or user'),
];
export const loginValidation=[
    body('username')
        .isString()
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters'),

    body('password')
        .isString()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
]
export const refreshTokenValidation=[
    body("refreshToken")
    .isString()
    .notEmpty()
    .withMessage("refresh is required")
]