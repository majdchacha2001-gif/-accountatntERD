import { Request, Response } from "express";
import { AppDataSource } from "../lib/postgres";
import { Invoice } from "../entities/invoice";
import { InvoiceDetails } from "../entities/invoiceDetails";
import { Product } from "../entities/product";
import { JournalEntry } from "../entities/JournalEntry";
import { JournalEntryDetail } from "../entities/JournalDetails";
import { Account } from "@/entities/accountTree";
type invoice = {
  id: number;
  type: string;
  userId: number;
  branchId: number;
  journalEntryId: number;
  currency: string;
  TotalInvoice: number;
  typeInvoice: string;
  date: string;
  detailsProduct: Array<
    {
      amount: number;
      total: number;
      price: number;
      productId: number;
      invoiceId: number;
      pricePurchases: number;
      priceSales: number;
    }
  >
  details: Array<{
    accountId: number;
    debtor: number;
    creditor: number;
    currency?: string;
  }>;
  description?: string;
  typeJournal?: "accountant" | "primary";
  status?: 'accept' | "pending";


}
const createInvoice = async (req: Request, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const invoiceRepo = queryRunner.manager.getRepository(Invoice);
    const detailsRepo = queryRunner.manager.getRepository(InvoiceDetails);
    const productRepo = queryRunner.manager.getRepository(Product);
    const JournalRepo = queryRunner.manager.getRepository(JournalEntry);
    const journalDetail = queryRunner.manager.getRepository(JournalEntryDetail);
    const accountRepo = queryRunner.manager.getRepository(Account);

    const {
      branchId,
      userId,
      date,
      currency,
      TotalInvoice,
      typeInvoice,
      detailsProduct,
      details,
      description,
      typeJournal,
      status
    } = req.body as invoice;

    if (
      !branchId || !userId || !date || !currency || !TotalInvoice || !typeInvoice ||
      !Array.isArray(detailsProduct) || detailsProduct.length === 0 ||
      !Array.isArray(details) || details.length === 0  || !status || !typeJournal
    ) {
      res.status(400).json({ message: "Invalid or missing fields in request body" });
      return;
    }

    for (const item of detailsProduct) {
      if (!item.productId || item.amount === undefined || item.price === undefined || item.total === undefined) {
        res.status(400).json({ message: "Invalid invoice details: Missing fields" });
        return;
      }
    }

    const accountIds = details.map((d: any) => d.accountId);
    const accounts = await accountRepo.findByIds(accountIds);
    if (accounts.length !== accountIds.length) {
      res.status(400).json({ message: "One or more accountIds are invalid." });
      return;
    }

    const totalDebtor = details.reduce((sum: number, d: any) => sum + (d.debtor || 0), 0);
    const totalCreditor = details.reduce((sum: number, d: any) => sum + (d.creditor || 0), 0);
    if (totalDebtor !== totalCreditor) {
      res.status(400).json({ message: "Journal entry is not balanced. Debtor and Creditor must be equal." });
      return;
    }

    for (const item of detailsProduct) {
      const product = await productRepo.findOneBy({ id: item.productId });
      if (!product) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ message: `Product with ID ${item.productId} not found` });
        return;
      }

      if (["purchases", "return_sales"].includes(typeInvoice)) {
        if (product.amount < item.amount) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ message: `Insufficient quantity for product ID ${item.productId}` });
          return;
        }
      }
    }

    const journalEntry = JournalRepo.create({
      date,
      description,
      userId,
      branchId,
      currency,
      status: status || "pending",
      type: typeJournal || "primary",
    });
    await JournalRepo.save(journalEntry);

    const journalDetails = details.map((d: any) =>
      journalDetail.create({
        journalEntry,
        account: accounts.find(a => a.id === d.accountId),
        debtor: d.debtor,
        creditor: d.creditor,
        currency: d.currency || currency,
        debtorVs: d.debtorVs ?? 0,
        creditorVs: d.creditorVs ?? 0,
        currencyVs: d.currencyVs || ""
      })
    );
    await journalDetail.save(journalDetails);

    const newInvoice = invoiceRepo.create({
      branchId,
      userId,
      date,
      currency,
      TotalInvoice,
      typeInvoice,
      journalEntryId: journalEntry.id
    });
    await invoiceRepo.save(newInvoice);

    const detailsEntities = detailsProduct.map((item: any) =>
      detailsRepo.create({
        productId: item.productId,
        amount: item.amount,
        price: item.price,
        total: item.total,
        invoiceId: newInvoice.id
      })
    );
    await detailsRepo.save(detailsEntities);

    for (const item of detailsProduct) {
      const product = await productRepo.findOneBy({ id: item.productId });

      if (product) {
        if (["sales", "return_purchases"].includes(typeInvoice)) {
          product.amount = parseFloat(product.amount as any) - Number(item.amount);
        } else if (["purchases", "return_sales"].includes(typeInvoice)) {
          product.amount = parseFloat(product.amount as any) + Number(item.amount);
        }
        await productRepo.save(product);
      }
    }

    await queryRunner.commitTransaction();

    const savedInvoice = await invoiceRepo.findOne({
      where: { id: newInvoice.id },
      relations: ["details"]
    });

    res.status(201).json({
      message: "Invoice created successfully and stock updated",
      data: savedInvoice
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  } finally {
    await queryRunner.release();
  }
};
const getInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = parseInt(req.params.branchId);

    // ✅ تحقق من branchId و typeInvoice
    if (isNaN(branchId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid branch ID or typeInvoice is missing'
      });
      return;
    }

    const invoiceRepo = AppDataSource.getRepository(Invoice);

    const invoices = await invoiceRepo.find({
      where: {
        branch: { id: branchId },
      },
      relations: ["details", "details.product"],
      order: { date: "DESC" }
    });

    // ✅ إذا لم يوجد بيانات
    if (!invoices || invoices.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No invoices found for this branch and typeInvoice'
      });
      return;
    }

    // ✅ تبسيط البيانات
    const simplifiedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      date: invoice.date,
      TotalInvoice: invoice.TotalInvoice,
      typeInvoice: invoice.typeInvoice,
      currency: invoice.currency,
      details: invoice.details.map(detail => ({
        productName: detail.product?.name,
        amount: detail.amount,
        price: detail.price,
        total: detail.total,
        unit: detail.product?.unit
      }))
    }));

    res.status(200).json({
      success: true,
      data: simplifiedInvoices,
    });

  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};


const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
      return;
    }

    const invoiceRepo = AppDataSource.getRepository(Invoice);

    const invoices = await invoiceRepo.find({
      where: {
          id: id,
      },
      relations: [
        "details", 
        "details.product", 
        "journalEntry",
        "journalEntry.details",
        "journalEntry.details.account" // تم تغيير هذا من accountData إلى account
      ],
      order: { date: "DESC" }
    });

    if (!invoices || invoices.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No invoices found with this ID'
      });
      return;
    }

    const simplifiedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      date: invoice.date,
      TotalInvoice: invoice.TotalInvoice,
      typeInvoice: invoice.typeInvoice,
      currency: invoice.currency,
      journalEntry: invoice.journalEntry ? {
        id: invoice.journalEntry.id,
        type: invoice.journalEntry.type || "primary",
        status: invoice.journalEntry.status || "accept",
        date: invoice.journalEntry.date,
        description: invoice.journalEntry.description,
        details: invoice.journalEntry.details?.map(detail => ({
          id: detail.id,
          debtor: detail.debtor,
          creditor: detail.creditor,
          currency: detail.currency,
          debtorVs: detail.debtorVs,
          creditorVs: detail.creditorVs,
          currencyVs: detail.currencyVs,
          accountId: detail.accountId,
          account: detail.account ? { // تم تغيير هذا من accountData إلى account
            id: detail.account.id,
            name: detail.account.name
          } : null
        })) || []
      } : null,
      detailsProduct: invoice.details.map(detail => ({
        productName: detail.product?.name,
        amount: detail.amount,
        price: detail.price,
        total: detail.total,
        unit: detail.product?.unit
      }))
    }));

    res.status(200).json({
      success: true,
      data: simplifiedInvoices,
    });

  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
const getInvoiceSeals = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = parseInt(req.params.branchId);

    // ✅ تحقق من branchId و typeInvoice
    if (isNaN(branchId) ) {
      res.status(400).json({
        success: false,
        message: 'Invalid branch ID or typeInvoice is missing'
      });
      return;
    }

    const invoiceRepo = AppDataSource.getRepository(Invoice);

    const invoices = await invoiceRepo.find({
      where: {
        branch: { id: branchId },
        typeInvoice: `sales`
      },
      relations: ["details", "details.product"],
      order: { date: "DESC" }
    });

    // ✅ إذا لم يوجد بيانات
    if (!invoices || invoices.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No invoices found for this branch and typeInvoice'
      });
      return;
    }

    // ✅ تبسيط البيانات
    const simplifiedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      date: invoice.date,
      TotalInvoice: invoice.TotalInvoice,
      typeInvoice: invoice.typeInvoice,
      currency: invoice.currency,
      details: invoice.details.map(detail => ({
        productName: detail.product?.name,
        amount: detail.amount,
        price: detail.price,
        total: detail.total,
        unit: detail.product?.unit
      }))
    }));

    res.status(200).json({
      success: true,
      data: simplifiedInvoices,
    });

  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
const getInvoiceReturnSeals = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = parseInt(req.params.branchId);

    // ✅ تحقق من branchId و typeInvoice
    if (isNaN(branchId) ) {
      res.status(400).json({
        success: false,
        message: 'Invalid branch ID or typeInvoice is missing'
      });
      return;
    }

    const invoiceRepo = AppDataSource.getRepository(Invoice);

    const invoices = await invoiceRepo.find({
      where: {
        branch: { id: branchId },
        typeInvoice: `return_sales`
      },
      relations: ["details", "details.product"],
      order: { date: "DESC" }
    });

    // ✅ إذا لم يوجد بيانات
    if (!invoices || invoices.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No invoices found for this branch and typeInvoice'
      });
      return;
    }

    // ✅ تبسيط البيانات
    const simplifiedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      date: invoice.date,
      TotalInvoice: invoice.TotalInvoice,
      typeInvoice: invoice.typeInvoice,
      currency: invoice.currency,
      details: invoice.details.map(detail => ({
        productName: detail.product?.name,
        amount: detail.amount,
        price: detail.price,
        total: detail.total,
        unit: detail.product?.unit
      }))
    }));

    res.status(200).json({
      success: true,
      data: simplifiedInvoices,
    });

  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
const getInvoicePurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = parseInt(req.params.branchId);

    // ✅ تحقق من branchId و typeInvoice
    if (isNaN(branchId) ) {
      res.status(400).json({
        success: false,
        message: 'Invalid branch ID or typeInvoice is missing'
      });
      return;
    }

    const invoiceRepo = AppDataSource.getRepository(Invoice);

    const invoices = await invoiceRepo.find({
      where: {
        branch: { id: branchId },
        typeInvoice: `purchases`
      },
      relations: ["details", "details.product"],
      order: { date: "DESC" }
    });

    // ✅ إذا لم يوجد بيانات
    if (!invoices || invoices.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No invoices found for this branch and typeInvoice'
      });
      return;
    }

    // ✅ تبسيط البيانات
    const simplifiedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      date: invoice.date,
      TotalInvoice: invoice.TotalInvoice,
      typeInvoice: invoice.typeInvoice,
      currency: invoice.currency,
      details: invoice.details.map(detail => ({
        productName: detail.product?.name,
        amount: detail.amount,
        price: detail.price,
        total: detail.total,
        unit: detail.product?.unit
      }))
    }));

    res.status(200).json({
      success: true,
      data: simplifiedInvoices,
    });

  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
const getInvoiceReturnPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = parseInt(req.params.branchId);

    // ✅ تحقق من branchId و typeInvoice
    if (isNaN(branchId) ) {
      res.status(400).json({
        success: false,
        message: 'Invalid branch ID or typeInvoice is missing'
      });
      return;
    }

    const invoiceRepo = AppDataSource.getRepository(Invoice);

    const invoices = await invoiceRepo.find({
      where: {
        branch: { id: branchId },
        typeInvoice: `return_purchases`
      },
      relations: ["details", "details.product"],
      order: { date: "DESC" }
    });

    // ✅ إذا لم يوجد بيانات
    if (!invoices || invoices.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No invoices found for this branch and typeInvoice'
      });
      return;
    }

    // ✅ تبسيط البيانات
    const simplifiedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      date: invoice.date,
      TotalInvoice: invoice.TotalInvoice,
      typeInvoice: invoice.typeInvoice,
      currency: invoice.currency,
      details: invoice.details.map(detail => ({
        productName: detail.product?.name,
        amount: detail.amount,
        price: detail.price,
        total: detail.total,
        unit: detail.product?.unit
      }))
    }));

    res.status(200).json({
      success: true,
      data: simplifiedInvoices,
    });

  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  const {
    id,
    date,
    currency,
    TotalInvoice,
    typeInvoice,
    detailsProduct,
    details,
    description,
    typeJournal,
    status
  } = req.body as invoice;

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const invoiceRepo = queryRunner.manager.getRepository(Invoice);
    const detailsRepo = queryRunner.manager.getRepository(InvoiceDetails);
    const productRepo = queryRunner.manager.getRepository(Product);
    const journalRepo = queryRunner.manager.getRepository(JournalEntry);
    const journalDetailRepo = queryRunner.manager.getRepository(JournalEntryDetail);
    const accountRepo = queryRunner.manager.getRepository(Account);

    const existingInvoice = await invoiceRepo.findOne({
      where: { id: Number(id) },
      relations: ["details"]
    });


    if (!existingInvoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }

    for (const oldDetail of existingInvoice.details) {
      const product = await productRepo.findOneBy({ id: oldDetail.productId });
      if (product) {
        if (["sales", "return_purchases"].includes(existingInvoice.typeInvoice)) {
          product.amount -= oldDetail.amount;
        } else if (["purchases", "return_sales"].includes(existingInvoice.typeInvoice)) {
          product.amount += oldDetail.amount;
        }
        await productRepo.save(product);
      }
    }

    const accountIds = details.map((d: any) => d.accountId);
    const accounts = await accountRepo.findByIds(accountIds);
    if (accounts.length !== accountIds.length) {
      res.status(400).json({ message: "One or more accountIds are invalid." });
      return;
    }

    const totalDebtor = details.reduce((sum: number, d: any) => sum + (d.debtor || 0), 0);
    const totalCreditor = details.reduce((sum: number, d: any) => sum + (d.creditor || 0), 0);
    if (totalDebtor !== totalCreditor) {
      res.status(400).json({ message: "Journal entry is not balanced. Debtor and Creditor must be equal." });
      return;
    }

    for (const item of detailsProduct) {
      const product = await productRepo.findOneBy({ id: item.productId });
      if (!product) {
        res.status(400).json({ message: `Product with ID ${item.productId} not found` });
        return;
      }
      if (["purchases", "return_sales"].includes(typeInvoice) && product.amount < item.amount) {
        res.status(400).json({ message: `Insufficient quantity for product ID ${item.productId}` });
        return;
      }
    }

    existingInvoice.date = date;
    existingInvoice.currency = currency;
    existingInvoice.TotalInvoice = TotalInvoice;
    existingInvoice.typeInvoice = typeInvoice;

    await invoiceRepo.save(existingInvoice);

    await detailsRepo.delete({ invoiceId: existingInvoice.id });

    const newDetails = detailsProduct.map((item: any) =>
      detailsRepo.create({
        productId: item.productId,
        amount: item.amount,
        price: item.price,
        total: item.total,
        invoiceId: existingInvoice.id
      })
    );
    await detailsRepo.save(newDetails);

    for (const item of detailsProduct) {
      const product = await productRepo.findOneBy({ id: item.productId });
      if (product) {
        if (["sales", "return_purchases"].includes(typeInvoice)) {
          product.amount += item.amount;
        } else if (["purchases", "return_sales"].includes(typeInvoice)) {
          product.amount -= item.amount;
        }
        await productRepo.save(product);
      }
    }

    const journalEntry = await journalRepo.findOneBy({ id: existingInvoice.journalEntryId });
    if (journalEntry) {
      journalEntry.date = date;
      journalEntry.description = description ?? "";
      journalEntry.status = status ?? "accept";
      journalEntry.type = typeJournal ?? "accountant";
      await journalRepo.save(journalEntry);
      await journalDetailRepo.delete({ journalEntry: { id: journalEntry.id } });
      const journalDetails = details.map((d: any) =>
        journalDetailRepo.create({
          journalEntry,
          account: accounts.find(a => a.id === d.accountId),
          debtor: d.debtor,
          creditor: d.creditor,
          currency: d.currency || currency,
          debtorVs: d.debtorVs,
          creditorVs: d.creditorVs,
          currencyVs: d.currencyVs
        })
      );
      await journalDetailRepo.save(journalDetails);
    }

    await queryRunner.commitTransaction();

    res.status(200).json({ message: "Invoice updated successfully" });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  } finally {
    await queryRunner.release();
  }
};
const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const invoiceRepo = queryRunner.manager.getRepository(Invoice);
    const invoiceDetailsRepo = queryRunner.manager.getRepository(InvoiceDetails);
    const productRepo = queryRunner.manager.getRepository(Product);
    const journalDetailRepo = queryRunner.manager.getRepository(JournalEntryDetail);
    const journalRepo=queryRunner.manager.getRepository(JournalEntry);
    const existingInvoice = await invoiceRepo.findOne({
      where: { id: Number(id) },
      relations: ["details"]
    });

    if (!existingInvoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }

    // 1. Delete journal entry details
    if (existingInvoice.journalEntryId) {
      await journalDetailRepo.delete({ journalEntry: { id: existingInvoice.journalEntryId } });
    }

    // 2. Delete invoice details
    await invoiceDetailsRepo.delete({ invoiceId: existingInvoice.id });

    // 3. Update product quantities
    for (const detail of existingInvoice.details) {
      const product = await productRepo.findOneBy({ id: detail.productId });
      if (product) {
        if (["sales", "return_purchases"].includes(existingInvoice.typeInvoice)) {
          product.amount +=Number(detail.amount)
        } else if (["purchases", "return_sales"].includes(existingInvoice.typeInvoice)) {
          product.amount -=Number(detail.amount);
        }
        await productRepo.save(product);
      }
    }

    // 4. Delete the invoice (CASCADE will handle journal entry)
    await invoiceRepo.delete(existingInvoice.id);
    // 5 Delete the journalEntry 
    await journalRepo.delete(existingInvoice.journalEntryId)
    await queryRunner.commitTransaction();
    res.status(200).json({ message: "Invoice deleted successfully" });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error deleting invoice:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: (error as Error).message 
    });
  } finally {
    await queryRunner.release();
  }
};


const getReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchId, type, startDate, endDate } = req.params;

    const report = await AppDataSource
      .getRepository(InvoiceDetails)
      .createQueryBuilder("details")
      .innerJoin("details.invoice", "invoice")
      .innerJoin("details.product", "product")
      .select("product.name", "productName")
      .addSelect("SUM(details.amount)", "totalAmount")
      .where("invoice.branchId = :branchId", { branchId })
      .andWhere("invoice.typeInvoice = :type", { type })
      .andWhere("invoice.date BETWEEN :startDate AND :endDate", { startDate, endDate })
      .groupBy("product.name")
      .getRawMany();
    //       .addSelect("SUM(details.total)", "totalPrice") // ✅ لو بدك المجموع المالي كمان
    if (!report || report.length === 0) {
      res.status(203).json({ message: `No Content` })
      return;
    }
    res.status(200).json({
      message: "Report generated successfully",
      data: report
    });
    return
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
export default { getInvoiceSeals,getInvoiceReturnPurchases,getInvoicePurchases,getInvoiceReturnSeals,createInvoice, getInvoice, updateInvoice, deleteInvoice, getReport ,getInvoiceById};