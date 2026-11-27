'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname,useRouter} from 'next/navigation';
import {Mic,Square,X,Keyboard,ArrowRight,RefreshCw} from 'lucide-react';
import {createVoiceSession,insertDictation,navigationCommand,Recognition,VoiceState} from '@/lib/voice/session';
type Target=HTMLInputElement|HTMLTextAreaElement;
type SpeechWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
const idle:VoiceState={phase:'ready',transcript:'',interim:'',error:''};
function eligible(element:Element|null):element is Target{
  if(!(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement))return false;
  if(element.disabled||element.readOnly||element.closest('[data-voice-ignore]')||(element.maxLength>0&&element.maxLength<4))return false;
  if(element instanceof HTMLInputElement&&!['text','search'].includes(element.type))return false;
  return !/password|otp|aadha?r|aadhar|token|secret|credential/i.test([element.id,element.name,element.placeholder,element.getAttribute('aria-label'),element.getAttribute('autocomplete'),element.labels?.[0]?.textContent].join(' '));
}
function name(element:Target){return element.labels?.[0]?.textContent?.trim()||element.getAttribute('aria-label')||element.placeholder||element.name||'Text field';}
export default function VoiceDock(){
 const path=usePathname();const router=useRouter();const [mode,setMode]=useState('dictate');const [mounted,setMounted]=useState(false),[open,setOpen]=useState(false),[supported,setSupported]=useState(false),[state,setState]=useState<VoiceState>(idle),[language,setLanguage]=useState('en-IN'),[draft,setDraft]=useState(''),[target,setTarget]=useState<Target|null>(null),[targets,setTargets]=useState<Target[]>([]),[host,setHost]=useState<Element|null>(null),[notice,setNotice]=useState('');
 const session=useRef<ReturnType<typeof createVoiceSession>|null>(null),snapshot=useRef<{element:Target;value:string;start:number;end:number}|null>(null),targetRef=useRef<Target|null>(null);
 const phase=useRef(state.phase);phase.current=state.phase;
 const active=['requesting','recording','processing'].includes(state.phase);
 function pick(element:Target){targetRef.current=element;setTarget(element);setHost(element.closest('[role="dialog"],dialog'));}
 function show(element?:Target){if(element){session.current?.cancel();setDraft('');snapshot.current=null;pick(element);}setTargets(Array.from(document.querySelectorAll('input,textarea')).filter(e=>eligible(e)&&e.getClientRects().length>0) as Target[]);setNotice('');setOpen(true);}
 useEffect(()=>{
  setMounted(true);const browser=window as SpeechWindow;const Constructor=browser.SpeechRecognition||browser.webkitSpeechRecognition;
  setSupported(!!Constructor&&window.isSecureContext);
  if(Constructor)session.current=createVoiceSession(()=>new Constructor(),update=>{setState(update);if(update.phase==='review')setDraft(update.transcript);});
  const focus=(event:FocusEvent)=>{const element=event.target as Element;if(!['ready','error'].includes(phase.current))return;if(eligible(element))pick(element);else if((element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement)&&!element.closest('[data-voice-ignore]')){targetRef.current=null;setTarget(null);snapshot.current=null;setHost(element.closest('[role="dialog"],dialog'));}};
  const request=(event:Event)=>{const id=(event as CustomEvent<{targetId:string}>).detail?.targetId;const element=id?document.getElementById(id):null;show(eligible(element)?element:undefined);};
  const hide=()=>{if(document.hidden){session.current?.cancel();setNotice('Dictation cancelled when this tab was hidden. Existing text is unchanged.');}};
  document.addEventListener('focusin',focus);window.addEventListener('carefolio:voice',request);document.addEventListener('visibilitychange',hide);
  return()=>{session.current?.dispose();document.removeEventListener('focusin',focus);window.removeEventListener('carefolio:voice',request);document.removeEventListener('visibilitychange',hide);};
 },[]);
 useEffect(()=>{session.current?.cancel();setOpen(false);setTarget(null);targetRef.current=null;setHost(null);snapshot.current=null;},[path]);
 useEffect(()=>{if(!active)return;const element=targetRef.current;const observer=new MutationObserver(()=>{if(element&&!element.isConnected){session.current?.cancel();setNotice('The selected field closed. Dictation was cancelled without changing its text.');}});observer.observe(document.body,{childList:true,subtree:true});const leave=()=>session.current?.cancel();window.addEventListener('pagehide',leave);return()=>{observer.disconnect();window.removeEventListener('pagehide',leave);};},[active]);
 useEffect(()=>{if(!host)return;const observer=new MutationObserver(()=>{if(!host.isConnected){session.current?.cancel();setOpen(false);setHost(null);setTarget(null);targetRef.current=null;}});observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();},[host]);
 const destination=mode==='navigate'?navigationCommand(draft):null;
 function start(){
  const element=targetRef.current;setNotice('');setDraft('');
  if(mode==='dictate'&&(!element||!element.isConnected||!eligible(element))){setNotice('Select an editable text field on the page before starting.');return;}
  snapshot.current=mode==='dictate'&&element?{element,value:element.value,start:element.selectionStart??element.value.length,end:element.selectionEnd??element.value.length}:null;
  session.current?.start(language);
 }
 function insert(){try{
  const snap=snapshot.current;if(!snap||!snap.element.isConnected||!eligible(snap.element))throw new Error('That field is no longer editable. Choose it again and retry.');
  if(snap.element.value!==snap.value)throw new Error('The field changed while you dictated. Copy the transcript below or start again at the new cursor position. Nothing was overwritten.');
  const result=insertDictation(snap.value,snap.start,snap.end,draft,snap.element.maxLength);
  const prototype=snap.element instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(prototype,'value')?.set;if(!setter)throw new Error('This field cannot accept dictation. Type or paste instead.');
  setter.call(snap.element,result.value);snap.element.dispatchEvent(new Event('input',{bubbles:true}));snap.element.focus();snap.element.setSelectionRange(result.caret,result.caret);
  session.current?.cancel();setDraft('');setOpen(false);
 }catch(error){setNotice((error as Error).message);}}
 if(!mounted)return null;
 const container=host?.isConnected?host:document.body;
 return createPortal(<div className="cf-voice" data-voice-ignore>
 {!open?<button type="button" className="cf-voice-launcher" onClick={()=>show()} aria-label="Open CareFolio microphone dictation"><Mic size={20}/><span>Voice input</span></button>:<section className="cf-voice-panel" aria-label="CareFolio microphone dictation"><header><div><span className="cf-overline">CareFolio voice</span><h2>Speak. Review. Insert.</h2></div><button type="button" aria-label="Cancel dictation and close" onClick={()=>{session.current?.cancel();setDraft('');setOpen(false);}}><X size={19}/></button></header>
 <p className="cf-voice-privacy">Browser speech service · Use synthetic information only. Your browser may send audio to its speech provider. This is separate from Wispr Flow.</p>
 {!supported&&<p role="status" className="cf-voice-warning">In-app speech is unavailable in this browser or context. Try a browser that exposes SpeechRecognition on HTTPS or localhost. Typing and installed Flow still work.</p>}
 <label htmlFor="voice-mode">What would you like to do?</label><select id="voice-mode" value={mode} disabled={active||state.phase==='review'} onChange={e=>setMode(e.target.value)}><option value="dictate">Dictate into a text field</option><option value="navigate">Request app navigation</option></select>{mode==='dictate'&&<><label htmlFor="voice-target">Insert into</label><select id="voice-target" value={targets.indexOf(target!)} disabled={active||state.phase==='review'} onChange={e=>{const element=targets[Number(e.target.value)];if(element){pick(element);element.focus();}}}><option value={-1}>Click a text field, then open the mic</option>{targets.map((element,i)=><option key={i} value={i}>{name(element).slice(0,85)}</option>)}</select></>}{mode==='navigate'&&<p className="cf-voice-hint">Say “open home”, “open dashboard”, “open visits”, “open referrals” or “open sign in”. A button confirms the destination; nothing happens automatically.</p>}
 <label htmlFor="voice-language">Recognition language</label><select id="voice-language" value={language} disabled={active} onChange={e=>setLanguage(e.target.value)}><option value="en-IN">English (India)</option><option value="hi-IN">Hindi (India)</option></select><p className="cf-voice-hint">Requested language only. Hindi, Hinglish and code-switching quality have not been tested. Check every result.</p>
 <div role="status" aria-live="polite" className={'cf-voice-state '+state.phase}>{state.phase==='recording'?<><span className="cf-recording-dot"/> Microphone active — speaking can be recognized</>:state.phase==='requesting'?'Requesting microphone permission…':state.phase==='processing'?'Processing final speech results…':state.phase==='review'?'Transcript ready. Review before using it.':state.phase==='error'?state.error:'Ready. Choose a text field or navigation, then start the microphone.'}</div>
 {state.interim&&<p className="cf-interim">In progress (may change): {state.interim}</p>}
 {state.phase==='review'&&<><label htmlFor="voice-result">Review transcript</label><textarea id="voice-result" value={draft} maxLength={15000} onChange={e=>setDraft(e.target.value)}/></>}
 {notice&&<p role="alert" className="cf-voice-warning">{notice}</p>}
 <div className="cf-voice-actions">{['ready','error'].includes(state.phase)&&<button type="button" className="cf-voice-primary" disabled={!supported||(mode==='dictate'&&!target)} onClick={start}>{state.phase==='error'?<RefreshCw size={17}/>:<Mic size={17}/>} {state.phase==='error'?'Retry microphone':'Start microphone'}</button>}{['recording','requesting'].includes(state.phase)&&<button type="button" className="cf-voice-primary" onClick={()=>session.current?.stop()}><Square size={15}/> Stop & process</button>}{active&&<button type="button" onClick={()=>{session.current?.cancel();setDraft('');}}>Cancel</button>}{state.phase==='review'&&mode==='navigate'&&<div className="cf-navigation-preview"><p>{destination?`Requested destination: ${destination.label}`:'No supported navigation command matched. Edit the transcript or discard and try again.'}</p>{destination&&<button type="button" className="cf-voice-primary" onClick={()=>{session.current?.cancel();setOpen(false);router.push(destination.href);}}>Confirm: open {destination.label} <ArrowRight size={16}/></button>}<button type="button" onClick={()=>{session.current?.cancel();setDraft('');}}>Discard command</button></div>}{state.phase==='review'&&mode==='dictate'&&<><button type="button" className="cf-voice-primary" disabled={!draft.trim()} onClick={insert}>Insert reviewed text <ArrowRight size={16}/></button><button type="button" onClick={()=>{session.current?.cancel();setDraft('');}}>Discard transcript</button></>}</div><p className="cf-voice-hint"><Keyboard size={12}/> Speech never submits a form or changes a clinical decision. Navigation requires confirmation. Review inserted text in its field.</p>
 </section>}
 </div>,container);
}
