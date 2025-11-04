import { Request, Response } from "express";
import { AppDataSource } from '../lib/postgres';
import { CompanyName } from "../entities/companyName";
import {createCompanyType,editCompanyType,deleteCompanyType} from '../types/companyType'
import { Product } from "../entities/product";
const createCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, userId } = req.body as createCompanyType;
        if(!name || !userId) res.status(400).json({message:`invalid keys`})
        const companyRepo = AppDataSource.getRepository(CompanyName);
        const createName = companyRepo.create({
            name: name,
            userId: userId,
        });
        await companyRepo.save(createName);
        res.status(200).json({ data: createName })
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
}
const getCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const companyRepo = AppDataSource.getRepository(CompanyName);
        const Name= await companyRepo.find();
        res.status(200).json({message:`success`,data:Name})
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
}
const updateCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const companyRepo = AppDataSource.getRepository(CompanyName);
        const { id, name } = req.body as editCompanyType;
        if(!id || !name) res.status(400).json({message:`invalid keys`})
        const findCompany=await companyRepo.findOneBy({id})
        if(!findCompany) {
            res.status(404).json({message:`Not Found`})
         return;
        }
        findCompany.name=name;
        await companyRepo.save(findCompany);
        res.status(200).json({message:`Update Success`,data:findCompany});
    }
    catch (err) {
        res.status(500).json({ message: err })
    }
}
// const deleteCompany = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { id } = req.body as deleteCompanyType;
//         const ProductRepo=AppDataSource.getRepository(Product)
//         const CompanyRepo=AppDataSource.getRepository(CompanyName);
//         const findCompany=await ProductRepo.findBy({companyId:id})
//         if(findCompany){
//              res.status(401).json({message:`Can not delete because is Company name in use Product`})
//         return;
//         }
      
//          CompanyRepo.delete({id:id})
//             res.status(200).json({message:`Delete Success`})
//             return;
//     }
//     catch (err) {
//         res.status(500).json({ message: err })
//     }
// }

const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params 
    const newId=Number(id);
    const ProductRepo = AppDataSource.getRepository(Product)
    const CompanyRepo = AppDataSource.getRepository(CompanyName)

    const findCompany = await ProductRepo.findBy({ companyId: newId })
    const existCompany=await  CompanyRepo.findBy({id:newId})
    if(!existCompany ){
        res.status(203).json({message:`No Content`})
        return;
    }
    if (findCompany.length > 0) {
      res.status(401).json({ message: `لا يمكن الحذف لأن اسم الشركة قيد الاستخدام في المنتجات` })
      return
    }

    await CompanyRepo.delete({ id: newId })

    res.status(200).json({ message: "delete Success" })
    return
  } catch (err) {
    res.status(500).json({ message:err}) 
    return;  
  }
}
export default {  getCompany, createCompany,updateCompany, deleteCompany };