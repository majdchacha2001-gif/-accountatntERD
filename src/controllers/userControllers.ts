import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { AppDataSource } from '../lib/postgres';
import { User } from '../entities/userModel';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';
import config from '../config/index';
import { messages } from '../utils/message';
import { UserData, LoginData, RefreshTokenData, } from '../types/userType';
const register = async (req: Request, res: Response): Promise<void> => {
  const { username, password, role } = req.body as UserData;
  const userRepository = AppDataSource.getRepository(User);

  try {
    const createUser = userRepository.create({
      username,
      password,
      role,
    });
    await userRepository.save(createUser);
    const refreshToken = generateRefreshToken(createUser.id);
    createUser.refreshToken = refreshToken;
    await userRepository.save(createUser);
    res.status(201).json({ message: 'register', user: createUser});
  } catch (err) {
    res.status(500).json({ message: 'Error in registration', error: err });
    console.log(err);
  }
};
const login = async (req: Request, res: Response): Promise<void> => {
  const {username,password}=req.body as LoginData;
  const userRepo=AppDataSource.getRepository(User);
  const findUser=await userRepo.findOneBy({username:username});
  if(!findUser){
    res.status(203).json({message:`user not found`})
    return;
  }
  if(findUser.password!=password){
    res.status(203).json({message:`password invalid`})
    return;
  }
  findUser.refreshToken=generateRefreshToken(findUser.id);
  await userRepo.save(findUser);
  res.status(200).json({message:`Success`,data:findUser,accessToken:generateAccessToken(findUser.id)})
  return;
};
const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as RefreshTokenData;
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_TOKEN) as { userId: number };
    const userRepository = AppDataSource.getRepository(User);
    const foundUser = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!foundUser) {
      res.status(401).json({ message:'Unauthorized' });
      return;
    }

    const accessToken = generateAccessToken(foundUser.id);

    res.status(200).json({accessToken:accessToken });
    return
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};
const getUser=async(req:Request,res:Response):Promise<void>=>{
  try{
  const userRepository = AppDataSource.getRepository(User);
  const getUser=await userRepository.find();
  res.status(200).json(getUser)
  }
  catch(err){
    console.log(err);
  }
};
export default { register, login, refreshToken,getUser };
