import { Account } from "../entities/accountTree";
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
@Entity()
export class AccountRelation {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => Account, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "parentId" })
  parent: Account;
  @Column()
  parentId:number
  @ManyToOne(() => Account, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "childId" }) 
  child: Account;
  @Column()
  childId:number;
}
