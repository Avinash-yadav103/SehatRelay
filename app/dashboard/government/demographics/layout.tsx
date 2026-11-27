import type React from 'react';
import {GovernmentSection} from '@/components/dashboard/layout/government-section';
export const metadata={title:'Demographics — CareFolio'};
export default function Section({children}:{children:React.ReactNode}){return <GovernmentSection title="Demographics">{children}</GovernmentSection>;}
