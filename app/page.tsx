'use client';
import { useEffect, useRef, useState } from 'react';
import { createGame } from '../lib/game';
export default function Home() {
  const mount = useRef<HTMLDivElement>(null);
  const game = useRef<ReturnType<typeof createGame> | null>(null);
  const [hud, setHud] = useState({ mode: 'start', health: 100, score: 0, time: 0, enemies: 0, cooldown: 0 });
  const [error, setError] = useState('');
  useEffect(() => {
    try { game.current = createGame(mount.current!, setHud); }
    catch { setError('WebGL could not start. Enable hardware acceleration in your browser and reload.'); }
    return () => game.current?.dispose();
  }, []);
  const active = hud.mode === 'playing';
  return <main>
    <div ref={mount} className="world" aria-label="Neon Arena 3D game" />
    <header className="topbar"><div className="wordmark">N<span> / </span>A <small>NEON ARENA</small></div><div className="live"><i /> SURVIVAL PROTOCOL</div></header>
    <div className="hud"><div className="health"><label>HULL INTEGRITY <b>{Math.ceil(hud.health)}<small> / 100</small></b></label><div className="track"><div style={{width: `${hud.health}%`}} /></div></div><div className="stats"><div><label>SCORE</label><strong>{String(hud.score).padStart(5,'0')}</strong></div><div><label>TIME</label><strong>{Math.floor(hud.time/60)}:{String(Math.floor(hud.time%60)).padStart(2,'0')}</strong></div></div></div>
    {active && <><div className="reticle">·</div><div className="pulse"><span>{hud.cooldown > 0.05 ? 'RECHARGING' : 'PULSE READY'}</span><div className="track"><div style={{width: `${100*(1-hud.cooldown/0.65)}%`}} /></div></div></>}
    {(!active || error) && <div className="veil"><section className="menu">
      <div className="eyebrow">{hud.mode === 'over' ? 'RUN TERMINATED' : hud.mode === 'paused' ? 'SYSTEM ON HOLD' : '01 / THE SURVIVAL CIRCUIT'}</div>
      <h1>{hud.mode === 'over' ? <>SIGNAL<br/><em>LOST.</em></> : hud.mode === 'paused' ? <>ARENA<br/><em>PAUSED.</em></> : <>NEON<br/><em>ARENA.</em></>}</h1>
      <p>{error || (hud.mode === 'over' ? `You scored ${hud.score} points and survived ${Math.floor(hud.time)} seconds. Get back in there.` : hud.mode === 'paused' ? 'Take a breath. The arena can wait.' : 'One pilot. An endless swarm. Stay moving, find high ground, and unleash your pulse.')}</p>
      {!error && <button onClick={() => game.current?.start()}>{hud.mode === 'over' ? 'REBOOT & RETRY' : hud.mode === 'paused' ? 'RESUME RUN' : 'ENTER THE ARENA'} <span>?</span></button>}
      <div className="controls"><div><kbd>W A S D</kbd><span>Move</span></div><div><kbd>MOUSE</kbd><span>Look</span></div><div><kbd>SPACE</kbd><span>Jump</span></div><div><kbd>CLICK / F</kbd><span>Pulse attack</span></div></div>
      <small className="hint">Pulse hits nearby enemies in every direction. Two hits to defeat.<br/>Esc pauses · If mouse capture is unavailable, drag to look.</small>
    </section><div className="side-note">KEEP MOVING.<br/>KEEP YOUR SIGNAL.</div></div>}
    <footer><span><i/> SECTOR 07 <b> / </b> {hud.enemies} HOSTILES</span><span>WASD Move <b>·</b> Mouse Look <b>·</b> Space Jump <b>·</b> Click / F Pulse <b>·</b> Esc Pause</span></footer>
  </main>;
}

