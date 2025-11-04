import { Account } from "../entities/accountTree";
import { JournalEntry } from "../entities/JournalEntry";
import { CompanyName } from "../entities/companyName";
import {Product} from '../entities/product'
import { Invoice } from "./invoice";
import { Branch } from "./branch";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({type:'varchar', unique: true })
  username: string;
  @Column({type:"varchar",unique:true})
  password: string;
  @Column({type:'varchar', nullable: true })
  refreshToken: string;
  @Column({
    type: "enum",
    enum: ["admin", "user","superAdmin"],
    default: "user"
  })
  role: "admin" | "user";

  @OneToMany(() => CompanyName, company => company.user)
  companies: CompanyName[];

  @OneToMany(() => Product, product => product.user)
  products: Product[];

  @OneToMany(() => Invoice, invoice => invoice.user)
  invoices: Invoice[];

  @OneToMany(() => JournalEntry, journalEntry => journalEntry.user)
  journalEntries: JournalEntry[];

  @OneToMany(() => Account, account => account.user)
  accounts: Account[];
  @ManyToOne(()=>Branch,branch=>branch.user,{onDelete:'SET NULL'})
  @JoinColumn({name:'branchId'})
  branch:Branch
  @Column({nullable:true})
  branchId:number;
  @CreateDateColumn()
  createAt:Date;
  @UpdateDateColumn()
  updateAt:Date;
}
