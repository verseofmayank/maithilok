import {z} from 'zod';
import {states} from './utils';
export const email=z.string().trim().toLowerCase().email().max(254);
export const addressSchema=z.object({name:z.string().trim().min(2).max(100),email,phone:z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),house:z.string().trim().min(2).max(150),street:z.string().trim().min(2).max(150),city:z.string().trim().min(2).max(80),state:z.enum(states as [string,...string[]]),pin:z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid six-digit PIN code'),landmark:z.string().max(150).optional().default('')});
export const cartSchema=z.object({items:z.array(z.object({variantId:z.string().min(1),quantity:z.number().int().min(1).max(20)})).min(1).max(40),coupon:z.string().max(40).optional().default(''),state:z.string().optional(),pin:z.string().optional(),mode:z.enum(['DEMO','LIVE']).default('DEMO')});
export const enquirySchema=z.object({name:z.string().trim().min(2).max(100),email,mobile:z.string().regex(/^$|^[6-9]\d{9}$/).optional().default(''),subject:z.string().trim().min(3).max(150),message:z.string().trim().min(10).max(5000),type:z.enum(['General enquiry','Product enquiry','Order support'])});
export const passwordSchema=z.string().min(12,'Use at least 12 characters').max(128);
