import express from 'express';
import cors from "cors";
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import corsOptions from './config/corsOptions';
import limiter from './lib/rateLimit';
import {connectToDatabase,disconnectFromDataBase} from './lib/postgres'
import {logger} from './lib/winston';
import userRoutes from './routes/userRoutes';
import accountTreeRoutes from './routes/accountTreeRoutes';
import journalRoutes from './routes/journalRoutes';
import productRoutes from './routes/productRoutes'
import companyRoutes from './routes/companyRoutes'
import invoiceRoutes from './routes/invoiceRoutes'
import branchRoutes from './routes/branchRoutes';
import morgan from 'morgan';
const app=express();
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.set('trust proxy', 1);
app.use(morgan("dev"))
app.use(compression({
    threshold:1024
}));
app.use(limiter);
(async()=>{
    await connectToDatabase();
    app.use("/user",userRoutes);
    app.use('/account',accountTreeRoutes);
    app.use('/journal',journalRoutes);
    app.use('/company',companyRoutes);
    app.use('/product',productRoutes);
    app.use('/invoice',invoiceRoutes);
    app.use('/branch',branchRoutes);
    try{
app.get("/",(req,res)=>{{
    res.json({message:`hello world`})
}})
app.listen(config.PORT,()=>{
    logger.info(`http://localhost:${config.PORT}`);
})
    }
    catch(err){
        logger.info(err);
        if(config.NODE_ENV==="production"){
            process.exit(1);
        }
    }
})();
const handleServerShutdown=async()=>{
    try{
        await disconnectFromDataBase();
        logger.info(`Server Shutdown`);
        process.exit(0);
    }
    catch(err){
        logger.info(`Error during server shutdown` ,err);
    }
};
process.on("SIGTERM",handleServerShutdown);
process.on("SIGINT",handleServerShutdown);
