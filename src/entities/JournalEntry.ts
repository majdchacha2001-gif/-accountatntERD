import { User } from "../entities/userModel";
import { JournalEntryDetail } from "../entities/JournalDetails";
import { Invoice } from "./invoice";
import { Branch } from "./branch";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,

} from "typeorm";

@Entity()
export class JournalEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: ["primary", "accountant"]
  })
  type: "primary" | "accountant";

  @Column({
    type: "enum",
    enum: ["accept", "pending"]
  })
  status: "accept" | "pending";

  @Column()
  date: string;

  @Column()
  currency: string;

  @Column({ default: false })
  isDelete: boolean;

  @Column({ nullable: true })
  description: string;
  @ManyToOne(() => User, user => user.journalEntries, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user: User;
  @Column()
  userId: number;
  @OneToMany(() => JournalEntryDetail, details => details.journalEntry)
  details: JournalEntryDetail[];
  @OneToMany(() => Invoice, (invoice) => invoice.journalEntry)
  invoices: Invoice[];
  @ManyToOne(() => Branch, branch => branch.journalEntry, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch
  @Column({ nullable: true })
  branchId: number;
  @CreateDateColumn()
  createAt:Date;
  @UpdateDateColumn()
  updateAt:Date;
}
