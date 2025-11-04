import { User } from './userModel';
import { JournalEntry } from "./JournalEntry";
import { InvoiceDetails } from "./invoiceDetails";
import { Branch } from "./branch";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({type:'varchar',nullable:false})
  date: string;
  @Column("float")
  TotalInvoice: number;
  @Column({ type: 'enum', enum: ['sales', 'return_sales', 'purchases', 'return_purchases', 'Warehouse Transfer'], default: 'sales' })
  typeInvoice: string;
  @Column()
  currency: string;
  @ManyToOne(() => User, user => user.invoices, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user: User;
  @Column()
  userId: number;
  @ManyToOne(() => JournalEntry, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "journalEntryId" })
  journalEntry: JournalEntry;
  @Column({nullable:true})
  journalEntryId: number;
  @OneToMany(() => InvoiceDetails, detail => detail.invoice)
  details: InvoiceDetails[];
  @ManyToOne(() => Branch, branch => branch.invoice, { onDelete: 'CASCADE' })
  @JoinColumn(({ name: 'branchId' }))
  branch: Branch
  @Column()
  branchId: number
  @CreateDateColumn()
  createAt:Date;
  @UpdateDateColumn()
  updateAt:Date;
}
