import type React from 'react';
import {cn} from '@/lib/utils';
export function Card3D({children,className,containerClassName}:{children:React.ReactNode;className?:string;containerClassName?:string}){return <div className={cn('cf-form-container',containerClassName)}><div className={cn('cf-form-card',className)}>{children}</div></div>;}
