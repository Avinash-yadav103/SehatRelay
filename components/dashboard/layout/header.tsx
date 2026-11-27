'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {LogOut,Mic,User} from 'lucide-react';
import {useAuth} from '@/lib/auth';
interface HeaderProps{title:string;user:{name:string;email:string;image?:string};notifications?:number}
export function Header({title,user}:HeaderProps){
 const {logout}=useAuth();const router=useRouter();
 return <header className="cf-dashboard-header"><div><span className="cf-overline">Your CareFolio workspace</span><h1>{title}</h1></div><div className="cf-header-links"><Link href="/visits" className="cf-link-button"><Mic size={16}/>Voice visit</Link><Link href="/profile" className="cf-profile-link"><User size={17}/><span>{user?.name||'Your profile'}</span></Link><button type="button" aria-label="Sign out" onClick={()=>{logout();router.push('/login');}}><LogOut size={18}/></button></div></header>;
}
