import { body ,param} from "express-validator"

export const createJournalValidation = [
  body("date")
    .notEmpty().withMessage("Date is required")
    .isISO8601().withMessage("Date must be a valid date (YYYY-MM-DD)"),

  body("description")
    .trim().
    optional()
    .isString().withMessage("Description is required")
    .isLength({ min: 3 }).withMessage("Description must be at least 3 characters"),

  body("type")
    .notEmpty().withMessage("Type is required")
    .isIn(["primary", "accountant"]).withMessage("Type must be either 'primary' or 'accountant'"),

  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["accept", "pending"]).withMessage("Status must be either 'accept' or 'pending'"),

  body("details")
    .isArray({ min: 2 }).withMessage("Details must be an array with at least 2 items"),

  body("details.*.accountId")
    .notEmpty().withMessage("Account ID is required for each detail")
    .isInt({ gt: 0 }).withMessage("Account ID must be a positive integer"),

  body("details.*.debtor")
    .isFloat({ min: 0 }).withMessage("Debtor must be a positive number or zero"),

  body("details.*.creditor")
    .isFloat({ min: 0 }).withMessage("Creditor must be a positive number or zero"),

  body("details.*.currency")
    .notEmpty().withMessage("Currency is required for each detail")
    .isString().withMessage("Currency must be a string"),

  body("details.*.debtorVs")
    .isFloat({ min: 0 }).withMessage("DebtorVs must be a positive number or zero"),

  body("details.*.creditorVs")
    .isFloat({ min: 0 }).withMessage("CreditorVs must be a positive number or zero"),

  body("details.*.currencyVs")
    .optional()
    .isString().withMessage("CurrencyVs must be a string if provided"),

  body("details").custom((details) => {
    const totalDebtor = details.reduce((sum: number, d: any) => sum + (d.debtor || 0), 0);
    const totalCreditor = details.reduce((sum: number, d: any) => sum + (d.creditor || 0), 0);
    if (totalDebtor !== totalCreditor) {
      throw new Error("Journal entry is not balanced. Debtor and Creditor must be equal.");
    }
    return true;
  }),

  body("details").custom((details) => {
    const totalDebtorVs = details.reduce((sum: number, d: any) => sum + (d.debtorVs || 0), 0);
    const totalCreditorVs = details.reduce((sum: number, d: any) => sum + (d.creditorVs || 0), 0);
    if (totalDebtorVs !== totalCreditorVs) {
      throw new Error("Journal entry is not balanced for currencyVs. DebtorVs and CreditorVs must be equal.");
    }
    return true;
  }),
];
export const editJournalValidation = [
  body("id").isInt({ min: 1 }).withMessage('Invalid id').toInt(),
  body("date").notEmpty().withMessage("Date is required").isISO8601().withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("description").trim().optional().isString().withMessage("Description is required").isLength({ min: 3 }).withMessage("Description must be at least 3 characters"),
  body("details").isArray({ min: 2 }).withMessage("Details must be an array with at least 2 items"),
  body("details.*.accountId").notEmpty().withMessage("Account ID is required for each detail").isInt({ gt: 0 }).withMessage("Account ID must be a positive integer"),
  body("details.*.debtor").isFloat({ min: 0 }).withMessage("Debtor must be a positive number or zero"),
  body("details.*.creditor").isFloat({ min: 0 }).withMessage("Creditor must be a positive number or zero"),
  body("details.*.currency").notEmpty().withMessage("Currency is required for each detail").isString().withMessage("Currency must be a string"),
  body("details.*.debtorVs").isFloat({ min: 0 }).withMessage("DebtorVs must be a positive number or zero"),
  body("details.*.creditorVs").isFloat({ min: 0 }).withMessage("CreditorVs must be a positive number or zero"),
  body("details.*.currencyVs").optional().isString().withMessage("CurrencyVs must be a string if provided"),
  body("details").custom((details) => {
    const totalDebtor = details.reduce((sum: number, d: any) => sum + (d.debtor || 0), 0);
    const totalCreditor = details.reduce((sum: number, d: any) => sum + (d.creditor || 0), 0);
    if (totalDebtor !== totalCreditor) {
      throw new Error("Journal entry is not balanced. Debtor and Creditor must be equal.");
    }
    return true;
  }),

  body("details").custom((details) => {
    const totalDebtorVs = details.reduce((sum: number, d: any) => sum + (d.debtorVs || 0), 0);
    const totalCreditorVs = details.reduce((sum: number, d: any) => sum + (d.creditorVs || 0), 0);
    if (totalDebtorVs !== totalCreditorVs) {
      throw new Error("Journal entry is not balanced for currencyVs. DebtorVs and CreditorVs must be equal.");
    }
    return true;
  }),
];
export const deleteJournalValidation = [
    body("id").isInt({ min: 1 }).withMessage('Invalid id').toInt(),
];
export const updateStatusJournal=[
    body("id").isInt({ min: 1 }).withMessage('Invalid id').toInt(),

];
export const getJournalValidation=[
      param("id").isInt({ min: 1 }).withMessage('Invalid id').toInt(),

]
export const getJournalBranchValidation=[
      param("branchId").isInt({ min: 1 }).withMessage('Invalid id').toInt(),

]