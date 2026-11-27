'use client';
import dynamic from 'next/dynamic';
const VoiceDock=dynamic(()=>import('./voice-dock'),{ssr:false});
export default function VoiceClient(){return <VoiceDock/>;}
