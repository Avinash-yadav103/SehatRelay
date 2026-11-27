'use client';
import Link from 'next/link';
import {HeartHandshake,Menu,X} from 'lucide-react';
import {useState} from 'react';
export function FloatingNavbar({navItems}:{navItems:{name:string;link:string}[]}){
 const [open,setOpen]=useState(false);
 return <header className="cf-public-header"><Link href="/" className="cf-brand"><HeartHandshake/>CareFolio</Link><button type="button" className="cf-public-menu" aria-label="Toggle navigation" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button><nav aria-label="Site navigation" className={open?'is-open':''}><Link href="/">Home</Link><Link href="/visits">Voice visits</Link><Link href="/referrals">Referrals</Link><Link href="/dashboard">Dashboard</Link><Link href="/login" className="cf-link-button">Sign in</Link></nav></header>;
}
