'use client';
import type React from 'react';
import {Home,Building2,Users,ClipboardList,BarChart3,User} from 'lucide-react';
import {DashboardLayout} from './dashboard-layout';
import {useAuth} from '@/lib/auth';
export function GovernmentSection({title,children}:{title:string;children:React.ReactNode}){
 const {user}=useAuth();const items=[{title:'Overview',href:'/dashboard/government',icon:<Home size={18}/>},{title:'Hospitals',href:'/dashboard/government/hospitals',icon:<Building2 size={18}/>},{title:'Demographics',href:'/dashboard/government/demographics',icon:<Users size={18}/>},{title:'Registrations',href:'/dashboard/government/registrations',icon:<ClipboardList size={18}/>},{title:'Analytics',href:'/dashboard/government/analytics',icon:<BarChart3 size={18}/>},{title:'Profile',href:'/dashboard/government/profile',icon:<User size={18}/>}];
 return <DashboardLayout title={title} user={user||{name:'Government workspace',email:''}} sidebarItems={items} requiredRole="government"><p className="cf-section-notice">Legacy demonstration screens: sample metrics are illustrative, not live healthcare statistics.</p>{children}</DashboardLayout>;
}
