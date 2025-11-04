import { body,param } from "express-validator";
const createInvoiceValidation=[
    
]
const editInvoiceValidation=[

]

const getInvoiceValidation=[

]
const deleteInvoiceValidation=[
        
]
const getReportValidation=[
    param("branchId")
        .isInt().withMessage("branchId must be an integer"),

    param("type")
        .isIn(["sales", "purchase"]).withMessage("type must be 'sales' or 'purchase'"),

    param("startDate")
        .isISO8601().withMessage("startDate must be a valid date"),

    param("endDate")
        .isISO8601().withMessage("endDate must be a valid date"),
    ]