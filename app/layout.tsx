import type {Metadata} from 'next';
import {db} from '@/lib/db';
import {StoreProvider} from '@/components/store-provider';
import {Shell} from '@/components/shell';
import './globals.css';
const url=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3100';
export const metadata:Metadata={metadataBase:new URL(url),title:{default:'Maithilok | Traditional Foods from Mithila',template:'%s | Maithilok'},description:'From Mithila, To Your Home. Discover Maithilok cow and buffalo ghee, and a growing collection of traditional foods from Mithila.',openGraph:{type:'website',siteName:'Maithilok',locale:'en_IN',images:['/banners/ghee-hero.png']},icons:{icon:'/icons/favicon.svg'},robots:{index:!url.includes('localhost'),follow:true}};
export default async function RootLayout({children}:{children:React.ReactNode}){const content=(await db.setting.findUnique({where:{key:'content'}}))?.value as Record<string,string>;return <html lang="en"><body><StoreProvider><Shell announcement={content?.announcement||'Rooted in Mithila. Made for homes across India.'}>{children}</Shell></StoreProvider></body></html>;}
