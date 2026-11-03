'use client';
import Link from 'next/link';
import {LoaderCircle,ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {ButtonHTMLAttributes,ReactNode} from 'react';
export function Button({className,loading,disabled,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{loading?:boolean}){return <button className={cn('button',className)} disabled={loading||disabled} {...props}>{loading?<LoaderCircle size={18} className="spin"/>:null}{children}</button>;}
export function ButtonLink({href,children,secondary=false}:{href:string;children:ReactNode;secondary?:boolean}){return <Link className={cn('button',secondary&&'secondary')} href={href}>{children}<ArrowRight size={17}/></Link>;}
export function Heading({eyebrow,title,children}:{eyebrow?:string;title:string;children?:ReactNode}){return <div className="page-heading">{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{children&&<p>{children}</p>}</div>;}
export function Empty({title,children,href='/shop',action='Explore the collection'}:{title:string;children:ReactNode;href?:string;action?:string}){return <div className="empty"><span className="empty-mark">✳</span><h2>{title}</h2><p>{children}</p><ButtonLink href={href}>{action}</ButtonLink></div>;}
export async function api(url:string,body?:unknown){const response=await fetch(`/api/${url}`,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Something went wrong. Please try again.');return data;}
