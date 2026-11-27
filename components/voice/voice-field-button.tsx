'use client';
import { Mic } from 'lucide-react';
export function VoiceFieldButton({targetId, label='Dictate with microphone'}:{targetId:string;label?:string}) {
  return <button type="button" className="cf-mic-button" onClick={()=>{document.getElementById(targetId)?.focus();window.dispatchEvent(new CustomEvent('carefolio:voice',{detail:{targetId}}));}}><Mic size={17}/>{label}</button>;
}
