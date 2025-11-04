import { User } from "./userModel";
import { Product } from "./product";
import { Invoice } from "./invoice";
import { Account } from "./accountTree";
import { JournalEntry } from "./JournalEntry";
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
@Entity()
export class Branch {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ type: 'varchar', nullable: false })
    name: string;
    @Column({ type: 'decimal', nullable: false })
    phone: number;
    @Column({ type: 'varchar', nullable: false })
    location: string;
    @CreateDateColumn()
    createAt: Date;
    @UpdateDateColumn()
    updateAt: Date;
    @OneToMany(() => User, user => user.branch)
    user: User[];
    @OneToMany(() => Product, product => product.branch)
    product: Product[]
    @OneToMany(() => Invoice, invoice => invoice.branch)
    invoice: Invoice[]
    @OneToMany(() => Account, accounts => accounts.branch)
    accounts: Account[]
    @OneToMany(() => JournalEntry, journalEntry => journalEntry.branch)
    journalEntry: JournalEntry[];

}