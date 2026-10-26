const $=s=>document.querySelector(s),box=$('#list'),M=$('#modal');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const modal=h=>{$('#mc').innerHTML=h;M.classList.remove('hide')},close=()=>M.classList.add('hide');$('#mx').onclick=close;
const info=(t,p)=>{modal(`<h2>${t}</h2><p>${p}</p><button class="pri" id="okb" style="margin-top:10px">OK</button>`);$('#okb').onclick=close};
const TRASH='<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>';
let comics=[]; // loaded once; edits update this list and redraw without refetching everything
const rank=c=>c.myTurn?0:c.status==='active'?1:2,sortC=()=>comics.sort((a,b)=>rank(a)-rank(b));
async function post(id,a,body){const r=await fetch(`/api/comics/${id}/${a}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});return{ok:r.ok,d:await r.json().catch(()=>({}))}}
function cardEl(c){const el=document.createElement('div');el.className='cc wob';el.dataset.id=c.id;let line='',btn='';
 if(c.status==='active'){const days=Math.floor((Date.now()-new Date(c.turn_started_at))/864e5);
  line=`Panel ${c.panel}/${c.total}${c.loop?` · Loop ${c.loop}/${c.loops}`:''} · ${c.myTurn?'waiting on you':'waiting on '+esc(c.waitingOn||'a player without an account')}${days>0?` (${days}d)`:''}`;
  if(c.myTurn)btn=`<button class="pri" data-a="join">Draw your panel</button>`;
  if(c.isCreator)btn+=`<button class="ybtn" data-a="resend">Resend link</button><button class="ybtn" data-a="skip">Skip player</button><button data-a="cancel">Cancel comic</button>`}
 else{line={done:'Finished',canceled:'Canceled',expired:'Timed out'}[c.status];btn=`<a class="ybtn" href="/comic/${c.id}">View comic</a>`+(c.isCreator?`<button class="del" data-a="delete" title="Delete comic" aria-label="Delete comic">${TRASH}</button>`:'')}
 el.innerHTML=`${c.myTurn?'<div class="turn">It’s your turn!</div>':''}<h2>${esc(c.title||(c.status==='active'?'Comic in progress':'Untitled comic'))}</h2><div class="mute">${line} · ${c.players} players</div><div class="row">${btn}</div>`;
 el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>({join:doJoin,resend:askResend,skip:askSkip,cancel:askCancel,delete:askDelete})[b.dataset.a](c.id));return el}
function renderAll(){if(!comics.length){box.innerHTML='<p>No comics yet. <a href="/">Start one</a>!</p>';return}
 sortC();const frag=document.createDocumentFragment();comics.forEach(c=>frag.append(cardEl(c)));box.replaceChildren(frag)}
async function refreshOne(id){const r=await fetch('/api/comics/'+id);if(!r.ok)return;const s=await r.json(),c=comics.find(x=>x.id===id);if(!c)return;
 if(s.status==='active')Object.assign(c,{panel:s.panel,total:s.total,loop:s.loop,loops:s.loops,waitingOn:s.waitingOn,turn_started_at:s.turnStartedAt});
 else Object.assign(c,{status:s.status,title:s.title??c.title});renderAll()}
// Cancel and delete assume success: the card updates instantly, the server catches up, and it is restored only if that fails.
async function removeOrCancel(id,a,body){const c=comics.find(x=>x.id===id),backup={...c},deleting=a==='delete'||body?.mode!=='notify';
 close();if(deleting)comics=comics.filter(x=>x.id!==id);else c.status='canceled';renderAll();
 const r=await post(id,a,body);
 if(!r.ok){if(deleting)comics.push(backup);else Object.assign(c,backup);renderAll();info('That didn’t work','The comic was put back. Please try again.')}}
function showLink(u,msg){modal(`<h2>Send this link</h2><p class="mute">${msg}</p><div class="row"><input type="text" id="lnk" readonly value="${esc(u)}"><button class="ybtn" id="copy">Copy link</button></div><button class="pri" id="okb" style="margin-top:12px">Done</button>`);
 $('#lnk').select();$('#copy').onclick=()=>{$('#lnk').select();try{navigator.clipboard.writeText(u)}catch(e){}$('#copy').textContent='Copied'};$('#okb').onclick=close}
async function doJoin(id){const b=document.querySelector(`[data-id="${id}"] [data-a="join"]`);if(b){b.disabled=true;b.textContent='Opening…'}
 const r=await post(id,'join');if(!r.ok){renderAll();return info('That didn’t work','Your turn may already be over. Try refreshing the page.')}location=r.d.link}
function askCancel(id){modal(`<h2>Cancel this comic?</h2>
 <label class="opt" style="display:block;background:#ffe8e0"><input type="radio" name="cm" value="delete" checked> <b>Cancel and delete</b><br><span class="mute">Removes the comic and every panel for good. Nobody is emailed.</span></label>
 <label class="opt" style="display:block;background:#e6efff"><input type="radio" name="cm" value="notify"> <b>Cancel and send what’s finished</b><br><span class="mute">Everyone logged in gets an email with a link to the unfinished comic.</span></label>
 <div class="row" style="margin-top:12px"><button id="no">Keep comic</button><button class="pri" id="yes">Cancel comic</button></div>`);
 $('#no').onclick=close;$('#yes').onclick=()=>removeOrCancel(id,'cancel',{mode:document.querySelector('input[name=cm]:checked').value})}
function askDelete(id){modal(`<h2>Delete this comic?</h2><p>This permanently removes the comic and all its panels for everyone. It can’t be undone.</p><div class="row" style="margin-top:12px"><button id="no">Keep it</button><button class="pri" id="yes">Delete</button></div>`);$('#no').onclick=close;$('#yes').onclick=()=>removeOrCancel(id,'delete')}
function askResend(id){modal(`<h2>Resend the link?</h2><p>The current player gets a fresh link and the old one stops working. If they have no account, you’ll get the new link to pass on yourself.</p><div class="row" style="margin-top:12px"><button id="no">Keep as is</button><button class="pri" id="yes">Resend</button></div>`);
 $('#no').onclick=close;$('#yes').onclick=async()=>{$('#yes').disabled=true;$('#yes').textContent='Sending…';const r=await post(id,'resend');
  if(!r.ok)return info('That didn’t work','Please try again.');
  r.d.link?showLink(r.d.link,'Send this to the current player. Their old link no longer works.'):info('Link sent','They’ve been emailed a fresh link. Their old one no longer works.')}}
function askSkip(id){modal(`<h2>Skip this player?</h2><p>Their link stops working and the comic gets one panel shorter. The next player takes over.</p><div class="row" style="margin-top:12px"><button id="no">Keep waiting</button><button class="pri" id="yes">Skip player</button></div>`);
 $('#no').onclick=close;$('#yes').onclick=async()=>{$('#yes').disabled=true;$('#yes').textContent='Skipping…';const r=await post(id,'skip');
  if(!r.ok)return info('That didn’t work','Please try again.');const d=r.d;
  if(d.done){sessionStorage.setItem('name:'+id,d.nameToken);location='/comic/'+id;return}
  if(d.canceled){const c=comics.find(x=>x.id===id);if(c)c.status='canceled';renderAll();return info('Comic canceled','Nobody had drawn anything yet, so there was nothing left to continue.')}
  d.link?showLink(d.link,'Send this to the next player.'):info('Player skipped','The next player has been emailed.');refreshOne(id)}}
(async()=>{const r=await fetch('/api/comics');
 if(r.status===401){box.innerHTML=`<p>Log in to see your comics.</p><a class="gbtn" href="/auth/login?next=/dashboard">${GI}Log in with Google</a>`;return}
 if(!r.ok){box.textContent='Couldn’t load your comics. Try refreshing.';return}
 comics=(await r.json()).comics;renderAll()})();
