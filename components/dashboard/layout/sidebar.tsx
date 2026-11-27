'use client';
import type React from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import {HeartHandshake,Menu} from 'lucide-react';
import {Sheet,SheetContent,SheetTrigger,SheetTitle,SheetDescription} from '@/components/ui/sheet';
type Item={title:string;href:string;icon:React.ReactNode;onClick?:()=>void};
export function Sidebar({items,footerItems}:{items:Item[];footerItems?:Item[];logo?:React.ReactNode;title?:string}){
 const pathname=usePathname()||'';const [open,setOpen]=useState(false);
 function body(){return <><Link href="/" className="cf-brand cf-sidebar-brand"><HeartHandshake/>CareFolio</Link><p className="cf-sidebar-caption">VOICE. REVIEW. RELAY.</p><nav aria-label="Dashboard navigation">{items.map(item=><Link href={item.href} key={item.href} onClick={()=>setOpen(false)} aria-current={pathname===item.href?'page':undefined} className={pathname===item.href?'active':''}>{item.icon}<span>{item.title}</span></Link>)}</nav><div className="cf-sidebar-footer">{footerItems?.map(item=>item.onClick?<button type="button" key={item.href} onClick={()=>{setOpen(false);item.onClick?.();}}>{item.icon}<span>{item.title}</span></button>:<Link key={item.href} href={item.href} onClick={()=>setOpen(false)}>{item.icon}<span>{item.title}</span></Link>)}<small>Synthetic prototype<br/>Browser microphone available in text fields</small></div></>;}
 return <><aside className="cf-sidebar cf-desktop-sidebar">{body()}</aside><Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><button type="button" className="cf-mobile-menu" aria-label="Open dashboard menu"><Menu size={20}/></button></SheetTrigger><SheetContent side="left" className="cf-sidebar cf-mobile-sidebar"><SheetTitle className="sr-only">CareFolio navigation</SheetTitle><SheetDescription className="sr-only">Choose your workspace or open voice visits.</SheetDescription>{body()}</SheetContent></Sheet></>;
}
