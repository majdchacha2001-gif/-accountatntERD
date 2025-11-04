import jwt from 'jsonwebtoken';
import { Request,Response } from "express";
import { Branch } from "../entities/branch";
import { User } from "../entities/userModel";
import {generateRefreshToken } from "../lib/jwt";
import  seedAccountTreeIfEmpty  from "../utils/accountSeeder";
import { AppDataSource } from '../lib/postgres';
import { branch } from '../types/branchTypes';
import { UserData } from '../types/userType';
const createBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, location } = req.body as branch;
    const { username, password, role } = req.body as UserData;

    const branchRepo = AppDataSource.getRepository(Branch);
    const userRepo = AppDataSource.getRepository(User);
    const findBranch = await branchRepo.find({ where: { name: name } });
    const findUser = await userRepo.find({ where: { username: username } });
    if (findBranch.length === 0 && findUser.length === 0) {
    const newBranch = branchRepo.create({ name:name, phone:phone, location:location });
    const savedBranch = await branchRepo.save(newBranch);
    const newUser = userRepo.create({
        username:username,
        password: password,
        role:role,
        branchId: savedBranch.id,
      });
      const savedUser = await userRepo.save(newUser);

      savedUser.refreshToken = generateRefreshToken(savedUser.id);
      await userRepo.save(savedUser);

      seedAccountTreeIfEmpty(savedUser.id, savedBranch.id);

      res.status(201).json({
        message: `Success`,
        createBranch: savedBranch,
        createUser: savedUser,
      });
      return;
    }

    res.status(400).json({ message: `user or branch already exist` });
    return;
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
const getBranch=async(req:Request,res:Response):Promise<void>=>{
    try{
        const branchRepo=AppDataSource.getRepository(Branch);
        const getAllBranch=await branchRepo.find();
        if(!getAllBranch || getAllBranch.length===0){
            res.status(203).json({message:`No Content`})
            return;
        }
        res.status(200).json({message:`Success`,data:getAllBranch})
        return;
    }
    catch(err){
        res.status(500).json({message:err})
        return;
    }
};
const updateBranch=async(req:Request,res:Response):Promise<void>=>{
    try{
        const {id,name,phone,location}=req.body as branch
        const branchRepo=AppDataSource.getRepository(Branch);
        if(!id || !name || !phone || !location){
            res.status(400).json({message:`invalid keys`})
            return;
        }
        const findBranch=await branchRepo.findOneBy({id});
        if(!findBranch){
            res.status(203).json({message:`No Content`})
            return;
        }
        findBranch.name=name;
        findBranch.phone=phone;
        findBranch.location=location;
        await branchRepo.save(findBranch);
        res.status(200).json({message:`Success update`,data:findBranch})
        return;
    }
    catch(err){
        res.status(500).json({message:err})
        return;
    }
};
export default {createBranch,getBranch,updateBranch}
