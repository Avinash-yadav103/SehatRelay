import type React from 'react';
import {GovernmentSection} from '@/components/dashboard/layout/government-section';
export const metadata={title:'Registration requests — CareFolio'};
export default function Section({children}:{children:React.ReactNode}){return <GovernmentSection title="Registration requests">{children}</GovernmentSection>;}
