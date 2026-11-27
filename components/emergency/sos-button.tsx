'use client';
import {useState} from 'react';
import {AlertTriangle} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
// The legacy component simulated messages and alerts. Never present it as an emergency service.
export function SOSButton({user}:{user:unknown}){
 const [open,setOpen]=useState(false);
 return <><button type="button" className="cf-sos-demo" onClick={()=>setOpen(true)} aria-label="Open SOS prototype information"><AlertTriangle size={17}/>SOS demo</button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Emergency feature prototype</DialogTitle><DialogDescription>This demo does not contact emergency services, hospitals or personal contacts. No alerts, calls or messages are sent.</DialogDescription></DialogHeader><p className="text-sm text-muted-foreground">The original interface simulated these notifications. This prototype is not an emergency response service.</p><Button onClick={()=>setOpen(false)}>Close demo information</Button></DialogContent></Dialog></>;
}
