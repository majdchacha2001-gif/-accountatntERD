import { Invoice } from "./invoice";
import { Product } from "./product";
import { Entity,Column,ManyToOne,PrimaryGeneratedColumn,CreateDateColumn,UpdateDateColumn, JoinColumn } from "typeorm";
@Entity()
export class InvoiceDetails {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => Product, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "productId" })
  product: Product;
  @Column()
  productId: number;
  @Column({type:'decimal',nullable:false})
  amount: number;
  @Column("float")
  price: number;
  @Column("float")
  total: number;
  @ManyToOne(() => Invoice, invoice => invoice.details, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice;
  @Column()
  invoiceId: number;
  @CreateDateColumn()
  createAt:Date;
  @UpdateDateColumn()
  updateAt:Date;

}
