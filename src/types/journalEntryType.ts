export type createJournalType={
    date:string;
    description:string;
    userId:number;
    branchId:number;
  status?: "accept" | "pending";
  type?: "primary" | "accountant";
    currency:string;
   
}
export type createDetailsType={
    details: Array<{
    accountId: number;
    debtor: number;
    creditor: number;
    currency?: string;
    debtorVs:number;
    creditorVs:number;
    currencyVs:string;
  }>; 
}
export type editJournalType={
    id:number;
    date:string;
    description:string;
    currency:string;
  status?: "accept" | "pending";
  type?: "primary" | "accountant";
    details: Array<{
    accountId: number;
    debtor: number;
    creditor: number;
    currency?: string;
    debtorVs:number;
    creditorVs:number;
    currencyVs:string;
  }>;  
}
export type deleteJournal={
    id:number
}
