export type createProductType={
    id:number;
    name:string;
    description:string;
    amount:number;
    companyId:number;
    branchId:number;
    userId:number
    pricePurchases:number;
    priceSales:number;
    unit:string
}
export type getProductType={
    branchId:number
}
export type editProductType={
    id:number;
    name:string;
    description:string;
    amount:number;
    companyId:number;
    pricePurchases:number;
    priceSales:number;
    unit:string
}
export type deleteProductType={
    id:number;
}