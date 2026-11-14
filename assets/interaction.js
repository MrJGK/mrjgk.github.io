(() => {
'use strict';
const root=document.documentElement,reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),fine=window.matchMedia('(hover: hover) and (pointer: fine)');
const paused=()=>reduced.matches||root.classList.contains('motion-paused');
const blurTargets=Array.from(document.querySelectorAll('.hero-copy,.github-profile,.section-title,.project-shell,.about-title,.about-copy,.connect-intro,.contact-shell,.case-section'));
blurTargets.forEach(node=>node.setAttribute('data-scroll-blur',''));
let lastY=window.scrollY||0,scrollFrame=0,pointerFrame=0,pointerX=innerWidth*.72,pointerY=innerHeight*.2,pendingX=pointerX,pendingY=pointerY;
function paintPointer(){pointerFrame=0;if(paused()||!fine.matches)return;pointerX+=(pendingX-pointerX)*.16;pointerY+=(pendingY-pointerY)*.16;root.style.setProperty('--pointer-x',pointerX.toFixed(1)+'px');root.style.setProperty('--pointer-y',pointerY.toFixed(1)+'px');if(Math.abs(pendingX-pointerX)>.5||Math.abs(pendingY-pointerY)>.5)pointerFrame=requestAnimationFrame(paintPointer)}
window.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||paused()||!fine.matches)return;pendingX=event.clientX;pendingY=event.clientY;if(!pointerFrame)pointerFrame=requestAnimationFrame(paintPointer)},{passive:true});
function paintScroll(){scrollFrame=0;const y=window.scrollY||0,speed=Math.min(Math.abs(y-lastY)*.035,1.05);lastY=y;const amount=paused()?0:speed;blurTargets.forEach(node=>node.style.setProperty('--scroll-blur',amount.toFixed(2)+'px'));if(amount>0)window.setTimeout(()=>{if(!paused())blurTargets.forEach(node=>node.style.setProperty('--scroll-blur','0px'))},100)}
window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll)},{passive:true});
document.addEventListener('click',event=>{
 if(paused()||!fine.matches)return;
 const wave=document.createElement('span');
 wave.className='page-click-wave';
 wave.setAttribute('aria-hidden','true');
 wave.style.left=event.clientX+'px';
 wave.style.top=event.clientY+'px';
 document.body.appendChild(wave);
 wave.addEventListener('animationend',()=>wave.remove(),{once:true});
});
document.addEventListener('site:motion-change',()=>{if(paused()){root.style.setProperty('--pointer-x','50%');root.style.setProperty('--pointer-y','20%');blurTargets.forEach(node=>node.style.setProperty('--scroll-blur','0px'))}});
if(typeof reduced.addEventListener==='function')reduced.addEventListener('change',()=>{if(paused())blurTargets.forEach(node=>node.style.setProperty('--scroll-blur','0px'))});
})();