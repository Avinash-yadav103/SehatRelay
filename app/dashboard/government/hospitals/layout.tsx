import type React from 'react';
import {GovernmentSection} from '@/components/dashboard/layout/government-section';
export const metadata={title:'Hospital management — CareFolio'};
export default function Section({children}:{children:React.ReactNode}){return <GovernmentSection title="Hospital management">{children}</GovernmentSection>;}
