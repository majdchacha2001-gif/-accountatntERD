import { User } from "../entities/userModel";
import { Branch } from "./branch";
import { JournalEntryDetail } from "./JournalDetails";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from "typeorm";

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({type:'varchar',nullable:false})
  name: string;
  @Column({type:'varchar',nullable:false, default:''})
  name_en: string;
  @Column({type:'boolean',default:false})
  isParent: boolean;
  @Column({type:'boolean',default:false})
  isConfig: boolean;
  @Column({type:'varchar'})
  accountType: string;
  @Column({type:'varchar',default:'USD'})
  currency: string;
  @Column({type:'boolean',default:false})
  final_account: boolean;
  @Column({type:'float',default:0})
  Ratio: number;
  @Column({type:'float',default:0})
  waring: number;
  @Column({type:'boolean',default:false})
  isBlock: boolean;
  @ManyToOne(() => User, user => user.accounts, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user: User;
  @Column()
  userId: number;
  @ManyToOne(()=>Branch,branch=>branch.accounts,{onDelete:'RESTRICT'})
  @JoinColumn({name:'branchId'})
  branch:Branch;
  @Column()
  branchId:number;
  @OneToMany(() => JournalEntryDetail, detail => detail.account)
journalEntryDetails: JournalEntryDetail[];
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}

