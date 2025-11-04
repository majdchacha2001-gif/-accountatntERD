import { Request, Response } from "express";
import { AppDataSource } from '../lib/postgres';
import { Product } from '../entities/product'
import { CompanyName } from "../entities/companyName";
import { InvoiceDetails } from "../entities/invoiceDetails";
import { createProductType,editProductType,deleteProductType } from "../types/productTypes";

const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const productRepo = AppDataSource.getRepository(Product);
        const { name, userId, companyId, branchId, description, amount, pricePurchases, priceSales, unit } = req.body as createProductType;

        const existingProduct = await productRepo.findOne({ where: { name, companyId } });
        if (existingProduct) {
            res.status(400).json({ message: `Product already exists`, product: existingProduct });
            return;
        }

        const newProduct = productRepo.create({
            name,
            userId,
            companyId,
            branchId,
            description,
            amount:Number(amount),
            pricePurchases:Number(amount),
            priceSales:Number(amount),
            unit
        });

        await productRepo.save(newProduct);

        res.status(201).json({ message: `Product created successfully`, data: newProduct });
    } catch (err) {
        res.status(500).json({ message: `Internal server error`, error: err });
    }
};
const getProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const branchId = req.params.branchId 
        const newId=Number(branchId)
        const productRepo = AppDataSource.getRepository(Product);
        const product = await productRepo.find({
            where: { branchId:newId },
            relations: ['company']
        });
        if (product.length === 0) {
            res.status(203).json({ message: `No content` });
            return;
        }

        const result = product.map(p => ({
            id: p.id,
            name: p.name,
            companyName: p.company ? p.company.name : null,
            amount: p.amount,
            pricePurchases: p.pricePurchases,
            priceSales: p.priceSales,
            description:p.description,
            unit:p.unit
        }));

        res.status(200).json({ message: `Products fetched successfully`, data: result });
    } catch (err) {
        res.status(500).json({ message: `Internal server error`, error: err });
    }
};
const editProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, name, description, companyId, amount, pricePurchases, priceSales, unit } = req.body as editProductType;

        const productRepo = AppDataSource.getRepository(Product);
        const companyRepo = AppDataSource.getRepository(CompanyName);

        const findProduct = await productRepo.findOneBy({ id });
        if (!findProduct) {
            res.status(203).json({ message: `No Content product` });
            return;
        }

        if (companyId) {
            const findCompany = await companyRepo.findOneBy({ id: companyId });
            if (!findCompany) {
                res.status(203).json({ message: `No Content company` });
                return;
            }
            findProduct.companyId = companyId;
        }

        findProduct.name = name ?? findProduct.name;
        findProduct.description = description ?? findProduct.description;
        findProduct.amount = amount ?? findProduct.amount;
        findProduct.pricePurchases = pricePurchases ?? findProduct.pricePurchases;
        findProduct.priceSales = priceSales ?? findProduct.priceSales;
        findProduct.unit = unit ?? findProduct.unit;
        await productRepo.save(findProduct);
        res.status(200).json({ message: `Product updated successfully`, data: findProduct });
        return
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err });
        return;
    }
};
const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id}=req.params
        const newId=Number(id);
        const InvoiceDetailsRepo=AppDataSource.getRepository(InvoiceDetails);
        const productRepo=AppDataSource.getRepository(Product);
        const findAndDelete=await InvoiceDetailsRepo.findBy({productId:newId})
        const existProduct=await productRepo.findBy({id:newId})
        if(existProduct.length===0){
            res.status(203).json({message:`No Content`})
            return;
        }
        if(findAndDelete.length>0){
            res.status(401).json({message:`Can not delete product because is find in invoice`})
            return;
        }
        await productRepo.delete({id:newId})
        res.status(200).json({ message: `delete product` })
        return;
    }
    catch (err) {
        res.status(500).json({ message: err })
        return;
    }
};
export default { getProduct, createProduct,editProduct, deleteProduct };