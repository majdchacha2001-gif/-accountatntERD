import { User } from "./userModel";
import { Product } from "./product";
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, UpdateDateColumn, CreateDateColumn, JoinColumn } from "typeorm";
@Entity()
export class CompanyName {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => User, user => user.companies, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user: User;
  @Column()
  userId: number;
  @OneToMany(() => Product, product => product.company)
  products: Product[];
  @CreateDateColumn()
  createAt:Date;
  @UpdateDateColumn()
  updateAt:Date;
}
