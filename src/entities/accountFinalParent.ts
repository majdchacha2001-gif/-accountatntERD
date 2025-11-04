import { Account } from "./accountTree";
import { Entity,Column,ManyToOne,PrimaryGeneratedColumn, JoinColumn } from "typeorm";
@Entity()
export class AccountFinalParent{
    @PrimaryGeneratedColumn()
     id: number;
     @ManyToOne(() => Account, { onDelete: "CASCADE", nullable: false })
     @JoinColumn({ name: "finalId" })
     final: Account;
     @Column()
     finalId:number;
     @ManyToOne(() => Account, { onDelete: "CASCADE", nullable: false })
     @JoinColumn({ name: "childId" })
     child: Account;
     @Column()
     childId:number;

}