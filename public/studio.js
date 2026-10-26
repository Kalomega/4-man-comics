
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const IC={brush:'M4 20c3 0 5-1 5-4l8-8-3-3-8 8c-2 1-2 5-2 7zM14 5l2-2 5 5-2 2',eraser:'M5 14l8-9 7 7-6 7H8zM9 9l7 7M8 19h12',fill:'M4 12l8-8 8 8-8 8zM8 8l8 8M21 15c1 2 2 3 2 4a2 2 0 01-4 0c0-1 1-2 2-4z',line:'M4 20L20 4',rect:'M4 6h16v12H4z',ell:'M12 5c5 0 9 3 9 7s-4 7-9 7-9-3-9-7 4-7 9-7z',pipette:'M20 4a2.2 2.2 0 00-3 0l-3 3-1-1-2 2 1 1-8 8v3h3l8-8 1 1 2-2-1-1 3-3a2.2 2.2 0 000-3z',undo:'M9 14L4 9l5-5M4 9h9a6 6 0 010 12h-3',redo:'M15 14l5-5-5-5M20 9h-9a6 6 0 000 12h3',trash:'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',layers:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',x:'M5 5l14 14M19 5L5 19',eyeoff:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6zM3 3l18 18'};
$$('[data-i]').forEach(b=>b.innerHTML=`<svg viewBox="0 0 24 24"><path d="${IC[b.dataset.i]}"/></svg>`);
const cv=$('#cv'),ctx=cv.getContext('2d',{willReadFrequently:true});
let players=4,loops=0,total=4,panels=[],friend=[],tool='brush',color='#1d1d24',undo=[],redo=[],snap,start,last,drawing=false,pending,saved=false,loggedIn=false;

['#1d1d24','#6b6b78','#ffffff','#ff5a3c','#ff8a3c','#ffc233','#f5e14a','#3bb273','#1f7a4d','#2fc4d9','#2f6bff','#1a3d99','#8a4fff','#ff8fb1','#8b5a2b','#f2c9a0','#b5e48c'].forEach(c=>{const b=document.createElement('button');b.className='sw';b.style.background=c;b.dataset.c=c;b.setAttribute('aria-label','Color '+c);b.onclick=()=>setCol(c);$('#pal').append(b)});
function setCol(c){color=c;$$('.sw').forEach(s=>s.classList.toggle('sel',s.dataset.c===c));$('#col').classList.toggle('sel',!$$('.sw[data-c]').some(s=>s.dataset.c===c));dot()}
function dot(){const v=+$('#size').value,w=cv.getBoundingClientRect().width,sc=w?w/800:.75,px=Math.max(2,Math.min(46,v*sc))+'px';Object.assign($('#dotI').style,{width:px,height:px,background:tool==='eraser'?'#ccc':color})}
$('#col').onclick=picker;$('#size').oninput=dot;window.addEventListener('resize',dot);setCol(color);
$$('[data-t]').forEach(b=>b.onclick=()=>{tool=b.dataset.t;$$('[data-t]').forEach(x=>x.classList.toggle('on',x===b));dot()});

const clear=()=>ctx.clearRect(0,0,800,800);
const push=()=>{undo.push(ctx.getImageData(0,0,800,800));if(undo.length>30)undo.shift();redo=[]};
$('#undo').onclick=()=>{if(!undo.length)return;redo.push(ctx.getImageData(0,0,800,800));ctx.putImageData(undo.pop(),0,0)};
$('#redo').onclick=()=>{if(!redo.length)return;undo.push(ctx.getImageData(0,0,800,800));ctx.putImageData(redo.pop(),0,0)};
$('#clr').onclick=()=>{push();clear()};
const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*800/r.width,(e.clientY-r.top)*800/r.height]};
const eff=(d,i)=>{const a=d[i+3]/255;return[0,1,2].map(k=>Math.round(d[i+k]*a+255*(1-a)))};
const hex=c=>'#'+c.map(n=>n.toString(16).padStart(2,'0')).join('');
cv.onpointerdown=e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);const [x,y]=pt(e);
 if(tool==='eye'){setCol(hex(eff(ctx.getImageData(x|0,y|0,1,1).data,0)));return}
 push();if(tool==='fill'){fill(x|0,y|0);return}
 drawing=true;start=last=[x,y];snap=ctx.getImageData(0,0,800,800);if(tool==='brush'||tool==='eraser')stroke(last,last)};
cv.onpointermove=e=>{if(!drawing)return;const p=pt(e);if(tool==='brush'||tool==='eraser'){stroke(last,p);last=p}else{ctx.putImageData(snap,0,0);shape(start,p)}};
cv.onpointerup=cv.onpointercancel=()=>{drawing=false};
function style(){ctx.globalCompositeOperation=tool==='eraser'?'destination-out':'source-over';ctx.strokeStyle=color;ctx.lineWidth=+$('#size').value;ctx.lineCap=ctx.lineJoin='round'}
function stroke(a,b){style();ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke()}
function shape(a,b){style();ctx.beginPath();
 if(tool==='line'){ctx.moveTo(...a);ctx.lineTo(...b)}else if(tool==='rect')ctx.rect(a[0],a[1],b[0]-a[0],b[1]-a[1]);
 else ctx.ellipse((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(b[0]-a[0])/2,Math.abs(b[1]-a[1])/2,0,0,7);ctx.stroke()}
function fill(x,y){ctx.globalCompositeOperation='source-over';const id=ctx.getImageData(0,0,800,800),d=id.data,t=eff(d,(y*800+x)*4),h=color.slice(1).match(/../g).map(v=>parseInt(v,16));
 if(Math.abs(t[0]-h[0])+Math.abs(t[1]-h[1])+Math.abs(t[2]-h[2])<10)return;
 const seen=new Uint8Array(640000),st=[y*800+x];
 while(st.length){const p=st.pop();if(seen[p])continue;seen[p]=1;const i=p*4,e=eff(d,i);
  if(Math.abs(e[0]-t[0])+Math.abs(e[1]-t[1])+Math.abs(e[2]-t[2])>90)continue;
  d[i]=h[0];d[i+1]=h[1];d[i+2]=h[2];d[i+3]=255;const px=p%800;
  if(px>0)st.push(p-1);if(px<799)st.push(p+1);if(p>=800)st.push(p-800);if(p<639200)st.push(p+800)}
 ctx.putImageData(id,0,0)}
const exportPng=()=>{const c=document.createElement('canvas');c.width=c.height=800;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,800,800);x.drawImage(cv,0,0);return c.toDataURL('image/png')};

function tab(p){setTimeout(dot,0);$('#stage').classList.toggle('show-prev',p);$('#tPrev').classList.toggle('on',p);$('#tDraw').classList.toggle('on',!p)}
$('#tPrev').onclick=()=>tab(true);$('#tDraw').onclick=()=>tab(false);
function pickPrev(e){const im=$('#pimg'),m=matchMedia('(max-width:700px)').matches;if(!im.naturalWidth||(m?!pipOn:tool!=='eye'))return;const r=im.getBoundingClientRect(),c=document.createElement('canvas');c.width=c.height=800;const x=c.getContext('2d');x.drawImage(im,0,0,800,800);const d=x.getImageData(Math.min(799,(e.clientX-r.left)*800/r.width|0),Math.min(799,(e.clientY-r.top)*800/r.height|0),1,1).data;const hx=hex([d[0],d[1],d[2]]);setCol(hx);$('#bub').style.background=hx}
let pipOn=false;$('#pipBtn').onclick=()=>{pipOn=!pipOn;$('#pipBtn').classList.toggle('on',pipOn)};
$('#pimg').onclick=pickPrev;
const setEye=h=>{$('#hideBtn').innerHTML=`<svg viewBox="0 0 24 24"><path d="${IC[h?'eyeoff':'eye']}"/></svg>`;$('#hideBtn').title=h?'Show previous panel':'Hide previous panel'};
$('#hideBtn').onclick=()=>setEye($('#pcol').classList.toggle('hid'));
$('#trace').onclick=()=>{const on=$('#ov').style.display!=='block';$('#ov').style.display=on?'block':'none';$('#trace').classList.toggle('on',on)};


function modal(h,closable){$('#mc').innerHTML=h;$('#mx').classList.toggle('hide',!closable);$('#modal').classList.remove('hide')}
const close=()=>$('#modal').classList.add('hide');
$('#mx').onclick=close;
const GI='<span class="gi"><svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg></span>';
function picker(){let h=200,s=1,v=1;const hsv=(h,s,v)=>{const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return[f(5),f(3),f(1)].map(q=>Math.round(q*255))};
 modal(`<h2>Pick a color</h2><canvas id="sv" width="300" height="200" style="width:100%;touch-action:none;border:2px solid #1d1d24;border-radius:8px;display:block;margin-top:8px"></canvas><input id="hue" type="range" min="0" max="359" value="200" style="width:100%;margin-top:12px"><div class="row" style="margin-top:12px"><span id="pv" style="display:inline-block;width:34px;height:34px;border-radius:50%;border:2px solid #1d1d24"></span><button class="pri" id="usec">Use this color</button></div>`,true);
 const c=$('#sv'),x=c.getContext('2d');
 const draw=()=>{x.fillStyle='hsl('+h+',100%,50%)';x.fillRect(0,0,300,200);let g=x.createLinearGradient(0,0,300,0);g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,300,200);g=x.createLinearGradient(0,0,0,200);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,300,200);x.beginPath();x.arc(s*300,(1-v)*200,9,0,7);x.lineWidth=3;x.strokeStyle='#fff';x.stroke();x.lineWidth=1;x.strokeStyle='#000';x.stroke();$('#pv').style.background=hex(hsv(h,s,v))};
 const mv=e=>{const r=c.getBoundingClientRect();s=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));v=1-Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));draw()};
 c.onpointerdown=e=>{c.setPointerCapture(e.pointerId);c.dragging=1;mv(e)};c.onpointermove=e=>{if(c.dragging)mv(e)};c.onpointerup=()=>{c.dragging=0};
 $('#hue').oninput=e=>{h=+e.target.value;draw()};$('#usec').onclick=()=>{setCol(hex(hsv(h,s,v)));close()};draw()}

const token=location.pathname.split('/').pop();let info;
function turn(){clear();undo=[];redo=[];tab(false);const has=!!info.prevUrl;
 ['#pcol','#pbar','#tPrev','#trace'].forEach(s=>$(s).classList.toggle('hide',!has));
 setEye(false);pipOn=false;$('#pipBtn').classList.remove('on');$('#bub').style.background='';$('#ov').style.display='none';$('#trace').classList.remove('on');
 if(has){$('#pimg').crossOrigin=$('#ov').crossOrigin='anonymous';$('#pimg').src=$('#ov').src=info.prevUrl}
 $('#last').classList.toggle('hide',!info.isLast);
 $('#info').innerHTML=`<span class="pill">${players} players</span><span class="pill">${loops?'Loops '+(loops===1?'once':'twice'):'No loop'}</span>`;dot()}
$('#home').onclick=()=>{modal(`<h2>Leave this drawing?</h2><p>Your unsent drawing will be lost.</p><div class="row" style="margin-top:12px"><button id="stay">Keep drawing</button><button class="pri" id="leave">Leave</button></div>`,true);$('#stay').onclick=close;$('#leave').onclick=()=>{location='/'}};
async function submit(extra){const r=await fetch('/api/turn/'+token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({png:pending,...extra})});return{ok:r.ok,d:await r.json().catch(()=>({}))}}
const fail=d=>{$('#st')?($('#st').textContent=d.error==='invalid-or-used'?'This link was already used.':'Something went wrong. Please try again.'):modal('<h2>Couldn’t save</h2><p>Something went wrong. Please try again.</p>',true)};
function login(){try{sessionStorage.setItem('draft:'+token,cv.toDataURL())}catch(e){}location='/auth/login?next='+encodeURIComponent(location.pathname)}
let inflight=null,failed=false;
function markSaved(msg){$('#mx').classList.add('hide');$('#st').textContent=msg;$('#mc').insertAdjacentHTML('beforeend','<button class="pri" id="fin" style="margin-top:10px">Done</button>');
 $('#fin').onclick=async()=>{const b=$('#fin');b.disabled=true;b.textContent='Finishing…';try{await inflight}catch(e){}if(!failed)location='/'}}
async function sendNow(){const r=await submit({});if(!r.ok)return fail(r.d);const d=r.d;
 if(d.done){sessionStorage.setItem('name:'+d.comicId,d.nameToken);location='/comic/'+d.comicId;return}
 modal(`<h2>Panel sent!</h2><p>Your panel went to the next player’s account and they’ve been told it’s their turn. You’re all done.</p><button class="pri" id="fin" style="margin-top:10px">Done</button>`,false);$('#fin').onclick=()=>{location='/'}}
function mkToken(){const b=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function undoSaved(d){openShare();$('#st').textContent=d.error==='invalid-or-used'?'This turn was already submitted.':'That didn’t go through, so nothing was sent. Please try again.'}
function track(p){failed=false;inflight=p.then(r=>{if(!r.ok){failed=true;undoSaved(r.d)}return r});return inflight}
function openShare(){const tok=mkToken();let busy=false; // link is made now (not shown) so it can appear instantly on click
 modal(`<h2>Pass it on</h2><p class="mute">The next player isn’t added as a friend, so send them your panel to keep the comic going.</p>
 <div class="opt" style="background:#e6efff"><label style="margin-top:0">Send by email</label><div class="row"><input type="text" id="em" placeholder="friend@example.com"><button class="ybtn" id="send">Send</button></div><p class="mute" style="margin:6px 0 0">Emails are used once and never stored.</p></div>
 <div class="opt" style="background:#ffe8e0"><label style="margin-top:0">Or share a link</label><div class="row" id="lrow"><button class="ybtn" id="getlink">Create link and copy</button></div></div>
 <p class="mute" id="st"></p>${info.loggedIn?'':`<div class="lg"><span class="mute">Want the finished comic in your inbox?</span><button class="gbtn" id="g">${GI}Log in with Google</button></div>`}`,true);
 $('#send').onclick=()=>{if(busy)return;const e=$('#em').value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))return $('#st').textContent='Enter a valid email first.';
  busy=true;markSaved('Sent! The next player is being emailed.');track(submit({mode:'email',email:e}))};
 $('#getlink').onclick=()=>{if(busy)return;busy=true;const u=location.origin+'/play/'+tok;
  $('#lrow').innerHTML='<input type="text" id="lnk" readonly value="'+u+'"><button class="ybtn" id="copy">Copy link</button>';
  $('#copy').onclick=()=>{$('#lnk').select();try{navigator.clipboard.writeText(u)}catch(e){}};try{navigator.clipboard.writeText(u)}catch(e){}
  markSaved('Link created and copied. Send it to the next player.');track(submit({mode:'link',token:tok}))};
 if($('#g'))$('#g').onclick=login}
$('#done').onclick=()=>{pending=exportPng();(info.isLast||info.nextHasAccount)?sendNow():openShare()};
(async()=>{const r=await fetch('/api/turn/'+token);if(!r.ok){$('#err').classList.remove('hide');return}
 info=await r.json();players=info.players;loops=info.loops;$('#draw').classList.remove('hide');turn();
 const d=sessionStorage.getItem('draft:'+token);if(d){const i=new Image();i.onload=()=>{ctx.drawImage(i,0,0);sessionStorage.removeItem('draft:'+token)};i.src=d}
 if(!info.loggedIn){$('#loginSlot').innerHTML='<button class="gbtn" id="topLogin">'+GI+'Log in to get the finished comic</button>';$('#topLogin').onclick=login}})();
