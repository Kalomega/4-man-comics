const $=s=>document.querySelector(s),box=$('#list');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function act(id,a){if(a==='skip'&&!confirm('Skip the current player? Their link stops working and the comic gets one panel shorter.'))return;if(a==='cancel'&&!confirm('Cancel this comic? Everyone attached is emailed what was finished.'))return;
 const r=await fetch(`/api/comics/${id}/${a}`,{method:'POST'}),d=await r.json().catch(()=>({}));if(!r.ok)return alert('That didn’t work: '+(d.error||r.status));
 if(d.link)prompt('Send this link to the next player:',d.link);else if(d.done){sessionStorage.setItem('name:'+id,d.nameToken);location='/comic/'+id;return}else if(d.sent||d.nextHasAccount)alert('They’ve been emailed.');load()}
async function load(){const me=(await (await fetch('/api/me')).json()).user;
 if(!me){box.innerHTML=`<p>Log in to see your comics.</p><a class="gbtn" href="/auth/login?next=/dashboard">${GI}Log in with Google</a>`;return}
 const {comics}=await (await fetch('/api/comics')).json();if(!comics.length){box.innerHTML='<p>No comics yet. <a href="/">Start one</a>!</p>';return}
 comics.sort((a,b)=>(a.status==='active'?0:1)-(b.status==='active'?0:1));box.innerHTML='';
 for(const c of comics){const el=document.createElement('div');el.className='cc wob';let line='',btn='';
  if(c.status==='active'){const s=await (await fetch('/api/comics/'+c.id)).json();const days=Math.floor((Date.now()-new Date(s.turnStartedAt))/864e5);
   line=`Panel ${s.panel}/${s.total}${s.loop?` · Loop ${s.loop}/${s.loops}`:''} · waiting on ${esc(s.waitingOn||'a player without an account')}${days>0?` (${days}d)`:''}`;
   if(c.isCreator)btn=`<button class="ybtn" data-a="resend">Resend link</button><button class="ybtn" data-a="skip">Skip player</button><button data-a="cancel">Cancel comic</button>`}
  else{line={done:'Finished',canceled:'Canceled',expired:'Timed out'}[c.status];btn=`<a class="ybtn" href="/comic/${c.id}">View comic</a>`}
  el.innerHTML=`<h2>${esc(c.title||(c.status==='active'?'Comic in progress':'Untitled comic'))}</h2><div class="mute">${line} · ${c.players} players</div><div class="row">${btn}</div>`;
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(c.id,b.dataset.a));box.append(el)}}
load();
