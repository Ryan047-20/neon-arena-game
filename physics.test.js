import test from 'node:test';
import assert from 'node:assert/strict';
import {moveBody,pulseHits} from './lib/physics.js';
const body=(props={})=>({x:0,y:0,z:0,vy:0,r:.48,grounded:true,...props});
test('gravity lands the player on the arena floor',()=>{const p=body({y:4});for(let i=0;i<120;i++)moveBody(p,0,0,1/60);assert.equal(p.y,0);assert.equal(p.grounded,true);});
test('jump clears low platforms and lands on top',()=>{const p=body({x:-6,z:-1.4,vy:9});let peak=0;for(let i=0;i<90;i++){moveBody(p,0,i<25?-.08:0,1/60);peak=Math.max(peak,p.y);}assert.ok(peak>1.4);assert.equal(p.y,1.4);assert.equal(p.grounded,true);});
test('obstacles block walking and arena bounds contain the player',()=>{const p=body({x:-6,z:-1});for(let i=0;i<60;i++)moveBody(p,0,-.1,1/60);assert.ok(p.z>=-1.52);const q=body();for(let i=0;i<500;i++)moveBody(q,.1,0,1/60);assert.equal(q.x,16.3);});
test('walking off a platform falls to the floor',()=>{const p=body({x:-6,z:-4,y:1.4});for(let i=0;i<100;i++)moveBody(p,.1,0,1/60);assert.equal(p.y,0);});
test('pulse respects horizontal range and elevation',()=>{const p=body();assert.ok(pulseHits(p,body({x:3})));assert.ok(!pulseHits(p,body({x:5})));assert.ok(!pulseHits(p,body({y:3})));});

