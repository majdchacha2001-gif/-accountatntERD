import { Request, Response } from 'express';
import { Account } from "../entities/accountTree"
import { AccountRelation } from '../entities/accountDetails';
import { AppDataSource } from '../lib/postgres';
import { AccountFinalParent } from '../entities/accountFinalParent';
import { JournalEntryDetail } from '../entities/JournalDetails';
import { JournalEntry } from '@/entities/JournalEntry';
type AccountNode = {
  id: number;
  name: string;
  name_en?: string;
  accountType?: string;
  isConfig?: boolean;
  currency?: string;
  parentId?: number;
  final_account?: boolean;
  userId?: number;
  waring: number;
  Ratio: number;
  children: AccountNode[];
};
type BranchAccount = {
  branchId: number;
  parentFinalAccountId: number;

}
const getAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ message: 'Invalid account ID' });
      return;
    }

    const account = await AppDataSource.getRepository(Account)
      .createQueryBuilder('account')

      // جلب الحساب الأب (اسم + id)
      .leftJoin(AccountRelation, 'relation', 'relation.childId = account.id')
      .leftJoin(Account, 'parent', 'parent.id = relation.parentId')

      // جلب الحساب الختامي (اسم + id)
      .leftJoin(AccountFinalParent, 'finalRelation', 'finalRelation.childId = account.id')
      .leftJoin(Account, 'finalAcc', 'finalAcc.id = finalRelation.finalId')

      .select([
        'account.id AS accountId',
        'account.name AS accountName',
        'account.name_en AS accountNameEn',
        'account.currency AS accountCurrency',
        'account.waring AS waring',
        'account.Ratio AS ratio',
        'parent.id AS parentId',
        'parent.name AS parentName',
        'parent.accountType AS parentAccountType',
        'finalAcc.id AS finalAccountId',
        'finalAcc.name AS finalAccountName'
      ])
      .where('account.id = :id', { id: Number(id) })
      .getRawOne();

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    res.status(200).json({
      id: account.accountid,
      name: account.accountname,
      name_en: account.accountnameen,
      currency: account.accountcurrency,
      waring: account.waring,
      Ratio: account.ratio,
      parent: account.parentid ? {
        id: account.parentid, name: account.parentname, accountType: account.parentaccounttype

      } : null,
      finalAccount: account.finalaccountid ? { id: account.finalaccountid, name: account.finalaccountname } : null
    });

  } catch (err) {
    res.status(500).json({
      message: err
    });
  }
};
const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const AccountRepo = AppDataSource.getRepository(Account);
    const RelationRepo = AppDataSource.getRepository(AccountRelation);
    const FinalRepo = AppDataSource.getRepository(AccountFinalParent);

    const { name, name_en, currency, parentId, accountType, userId, waring, Ratio } = req.body as AccountNode;
    const { branchId, parentFinalAccountId } = req.body as BranchAccount;

    if (!name || !name_en || !currency || !parentId || !parentFinalAccountId || !accountType || !userId || waring === undefined || Ratio === undefined) {
      res.status(400).json({ message: `Invalid keys` });
      return;
    }

    const newAccount = AccountRepo.create({
      name,
      name_en,
      userId,
      branchId,
      currency,
      waring,
      Ratio,
      accountType,
    });

    const savedAccount = await AccountRepo.save(newAccount);

    const newRelation = RelationRepo.create({
      parentId: parentId,
      childId: savedAccount.id,
    });

    const newFinal = FinalRepo.create({
      finalId: parentFinalAccountId,
      childId: savedAccount.id,
    });

    await RelationRepo.save(newRelation);
    await FinalRepo.save(newFinal);

    res.status(201).json({ message: `Success`, data: savedAccount });
    return;

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};
const getAccountTree = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = Number(req.params.branchId);
    if (isNaN(branchId)) {
      res.status(400).json({ message: "Invalid branchId" });
      return;
    }

    const accountRepo = AppDataSource.getRepository(Account);
    const relationRepo = AppDataSource.getRepository(AccountRelation);

    const accounts = await accountRepo.find({ where: { branchId: branchId } });
    const relations = await relationRepo.find({ relations: ["parent", "child"] });

    const nodeMap = new Map<number, AccountNode>();
    accounts.forEach(acc => {
      nodeMap.set(acc.id, {
        id: acc.id,
        name: acc.name,
        name_en: acc.name_en,
        accountType: acc.accountType,
        isConfig: acc.isConfig,
        waring: acc.waring,
        Ratio: acc.Ratio,
        currency: acc.currency,
        children: [],
      });
    });

    relations.forEach(({ parent, child }) => {
      const parentNode = nodeMap.get(parent.id);
      const childNode = nodeMap.get(child.id);
      if (parentNode && childNode) {
        parentNode.children.push(childNode);
      }
    });

    const childIds = new Set(relations.map(r => r.child.id));
    const roots = accounts.filter(acc => !childIds.has(acc.id)).map(acc => nodeMap.get(acc.id)!);

    if (!roots || roots.length === 0) {
      res.status(203).json({ message: `No Content` });
      return;
    }

    // ✅ العناصر المطلوبة للنهاية بالترتيب
    const lastItemsNames = ["التشغيل", "المتاجرة", "الميزانية", "الأرباح والخسائر"];

    const lastItems = lastItemsNames
      .map(name => roots.find(r => r.name === name))
      .filter(Boolean);

    const remainingRoots = roots.filter(r => !lastItemsNames.includes(r.name));

    const finalTree = [...remainingRoots, ...lastItems];

    res.json({ tree: finalTree });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getFinalAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = Number(req.params.branchId);
    if (isNaN(branchId)) {
      res.status(400).json({ message: "Invalid branchId" });
      return;
    }
    const accountRepo = AppDataSource.getRepository(Account);
    const accounts = await accountRepo.find({
      where: { final_account: true, branchId: branchId },
      select: ['id', 'name', 'accountType']
    })
    if (!accounts || accounts.length === 0) {
      res.status(203).json({ message: `No Content` })
      return;
    }
    res.status(200).json(accounts);
    return;
  }
  catch (err) {
    res.status(500).json(err)
    return;
  }
};
const getParentAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = Number(req.params.branchId);
    if (isNaN(branchId)) {
      res.status(400).json({ message: "Invalid branchId" });
      return;
    }
    const accountRepo = AppDataSource.getRepository(Account);
    const accounts = await accountRepo.find({ where: { isParent: true, final_account: false, branchId: branchId }, select: ['id', 'name', 'accountType'] });
    if (!accounts || accounts.length === 0) {
      res.status(203).json({ message: `No Content` })
      return;
    }
    res.status(200).json(accounts);
    return;
  }
  catch (err) {
    res.status(500).json(err);
    return;
  }
};
const getChildAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const branchId = Number(req.params.branchId);
    if (isNaN(branchId)) {
      res.status(400).json({ message: "Invalid branchId" });
      return;
    }
    const accountRepo = AppDataSource.getRepository(Account);
    const accounts = await accountRepo.find({ where: { isParent: false, branchId: branchId }, select: ['id', 'name', 'accountType', 'currency'] });
    if (!accounts || accounts.length === 0) {
      res.status(203).json({ message: `No Content` })
      return;
    }
    res.status(200).json(accounts);
    return;
  }
  catch (err) {
    res.status(500).json(err);
    return;
  }
};
const getAccountStatement = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountIdRaw = req.params.accountId;

    if (typeof accountIdRaw !== "string") {
      res.status(400).json({ message: "accountId is required in params and must be a stringified number" });
      return;
    }

    const accountId = Number(accountIdRaw);

    if (isNaN(accountId)) {
      res.status(400).json({ message: "accountId must be a valid number" });
      return;
    }

    const accountRepo = AppDataSource.getRepository(Account);
    const journalDetailRepo = AppDataSource.getRepository(JournalEntryDetail
    );

    const account = await accountRepo.findOneBy({ id: accountId });
    if (!account) {
      res.status(203).json({ message: "Account not found" });
      return;
    }

    const details = await journalDetailRepo.find({
      where: { accountId: accountId },
      relations: [
        "journalEntry",
        "journalEntry.details",
        "journalEntry.details.account"  // تحميل بيانات الحساب المقابل
      ]
    });

    const statement = details.map(detail => {
      const oppositeDetail = detail.journalEntry.details.find(d => d.accountId !== detail.accountId);
      const oppositeAccountName = oppositeDetail?.account?.name ?? "طرف مقابل غير معروف";

      return {
        journalEntryId: detail.journalEntry.id,
        date: detail.journalEntry.date,
        description: detail.journalEntry.description,
        debit: detail.debtor,
        credit: detail.creditor,
        currency: detail.currency,
        debitVs: detail.creditorVs,
        creditVs: detail.creditorVs,
        currencyVs: detail.currencyVs,
        oppositeAccount: oppositeAccountName
      };
    });
    if (statement.length === 0) {
      res.status(203).json({ message: `الحساب متوازن`, account: account.name })
      return
    }
    res.json({
      account: account.name,
      statement
    });
    return

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err });
    return
  }
};
const editAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const AccountRepo = AppDataSource.getRepository(Account);
    const RelationRepo = AppDataSource.getRepository(AccountRelation);
    const FinalRepo = AppDataSource.getRepository(AccountFinalParent);
    const { id, name, name_en, accountType, Ratio, waring, parentId, currency } = req.body as AccountNode;
    const { parentFinalAccountId } = req.body as BranchAccount;
    if (!id || !name || !name_en || !accountType  || !parentId || !parentFinalAccountId || !currency) {
      res.status(400).json({ message: `Invalid keys` })
      console.log("Received payload:", req.body);
      return;
    }
    if (!id || !name || !accountType || !parentId || parentFinalAccountId === undefined) {
      res.status(400).json({ message: `Missing required fields` });
      return;
    }
    const findAccount = await AccountRepo.findOne({ where: { id: id } });
    if (!findAccount) {
      res.status(203).json({ message: `No Content` })
      return;
    }
    findAccount.name = name;
    findAccount.name_en = name_en;
    findAccount.accountType = accountType;
    findAccount.Ratio = Ratio;
    findAccount.waring = waring;
    findAccount.currency = currency;
    await AccountRepo.save(findAccount);
    const relation = await RelationRepo.findOne({ where: { childId: id } })
    if (relation) {
      relation.parentId = parentId;
      await RelationRepo.save(relation);
    }
    const finalRelation = await FinalRepo.findOne({ where: { childId: id } });
    if (finalRelation) {
      finalRelation.finalId = parentFinalAccountId
      await FinalRepo.save(finalRelation)
    }
    res.status(200).json({ message: `Success`, data: findAccount })
    return;
  }
  catch (err) {
    res.status(500).json({ message: err })
    return;
  }

};
const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body as AccountNode
    const accountRepo = AppDataSource.getRepository(Account);
    const accountDetailsRepo = AppDataSource.getRepository(JournalEntryDetail)
    if (!id) {
      res.status(400).json({ message: `invalid keys` })
      return;
    }
    const findAccount = await accountRepo.findOne({ where: { id: id } })
    if (!findAccount) {
      res.status(203).json({ message: `no Content` })
      return;
    }
    if (findAccount.isConfig === true) {
      res.status(400).json({ message: `can not delete account because is Config` })
      return;
    }
    const findJournalAccount = await accountDetailsRepo.findOne({ where: { accountId: id } })
    if (findJournalAccount) {
      res.status(400).json({ message: `can not delete because account find in journal` })
      return;
    }
    await accountRepo.delete({ id: id })
    res.status(200).json({ message: `Delete Account` })
    return;
  }
  catch (err) {
    res.status(500).json({ err })
  }
};
const getAccountList = async (req: Request, res: Response): Promise<void> => {
  try {

    const { branchId } = req.params;
    if (!branchId) {
      res.status(400).json({ message: `invalid keys` })
      return;
    }
    const result = await AppDataSource
      .getRepository(Account)
      .createQueryBuilder("account")
      .leftJoin(AccountFinalParent, "afp", "afp.childId = account.id")
      .leftJoin(Account, "finalAcc", "finalAcc.id = afp.finalId")
      .leftJoin(JournalEntryDetail, "jd", "jd.accountId = account.id")
      .select([
        "account.id AS accountId",
        "account.name AS accountName",
        "account.waring AS accountWaring",
        "account.Ratio AS accountRation",
        "finalAcc.name AS finalAccountName",
        "COALESCE(SUM(jd.debtor - jd.creditor), 0) AS totalBalance"
      ])
      .where("account.branchId = :branchId", { branchId },
      )
      .andWhere("account.final_account=false")
      .groupBy("account.id")
      .addGroupBy("finalAcc.name")
      .orderBy("account.id", "ASC")
      .getRawMany();

    res.status(200).json(result);
    return;

  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
    return
  }
};
const getAccountTotals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;
    if (!branchId) {
      res.status(400).json({ message: "Invalid keys" });
      return;
    }

    const accountRepo = AppDataSource.getRepository(Account);

    const accountTypes = ["asset", "NetSales", "NetPurchases", "expense"];
    const totals: Record<string, number> = {};

    for (const type of accountTypes) {
      const result = await accountRepo
        .createQueryBuilder("acc")
        .leftJoin(JournalEntryDetail, "jd", "jd.accountId = acc.id")
        .leftJoin(JournalEntry, "je", "je.id = jd.journalEntryId")
        .select("COALESCE(SUM(jd.debtor - jd.creditor), 0)", "total")
        .where("acc.accountType = :type", { type })
        .andWhere("je.branchId = :branchId", { branchId })
        .getRawOne();

      totals[type] = Number(result.total) || 0;
    }

    res.status(200).json({
      assets: totals.asset,
      netSales: totals.NetSales,
      netPurchases: totals.NetPurchases,
      expenses: totals.expense
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export default { getAccountById, getAccountTree, getAccountTotals, deleteAccount, getFinalAccount, getParentAccount, getChildAccount, getAccountList, createAccount, editAccount, getAccountStatement };