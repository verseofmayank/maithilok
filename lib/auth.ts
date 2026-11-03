import {cookies} from 'next/headers';
import {createHash,randomBytes} from 'node:crypto';
import {db} from './db';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function currentUser(){const token=(await cookies()).get('maithilok_session')?.value;if(!token)return null;const session=await db.session.findUnique({where:{id:hash(token)},include:{user:true}});return session && session.expiresAt>new Date()? session.user:null;}
export async function requireAdmin(){const user=await currentUser();if(!user||user.role!=='ADMIN')throw new Error('Unauthorized');return user;}
export async function createSession(userId:string){const token=randomBytes(32).toString('hex');await db.session.create({data:{id:hash(token),userId,expiresAt:new Date(Date.now()+7*86400000)}});(await cookies()).set('maithilok_session',token,{httpOnly:true,sameSite:'lax',secure:process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://'),path:'/',maxAge:7*86400});}
export async function rateLimit(key:string,limit=20){const now=new Date();await db.rateLimit.deleteMany({where:{key,expiresAt:{lt:now}}});const record=await db.rateLimit.upsert({where:{key},create:{key,expiresAt:new Date(Date.now()+15*60000)},update:{hits:{increment:1}}});if(record.hits>limit)throw new Error('Too many requests. Please try again in 15 minutes.');}
export function checkOrigin(request:Request){const origin=request.headers.get('origin');const expected=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3100';if(origin && origin!==new URL(expected).origin)throw new Error('Invalid request origin');if(request.headers.get('sec-fetch-site')==='cross-site')throw new Error('Invalid request origin');}
