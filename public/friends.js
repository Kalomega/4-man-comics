const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const modal=h=>{$('#mc').innerHTML=h;$('#modal').classList.remove('hide')},close=()=>$('#modal').classList.add('hide');$('#mx').onclick=close;
const info=(t,p)=>{modal(`<h2>${t}</h2><p>${p}</p><button class="pri" id="okb" style="margin-top:10px">OK</button>`);$('#okb').onclick=close};
let D={friends:[],incoming:[],outgoing:[]};
const who=p=>p.name?`<div><b>${esc(p.name)}</b><div class="mute">${esc(p.email)}</div></div>`:`<div><b>${esc(p.email)}</b></div>`;
function sec(title,list,btns,color){if(!list.length)return '';return `<div class="cc wob" style="background:${color}"><h2>${title}</h2>`+list.map(p=>`<div class="fr">${who(p)}<div class="row">${btns(p)}</div></div>`).join('')+'</div>'}
function render(){const b=(a,t,c='')=>p=>`<button class="${c}" data-a="${a}" data-id="${p.id}">${t}</button>`;
 D.friends.sort((x,y)=>(x.name||x.email).localeCompare(y.name||y.email));
 $('#lists').innerHTML=sec('Requests for you',D.incoming,p=>b('accept','Accept','ybtn')(p)+b('decline','Decline')(p),'#fff3b8')
  +sec('Your friends',D.friends,b('remove','Remove'),'#fff')
  +sec('Sent requests',D.outgoing,b('cancel','Cancel'),'#fff')
  +(D.friends.length||D.incoming.length||D.outgoing.length?'':'<p class="mute" style="margin-top:14px">No friends yet. Add someone above.</p>')}
$('#lists').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;b.dataset.a==='remove'?askRemove(b.dataset.id):mutate(b.dataset.a,b.dataset.id)};
async function mutate(a,id){const backup=JSON.parse(JSON.stringify(D)),p=[...D.incoming,...D.friends,...D.outgoing].find(x=>x.id===id);close();
 if(a==='accept'){D.incoming=D.incoming.filter(x=>x.id!==id);D.friends.push(p)}
 else if(a==='decline')D.incoming=D.incoming.filter(x=>x.id!==id);else if(a==='cancel')D.outgoing=D.outgoing.filter(x=>x.id!==id);else D.friends=D.friends.filter(x=>x.id!==id);
 render(); // assume success; undo only if the server says no
 const r=await fetch('/api/friends/'+a,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
 if(!r.ok){D=backup;render();info('That didn’t work','Please try again.')}}
function askRemove(id){const p=D.friends.find(x=>x.id===id);modal(`<h2>Remove friend?</h2><p>${esc(p.name||p.email)} will no longer be added to your comics automatically. Comics already in progress aren’t affected.</p><div class="row" style="margin-top:12px"><button id="no">Keep</button><button class="pri" id="yes">Remove</button></div>`);$('#no').onclick=close;$('#yes').onclick=()=>mutate('remove',id)}
const say=t=>{$('#msg').textContent=t};
$('#add').onclick=async()=>{const e=$('#em').value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))return say('Enter a valid email address.');
 say('Sending…');const r=await fetch('/api/friends',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e})});
 if(!r.ok)return say(r.status===401?'Log in first.':'That didn’t go through. Please try again.');
 const {status}=await r.json();
 say({sent:'Request sent to '+e+'.',accepted:'They had already asked you, so you’re now friends.',friends:'You’re already friends.',pending:'You already sent them a request.',self:'That’s your own email address.','not-found':'No account uses that email address, so no request was sent.'}[status]||'Done.');
 if(status==='sent'||status==='accepted')$('#em').value='';load()};
async function load(){const r=await fetch('/api/friends');
 if(r.status===401){$('#lists').innerHTML=`<p>Log in to manage your friends.</p><a class="gbtn" href="/auth/login?next=/friends">${GI}Log in with Google</a>`;return}
 if(!r.ok){$('#lists').textContent='Couldn’t load friends. Try refreshing.';return}D=await r.json();render()}
load();
