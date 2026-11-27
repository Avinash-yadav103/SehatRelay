export const fields = ['patient','date','language','reason','symptoms','duration','maternal','observations','history','referralReason','facility','followUp'] as const;
export type Field = typeof fields[number];
export type Note = Record<Field, {value:string; evidence:string; verified:boolean}>;
export const labels: Record<Field,string> = {patient:'Synthetic patient identifier',date:'Visit date',language:'Preferred language',reason:'Reason for visit',symptoms:'Reported concerns',duration:'Symptom duration',maternal:'Maternal context',observations:'Observations / measurements',history:'Relevant history',referralReason:'Referral reason',facility:'Receiving facility / clinician',followUp:'Follow-up notes'};
export const sample = 'Demo patient Tara-01. Aaj pregnancy follow-up visit hai. Patient ne thakan batayi. Pregnancy 24 weeks hai. Clinician review ke liye referral chahiye.';
export function makeNote(narrative:string):Note {
 const note = Object.fromEntries(fields.map(f=>[f,{value:'',evidence:'',verified:false}])) as Note;
 // Exact fixture only: never imply arbitrary clinical language understanding.
 if(narrative === sample) {
 const values:Partial<Record<Field,string>>={patient:'Demo patient Tara-01',reason:'Aaj pregnancy follow-up visit hai',symptoms:'Patient ne thakan batayi',maternal:'Pregnancy 24 weeks hai',referralReason:'Clinician review ke liye referral chahiye'};
 for(const f of fields) if(values[f]) note[f]={value:values[f]!,evidence:values[f]!,verified:false};
 }
 return note;
}
export function flags(note:Note,narrative:string):string[] {
 const out=fields.filter(f=>!note[f].value.trim()).map(f=>`${labels[f]}: Not provided. Please review.`);
 if(!note.duration.value) out.push('Duration has not been documented. Check the narrative.');
 const ages=[...narrative.matchAll(/\b(\d{1,3})\s*(?:years? old|saal|वर्ष)/gi)].map(m=>m[1]);
 if(new Set(ages).size>1) out.push('The narrative contains two different ages; please review the original text.');
 for(const f of fields) if(note[f].value && (!note[f].evidence || !narrative.includes(note[f].evidence))) out.push(`${labels[f]}: User-entered or could not be matched to the source. Confirm it yourself.`);
 return out;
}
