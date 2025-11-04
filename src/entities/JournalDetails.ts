import { JournalEntry } from "../entities/JournalEntry";
import { Account } from "../entities/accountTree";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity()
export class JournalEntryDetail {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => JournalEntry, journalEntry => journalEntry.details, { onDelete: "CASCADE" })
  @JoinColumn({ name: "journalEntryId" })
  journalEntry: JournalEntry;
  @Column()
  journalEntryId: number;
  @ManyToOne(() => Account, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "accountId" })
  account: Account;
  @Column()
  accountId: number;
  @Column("float")
  debtor: number;
  @Column("float")
  creditor: number;
  @Column()
  currency: string;
  @Column("float")
  debtorVs:number;
  @Column('float')
  creditorVs:number;
  @Column({default:""})
  currencyVs:string;
}

