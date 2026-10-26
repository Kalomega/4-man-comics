const $=s=>document.querySelector(s),box=$('#list'),M=$('#modal');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const modal=h=>{$('#mc').innerHTML=h;M.classList.remove('hide')},close=()=>M.classList.add('hide');$('#mx').onclick=close;
let comics=[]; // loaded once; edits update this list and redraw without refetching everything
const sortC=()=>comics.sort((a,b)=>(a.status==='active'?0:1)-(b.status==='active'?0:1));
function cardEl(c){const el=document.createElement('div');el.className='cc wob';el.dataset.id=c.id;let line='',btn='';
 if(c.status==='active'){const days=Math.floor((Date.now()-new Date(c.turn_started_at))/864e5);
  line=`Panel ${c.panel}/${c.total}${c.loop?` · Loop ${c.loop}/${c.loops}`:''} · waiting on ${esc(c.waitingOn||'a player without an account')}${days>0?` (${days}d)`:''}`;
  if(c.isCreator)btn=`<button class="ybtn" data-a="resend">Resend link</button><button class="ybtn" data-a="skip">Skip player</button><button data-a="cancel">Cancel comic</button>`}
 else{line={done:'Finished',canceled:'Canceled',expired:'Timed out'}[c.status];btn=`<a class="ybtn" href="/comic/${c.id}">View comic</a>`+(c.isCreator?`<button data-a="delete">Delete</button>`:'')}
 el.innerHTML=`<h2>${esc(c.title||(c.status==='active'?'Comic in progress':'Untitled comic'))}</h2><div class="mute">${line} · ${c.players} players</div><div class="row">${btn}</div>`;
 el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(c.id,b.dataset.a));return el}
function renderAll(){if(!comics.length){box.innerHTML='<p>No comics yet. <a href="/">Start one</a>!</p>';return}
 sortC();const frag=document.createDocumentFragment();comics.forEach(c=>frag.append(cardEl(c)));box.replaceChildren(frag)}
async function refreshOne(id){const r=await fetch('/api/comics/'+id);if(!r.ok)return;const s=await r.json(),c=comics.find(x=>x.id===id);if(!c)return;
 if(s.status==='active')Object.assign(c,{panel:s.panel,total:s.total,loop:s.loop,loops:s.loops,waitingOn:s.waitingOn,turn_started_at:s.turnStartedAt});
 else Object.assign(c,{status:s.status,title:s.title??c.title});renderAll()}
async function run(id,a,body){const r=await fetch(`/api/comics/${id}/${a}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}),d=await r.json().catch(()=>({}));close();
 if(!r.ok)return alert('That didn’t work: '+(d.error||r.status));
 if(d.deleted){comics=comics.filter(c=>c.id!==id);return renderAll()}
 if(d.done){sessionStorage.setItem('name:'+id,d.nameToken);location='/comic/'+id;return}
 if(d.link)prompt('Send this link to the next player:',d.link);else if(d.sent||d.nextHasAccount)alert('They’ve been emailed.');
 if(a==='cancel'){const c=comics.find(x=>x.id===id);if(c)c.status='canceled';renderAll()}
 else if(a==='skip')await refreshOne(id)}
function askCancel(id){modal(`<h2>Cancel this comic?</h2>
 <label class="opt" style="display:block;background:#ffe8e0"><input type="radio" name="cm" value="delete" checked> <b>Cancel and delete</b><br><span class="mute">Removes the comic and every panel for good. Nobody is emailed.</span></label>
 <label class="opt" style="display:block;background:#e6efff"><input type="radio" name="cm" value="notify"> <b>Cancel and send what’s finished</b><br><span class="mute">Everyone logged in gets an email with a link to the unfinished comic.</span></label>
 <div class="row" style="margin-top:12px"><button id="no">Keep comic</button><button class="pri" id="yes">Cancel comic</button></div>`);
 $('#no').onclick=close;$('#yes').onclick=()=>run(id,'cancel',{mode:document.querySelector('input[name=cm]:checked').value})}
function askDelete(id){modal(`<h2>Delete this comic?</h2><p>This permanently removes the comic and all its panels for everyone. It can’t be undone.</p><div class="row" style="margin-top:12px"><button id="no">Keep it</button><button class="pri" id="yes">Delete</button></div>`);$('#no').onclick=close;$('#yes').onclick=()=>run(id,'delete')}
function act(id,a){if(a==='cancel')return askCancel(id);if(a==='delete')return askDelete(id);
 if(a==='skip'&&!confirm('Skip the current player? Their link stops working and the comic gets one panel shorter.'))return;run(id,a)}
(async()=>{const r=await fetch('/api/comics');
 if(r.status===401){box.innerHTML=`<p>Log in to see your comics.</p><a class="gbtn" href="/auth/login?next=/dashboard">${GI}Log in with Google</a>`;return}
 if(!r.ok){box.textContent='Couldn’t load your comics. Try refreshing.';return}
 comics=(await r.json()).comics;renderAll()})();
