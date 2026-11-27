'use client';

import { ArrowUpRight, ArrowRight, Check, FileText, HeartHandshake, Keyboard, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const scenes = [
  { title: 'A visit, in her own words.', label: '01 / Document', quote: 'Patient ne thakan batayi. Pregnancy 24 weeks hai.', detail: 'Keep the original visit narrative. Enter text with installed Wispr Flow, or type and paste.', icon: MessageSquareText },
  { title: 'A moment to check.', label: '02 / Review', quote: 'Symptom duration: Not provided', detail: 'SunoSure highlights the missing detail. Check the source, then confirm it as unknown if it was not documented.', icon: ShieldCheck },
  { title: 'A handoff that stays visible.', label: '03 / Refer', quote: 'Submitted → Acknowledged', detail: 'A clinician reads the reviewed note and records an acknowledgement. This preview shows example statuses only.', icon: HeartHandshake },
];
const questions = [
  ['How do the microphone and Wispr Flow differ?', 'The CareFolio microphone uses the browser speech service and stages a transcript for review. Installed Wispr Flow inserts text directly into a field. The Flow path gives CareFolio no access to audio. Typing and pasting also work.'],
  ['What happens when I generate a note?', 'The exact fictional Tara-01 example prepares predefined, source-linked fields. Other narratives open a blank manual template. No AI extraction provider is configured.'],
  ['Does SunoSure validate clinical information?', 'No. It is a limited review aid for missing details, conflicting age phrases and source matches. The worker and clinician remain responsible for checking the information.'],
  ['Can I use this with real patient information?', 'Use synthetic information only. This prototype uses demo roles and local file storage. Real patient use needs privacy, security and clinical governance review.'],
];

export default function Landing({ start, busy }: { start: () => void; busy: boolean }) {
  const [scene, setScene] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const item = scenes[scene];
  const Icon = item.icon;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    // All content is visible without GSAP. Load only when motion is permitted.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed || !root.current) return;
      const element = root.current;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      cleanup = () => media.revert();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.75 } })
          .from('[data-hero]', { y: 24, opacity: 0, stagger: 0.1 });
        element.querySelectorAll('[data-reveal]').forEach(element => {
          gsap.from(element, {
            y: 28, opacity: 0, duration: 0.7, ease: 'power2.out',
            scrollTrigger: { trigger: element, start: 'top 92%', once: true },
          });
        });
        gsap.fromTo('.scroll-progress', { scaleX: 0 }, {
          scaleX: 1, ease: 'none', transformOrigin: 'left center',
          scrollTrigger: { trigger: element, start: 'top top', end: 'bottom bottom', scrub: true },
        });
        // Short, scroll-linked decorative movement. Never a recording waveform.
        if (window.matchMedia('(min-width: 800px)').matches) {
          gsap.fromTo('.story-ribbon-track', { x: 45 }, {
            x: -45, ease: 'none',
            scrollTrigger: { trigger: '.story-ribbon', start: 'top bottom', end: 'bottom top', scrub: 0.5 },
          });
        }
      }, element);
    }).catch(() => cleanup());
    return () => { disposed = true; cleanup(); };
  }, []);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    import('gsap').then(({ gsap }) => {
      if (disposed || !preview.current) return;
      const context = gsap.context(() => {
        gsap.from('[data-scene]', { opacity: 0, y: 12, duration: 0.35, ease: 'power2.out' });
      }, preview.current);
      cleanup = () => context.revert();
    }).catch(() => {});
    return () => { disposed = true; cleanup(); };
  }, [scene]);

  return <div className="flow-landing" ref={root}>
    <div className="scroll-progress" aria-hidden="true" />
    <section className="flow-hero">
      <span className="eyebrow" data-hero>SehatRelay · A voice-first handoff</span>
      <h1 data-hero>Every visit has a story.<br /><em>Let it be heard.</em></h1>
      <p className="hero-description" data-hero>From an ASHA worker’s words to a clinician’s next step.<br className="desktop-break" /> Document, review and refer — with the visit story close at hand.</p>
      <div className="actions" data-hero><button className="primary" disabled={busy} onClick={start}>Try the synthetic demo <ArrowUpRight size={17} /></button><a className="text-link" href="#how-it-works">Explore the handoff <ArrowRight size={16} /></a></div>
      <p className="microcopy" data-hero>Fictional patients. A complete workflow to explore. Built on CareFolio.</p>
      <div className="hero-marginalia" aria-hidden="true"><span>Speak. Check. Connect.</span><HeartHandshake size={24} /><span>A little care, carried forward.</span></div>
    </section>

    <div className="story-ribbon" aria-hidden="true"><div className="story-ribbon-track"><span>The visit story</span><ArrowRight size={21} /><span>Words worth checking</span><span className="ribbon-icon"><MessageSquareText size={23} /></span><span>A note, reviewed</span><ArrowRight size={21} /><span>A connected handoff</span></div></div>

    <section className="flow-chapter" id="how-it-works">
      <div className="chapter-topline"><span>Designed around the people in the handoff</span><span>ASHA worker <ArrowRight size={13} /> Clinician</span></div>
      <div className="teal-stage">
        <div className="centered-intro" data-reveal><span className="eyebrow">Keep the story connected</span><h2>Less friction.<br /><em>More room for care.</em></h2><p>A simple path from a fictional visit narrative to a reviewed referral.</p></div>
        <div className="walkthrough" data-reveal>
          <div className="walkthrough-tabs" aria-label="Synthetic handoff walkthrough">{scenes.map((s, i) => <button key={s.label} aria-pressed={scene === i} aria-controls="handoff-preview" onClick={() => setScene(i)}><span>0{i + 1}</span>{['Document the visit', 'Check the details', 'Send the referral'][i]}<ArrowUpRight size={18} /></button>)}</div>
          <div className="walkthrough-preview" id="handoff-preview" ref={preview}>
            <div className="demo-top"><span className="mini-brand"><HeartHandshake size={18} /> SehatRelay</span><span className="pill lavender">Scripted example</span></div>
            <div data-scene key={scene} aria-live="polite" aria-atomic="true"><span className="eyebrow">{item.label}</span><h3>{item.title}</h3><div className={'preview-note scene-' + scene}><Icon size={24} /><p>{item.quote}</p>{scene === 1 && <span className="pill amber">Needs review</span>}{scene === 2 && <span className="pill green"><Check size={12} /> Example acknowledgement</span>}</div><p className="preview-detail">{item.detail}</p></div>
            <div className="preview-footer"><span><span className="small-dot" /> Synthetic Tara-01</span><span>Example {scene + 1} of 3</span></div>
          </div>
        </div>
        <p className="chapter-caption">A preview of the workflow. No audio is recorded or played here.</p>
      </div>
    </section>

    <section id="sunosure" className="flow-editorial">
      <div className="editorial-copy" data-reveal><span className="eyebrow">SunoSure · Pause with purpose</span><h2>Some details<br />deserve a<br /><em>second look.</em></h2><p>Keep the original words beside the note. Inspect a source phrase, correct a field, or confirm that a detail was not provided.</p><p className="microcopy">SunoSure is a limited review aid, not medical validation. The worker and clinician remain responsible for verification.</p></div>
      <div className="evidence-composition" data-reveal><div className="source-slip"><span>Original narrative · fictional example</span><blockquote>“Patient ne thakan batayi.<br />Pregnancy 24 weeks hai.”</blockquote></div><div className="review-slip"><div className="sectionTitle"><ShieldCheck size={21} /><span className="pill amber">Needs review</span></div><h3>How long has it been?</h3><p>Symptom duration wasn’t documented in this example.</p><div className="unknown-field"><span>Symptom duration</span><strong>Not provided</strong></div><p className="microcopy"><Check size={14} /> Check the source. Confirm unknown when appropriate.</p></div><span className="composition-caption">A missing detail stays visible.<br />It never becomes an invented fact.</span></div>
    </section>

    <section id="for-workers" className="flow-handoff">
      <div data-reveal><span className="eyebrow">For workers. For clinicians.</span><h2>From “sent”<br />to <em>“seen.”</em></h2><p>The worker verifies and submits. The clinician reads and acknowledges. A timestamped timeline keeps the next step visible to both.</p><button className="primary" disabled={busy} onClick={start}>Explore the demo <ArrowUpRight size={17} /></button></div>
      <div className="handoff-paper" data-reveal><div className="sectionTitle"><FileText size={20} /><span className="pill">Illustrative journey</span></div><h3>Tara-01 → Demo PHC</h3><ol>{[['Reviewed by worker', 'Source and note checked'], ['Submitted to Demo PHC', 'Receiving facility entered by worker'], ['Acknowledged by clinician', 'Review note added to the timeline']].map(([title, detail]) => <li key={title}><span className="timeline-check"><Check size={13} /></span><strong>{title}</strong><small>{detail}</small></li>)}</ol></div>
    </section>

    <section className="flow-voice" data-reveal><span className="eyebrow">Start with the input that suits you</span><h2>Your words.<br /><em>Your way in.</em></h2><div className="voice-choices"><article><MessageSquareText size={28} /><h3>Use installed Wispr Flow</h3><p>Place the cursor in the narrative field and use your configured Flow shortcut or mobile keyboard. Review the inserted text.</p><a className="text-link" href="https://docs.wisprflow.ai/articles/6409258247-starting-your-first-dictation" target="_blank" rel="noreferrer">Flow setup guide <ArrowUpRight size={16} /></a></article><article><Keyboard size={28} /><h3>Type, paste, make it yours</h3><p>The same editable field works without a voice service. Hindi, English and Hinglish text stays in its original script.</p><button className="quiet" disabled={busy} onClick={start}>Open the workspace <ArrowRight size={16} /></button></article></div><p className="voice-limitation">CareFolio’s separate browser microphone and confirmed navigation mode are available across the app. The installed Flow option does not start Flow or give CareFolio access to its audio. Speech quality and language switching have not been tested here. The exact fictional example has predefined fields; other narratives use a manual template.</p></section>

    <section className="flow-faq" data-reveal><span className="eyebrow">A few things worth knowing</span><h2>Good <em>questions.</em></h2><div>{questions.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
    <section className="flow-final" data-reveal><span className="eyebrow">A story carried forward</span><h2>One visit.<br /><em>A connected next step.</em></h2><button className="primary" disabled={busy} onClick={start}>Try the synthetic demo <ArrowUpRight size={18} /></button><p>No API keys needed. Use fictional information only.</p><div className="final-orbit orbit-one" aria-hidden="true" /><div className="final-orbit orbit-two" aria-hidden="true" /></section>
    <div className="landing-signature" aria-hidden="true"><HeartHandshake />SehatRelay<span>VOICE. REVIEW. RELAY.</span></div>
  </div>;
}
