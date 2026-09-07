export const obstacles = [
  {x:-6,z:-4,w:4,d:4,h:1.4}, {x:6,z:4,w:4,d:4,h:1.4},
  {x:6,z:-7,w:3,d:3,h:2.5}, {x:-7,z:7,w:3,d:3,h:2.5},
  {x:0,z:-10,w:5,d:2,h:0.65}, {x:0,z:10,w:5,d:2,h:0.65},
];
export function moveBody(body, dx, dz, dt) {
  const oldY=body.y;
  body.vy-=22*dt;
  body.y+=body.vy*dt;
  for(const axis of ['x','z']) {
    body[axis]+=axis==='x'?dx:dz;
    body[axis]=Math.max(-16.3,Math.min(16.3,body[axis]));
    for(const o of obstacles) {
      if(body.y>=o.h-0.02 || oldY>=o.h && body.vy<=0) continue;
      if(Math.abs(body.x-o.x)<o.w/2+body.r && Math.abs(body.z-o.z)<o.d/2+body.r) {
        const center=axis==='x'?o.x:o.z, half=(axis==='x'?o.w:o.d)/2;
        body[axis]=center+(body[axis]<center?-1:1)*(half+body.r);
      }
    }
  }
  let floor=0;
  for(const o of obstacles) if(Math.abs(body.x-o.x)<o.w/2+body.r*.65 && Math.abs(body.z-o.z)<o.d/2+body.r*.65 && oldY>=o.h-0.04) floor=Math.max(floor,o.h);
  body.grounded=body.y<=floor && body.vy<=0;
  if(body.grounded){body.y=floor;body.vy=0;}
}
export function pulseHits(player,enemy) {return Math.hypot(player.x-enemy.x,player.z-enemy.z)<4.2 && Math.abs(player.y-enemy.y)<2.5;}

