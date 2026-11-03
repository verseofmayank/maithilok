export type Variant={id:string;label:string;sku:string;weight:number;price:number;stock:number;image:string;compareAt?:number|null};
export type Product={id:string;name:string;hindiName:string;slug:string;categoryId:string;subcategory:string;description:string;shortDescription:string;images:string[];status:string;featured:boolean;details:Record<string,string|boolean>;seoTitle:string;seoDescription:string;variants:Variant[];category?:Category};
export type Category={id:string;name:string;slug:string;description:string;image:string;parentId:string|null;sortOrder:number};
export type CartItem={variantId:string;quantity:number};
export type Quote={items:{variantId:string;productId:string;name:string;slug:string;label:string;price:number;quantity:number;weight:number;image:string;total:number}[];subtotal:number;discount:number;shipping:number;total:number;shippingLabel:string;coupon:string;mode:string};
