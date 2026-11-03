import nodemailer from 'nodemailer';
export function mailConfigured(){return Boolean(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD&&process.env.SMTP_FROM);}
export async function sendMail(to:string,subject:string,text:string){if(!mailConfigured())return false;const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_PORT==='465',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});await transporter.sendMail({from:process.env.SMTP_FROM,to,subject,text});return true;}
