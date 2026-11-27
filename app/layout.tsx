import './globals.css';
import './carefolio.css';
import {UserProvider} from '@/context/UserContext';
import VoiceClient from '@/components/voice/voice-client';
export const metadata={title:'CareFolio — Voice, review, relay',description:'Voice-enabled healthcare records and synthetic visit handoffs with SehatRelay and SunoSure.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className="carefolio-theme"><UserProvider><div className="cf-prototype-notice">CareFolio prototype <span>Use synthetic patient information only.</span></div>{children}<VoiceClient/></UserProvider></body></html>;}
