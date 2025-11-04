import { DeepPartial } from 'typeorm';
import { Request, Response } from "express";
import { AppDataSource } from '../lib/postgres';
import { JournalEntry } from "../entities/JournalEntry";
import { JournalEntryDetail } from "../entities/JournalDetails";
import { User } from '../entities/userModel';
import { Account } from "../entities/accountTree";
import { Branch } from "../entities/branch";
import {createJournalType,createDetailsType,editJournalType} from '../types/journalEntryType';
const createJournal = async (req: Request, res: Response): Promise<void> => {
  const entryRepo = AppDataSource.getRepository(JournalEntry);
  const detailRepo = AppDataSource.getRepository(JournalEntryDetail);
  const accountRepo = AppDataSource.getRepository(Account);
  const userRepo=AppDataSource.getRepository(User);
  const branchRepo=AppDataSource.getRepository(Branch);
  try {
    const {date,description,userId, branchId, currency, status,type} = req.body as createJournalType;
    const {details}=req.body  as createDetailsType

    // Check User
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      res.status(203).json({ message: "User not found." });
      return;
    }
    const branch=await branchRepo.findOneBy({id:branchId})
    if(!branch){
      res.status(203).json({message:`branch not found`})
      return;
    }

    // Check that details have valid accounts
    const accountIds = details.map((d: any) => d.accountId);
    const accounts = await accountRepo.findByIds(accountIds);
    if (accounts.length !== accountIds.length) {
      res.status(203).json({ message: "One or more accountIds are invalid." });
      return;
    }

    // Check sum of debtor and creditor
    const totalDebtor = details.reduce((sum: number, d: any) => sum + (d.debtor || 0), 0);
    const totalCreditor = details.reduce((sum: number, d: any) => sum + (d.creditor || 0), 0);
    if (totalDebtor !== totalCreditor) {
      res.status(400).json({ message: "Journal entry is not balanced. Debtor and Creditor must be equal." });
      return;
    }

    // Create JournalEntry
    const journalEntry = entryRepo.create({
  date,
  description,
  userId,
  branchId,
  currency,
  status,
  type,
} as DeepPartial<JournalEntry>);
   await entryRepo.save(journalEntry);

    // Create JournalDetails
    const journalDetails = details.map((d: any) =>
      detailRepo.create({
        journalEntry,
        account: accounts.find(a => a.id === d.accountId),
        debtor: d.debtor,
        creditor: d.creditor,
        currency: d.currency || currency,
        debtorVs:d.debtorVs,
        creditorVs:d.creditorVs,
        currencyVs:d.currencyVs
      })
    );

    await detailRepo.save(journalDetails);

    res.status(201).json({
      message: "Journal entry created successfully.",
      journalEntryId: journalEntry.id
    });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err })
    return;
  }
};
const getJournal = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const branchId = Number(req.params.branchId);


    const journalRepo = AppDataSource.getRepository(JournalEntry);
    const journals = await journalRepo
      .createQueryBuilder("journal")
      .leftJoinAndSelect("journal.details", "details")
      .leftJoinAndMapOne(
        "details.accountData",
        Account,
        "account",
        "account.id = details.accountId"
      )
      .select([
        "journal.id",
        "journal.date",
        "journal.description",
        "journal.status",
        "journal.type",
        "journal.currency",
        "details.id",
        "details.debtor",
        "details.creditor",
        "details.currency",
        "details.debtorVs",
        "details.creditorVs",
        "details.currencyVs",
        "account.id",
        "account.name"
      ])
      .where("journal.branchId = :branchId", { branchId })
      .orderBy("journal.date", "DESC")
      .skip(skip)
      
      .getMany();
      if(journals.length===0){

        res.status(203).json({message:`No Content`})
        return;
      }
    res.status(200).json(journals);
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};
const getJournalById=async(req:Request,res:Response):Promise<void>=>{
  try{
     const {id}=req.params;
    const journalRepo = AppDataSource.getRepository(JournalEntry);
    const journals = await journalRepo
      .createQueryBuilder("journal")
      .leftJoinAndSelect("journal.details", "details")
      .leftJoinAndMapOne(
        "details.accountData",
        Account,
        "account",
        "account.id = details.accountId"
      )
      .select([
        "journal.id",
        "journal.date",
        "journal.description",
        "journal.currency",
        "journal.status",
        "journal.type",
        "details.id",
        "details.debtor",
        "details.creditor",
        "details.currency",
        "details.debtorVs",
        "details.creditorVs",
        "details.currencyVs",
        "account.id",
        "account.name"
      ])
      .where("journal.id = :id", { id })
      .orderBy("journal.date", "DESC")
      .getMany();
      if(journals.length===0){
        res.status(203).json({message:`No Content`})
        return;
      }
    res.status(200).json(journals);
  }
  catch(err){
    res.status(500).json({message:err})
    return;
  }
};
const updateJournal = async (req: Request, res: Response): Promise<void> => {
  const entryRepo = AppDataSource.getRepository(JournalEntry);
  const detailRepo = AppDataSource.getRepository(JournalEntryDetail);
  const accountRepo = AppDataSource.getRepository(Account);

  try {
    const {
      id,
      date,
      description,
      currency,
      details,
    } = req.body as editJournalType;

    if (!id || !date || !details || !Array.isArray(details) || details.length < 2) {
      res.status(400).json({ message: "Missing required fields or invalid details." });
      return;
    }

    // Check JournalEntry exists
    const journalEntry = await entryRepo.findOne({
      where: { id },
      relations: ["details"], // if needed
    });
    if (!journalEntry) {
      res.status(404).json({ message: "Journal entry not found." });
      return;
    }



    // Validate accounts
    const accountIds = details.map(d => d.accountId);
    const accounts = await accountRepo.findByIds(accountIds);
    if (accounts.length !== accountIds.length) {
      res.status(400).json({ message: "One or more accountIds are invalid." });
      return;
    }

    // Validate debtor/creditor sums
    const totalDebtor = details.reduce((sum, d) => sum + (d.debtor || 0), 0);
    const totalCreditor = details.reduce((sum, d) => sum + (d.creditor || 0), 0);
    if (totalDebtor !== totalCreditor) {
      res.status(400).json({ message: "Journal entry is not balanced. Debtor and Creditor must be equal." });
      return;
    }

    // Update JournalEntry fields
    journalEntry.date = date;
    journalEntry.description = description || '';
    journalEntry.currency = currency || '';
    await entryRepo.save(journalEntry);
    await detailRepo.delete({ journalEntry: { id: journalEntry.id } });

    const newDetails = details.map(d =>
      detailRepo.create({
        journalEntry,
        account: accounts.find(a => a.id === d.accountId),
        debtor: d.debtor,
        creditor: d.creditor,
        currency: d.currency || currency,
        debtorVs:d.debtorVs,
        creditorVs:d.creditorVs,
        currencyVs:d.currencyVs
      })
    );

    await detailRepo.save(newDetails);

    res.status(200).json({ message: "Journal entry updated successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};
const updateStatusJournal = async (req: Request, res: Response): Promise<void> => {
  try {
    const journalRepo = AppDataSource.getRepository(JournalEntry);
    const { id } = req.body;
    const findJournal = await journalRepo.findOne({ where: { id } });
    if (!findJournal) {
      res.status(404).json({ message: `Journal entry not found` });
      return;
    }
    if (findJournal.status === `pending`) {
      findJournal.status = `accept`;
      await journalRepo.save(findJournal);
      res.status(200).json({ message: `Update Status Success` });
      return;
    }
    res.status(400).json({ message: `Journal entry is not in pending status` });
  } catch (err) {
    res.status(500).json({ message: `Internal Server Error`, error: err });
  }
};
const deleteJournal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const JournalRepo=AppDataSource.getRepository(JournalEntry);
    const findJournal=await JournalRepo.findOne({where:{id:id}})
    if(!findJournal){
      res.status(203).json({message:`No Content`})
      return;
    }
    if(findJournal && findJournal.status===`accept`){
      res.status(400).json({message:`Can not delete Journal because is accept `})
      return;
    }
  await JournalRepo.delete({id:id})
  res.status(200).json({message:`Delete Success`})
  return;
  }
  catch (err) {
    res.status(500).json(err)
    return;
  }
};
export default { getJournal,getJournalById, createJournal,deleteJournal,updateJournal,updateStatusJournal }