export type Category='Football'|'Basketball'|'Rugby'|'Athletics'|'Other';
export type Product={id:string;team_name:string;product_name:string;category:Category;season:string;jersey_type:string;description:string|null;previous_price:number;current_price:number;available_sizes:string[];stock_quantity:number;featured:boolean;active:boolean;product_images?:{id:string;image_url:string;is_primary:boolean}[]};
export type Location={id:string;name:string;sort_order:number;active:boolean};
export const money=(value:number)=>`KES ${new Intl.NumberFormat('en-KE').format(value)}`;
export const save=(product:Product)=>product.previous_price>product.current_price?Math.round((1-product.current_price/product.previous_price)*100):0;
