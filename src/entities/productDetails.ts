import { Entity,Column,PrimaryGeneratedColumn,ManyToOne,JoinColumn} from "typeorm";
import { Product } from "./product";
@Entity()
export class ProductDetails{
    @PrimaryGeneratedColumn()
    id:number;
    // @ManyToOne(()=>Product,product=>product.details,{onDelete:'CASCADE'})
    // @JoinColumn({name:"productId"})
    // product:Product[]
    // @Column()
    // productId:number;
    @Column({type:'decimal',nullable:false})
    amount:number
}