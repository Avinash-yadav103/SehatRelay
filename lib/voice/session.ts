// Thin, injectable adapter over the browser Web Speech API. No audio is retained.
export type VoicePhase = 'ready' | 'requesting' | 'recording' | 'processing' | 'review' | 'error';
export type VoiceState = {phase: VoicePhase; transcript: string; interim: string; error: string};
export type RecognitionResult = {isFinal: boolean; 0: {transcript: string}};
export interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: {error: string}) => void) | null;
  onresult: ((event: {results: ArrayLike<RecognitionResult>}) => void) | null;
  start(): void; stop(): void; abort(): void;
}
const errors: Record<string,string> = {
  'not-allowed': 'Microphone permission was denied. Allow access in your browser settings and retry.',
  'service-not-allowed': 'The browser speech service is unavailable or blocked. Type or use installed Wispr Flow.',
  'audio-capture': 'No microphone could be opened. Check the device and browser permissions.',
  network: 'The browser speech service could not connect. Your existing text is unchanged. Retry or type.',
  'no-speech': 'No speech was recognized. Check the microphone and try again.',
  'language-not-supported': 'This speech service does not support the selected language. Choose another or type.',
};
export function createVoiceSession(create: () => Recognition, publish: (state: VoiceState) => void) {
  let recognition: Recognition | null = null;
  let state: VoiceState = {phase:'ready',transcript:'',interim:'',error:''};
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const emit = (patch: Partial<VoiceState>) => {state={...state,...patch};publish({...state});};
  const release = () => {
    clearTimeout(timer);
    const old=recognition;recognition=null;
    if(old){old.onstart=old.onend=old.onerror=old.onresult=null;try{old.abort();}catch{}}
  };
  const fail=(message:string)=>{generation++;release();emit({phase:'error',error:message,interim:''});};
  function stop(){
    if(!recognition || !['requesting','recording'].includes(state.phase))return;
    clearTimeout(timer);emit({phase:'processing'});
    try{timer=setTimeout(()=>fail('Speech processing timed out. Retry; existing form text is unchanged.'),12000);recognition.stop();}catch{fail('Could not stop the speech service. Please retry.');}
  }
  return {
    start(language:string){
      generation++;release();const current=generation;
      emit({phase:'requesting',transcript:'',interim:'',error:''});
      try{
        const instance=create();recognition=instance;
        instance.lang=language;instance.continuous=true;instance.interimResults=true;
        instance.onstart=()=>{if(current!==generation||state.phase!=='requesting')return;clearTimeout(timer);emit({phase:'recording'});timer=setTimeout(stop,120000);};
        instance.onresult=event=>{
          if(current!==generation)return;
          const final:string[]=[],interim:string[]=[];
          for(let i=0;i<event.results.length;i++){const result=event.results[i];(result.isFinal?final:interim).push(result[0].transcript);}
          emit({transcript:final.join(' ').trim(),interim:interim.join(' ').trim()});
        };
        instance.onerror=event=>{if(current===generation)fail(errors[event.error]||'Speech recognition failed. Existing form text is unchanged. Retry or type.');};
        instance.onend=()=>{
          if(current!==generation)return;
          generation++;release();
          emit({phase:state.transcript.trim()?'review':'error',interim:'',error:state.transcript.trim()?'':'No final transcript was returned. Your existing text is unchanged.'});
        };
        timer=setTimeout(()=>fail('Microphone setup timed out. Check permissions and try again.'),20000);
        instance.start();
      }catch{fail('Could not start browser dictation. Use a supported browser on HTTPS or localhost, or type instead.');}
    },
    stop,
    cancel(){generation++;release();emit({phase:'ready',transcript:'',interim:'',error:''});},
    dispose(){generation++;release();},
  };
}

export function insertDictation(value:string,start:number,end:number,text:string,maxLength=-1){
  const before=value.slice(0,start),after=value.slice(end);
  const insertion=(before&&!/\s$/.test(before)?' ':'')+text.trim()+(after&&!/^\s/.test(after)?' ':'');
  const next=before+insertion+after;
  if(maxLength>=0&&next.length>maxLength)throw new Error('This transcript exceeds the field limit. Shorten it before inserting.');
  return {value:next,caret:before.length+insertion.length};
}
// Only these destinations can be requested by speech; navigation needs a click.
export function navigationCommand(transcript:string):{label:string;href:string}|null{
 const phrase=transcript.trim().toLowerCase().replace(/[.!?।]+$/g,'').replace(/\s+/g,' ');
 const commands:Record<string,{label:string;href:string}>={
  'open home':{label:'CareFolio home',href:'/'},'go home':{label:'CareFolio home',href:'/'},
  'open dashboard':{label:'Your dashboard',href:'/dashboard'},
  'open visits':{label:'Voice visits',href:'/visits'},'open voice visits':{label:'Voice visits',href:'/visits'},
  'open referrals':{label:'Referrals',href:'/referrals'},'open sign in':{label:'Sign in',href:'/login'},
 };
 return Object.hasOwn(commands,phrase)?commands[phrase]:null;
}
