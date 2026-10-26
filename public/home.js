const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let players=4,loops=0;const sv=JSON.parse(sessionStorage.getItem('setup')||'null');if(sv){players=sv.players;loops=sv.loops;$('#np').value=players}
[['0',0],['1',1],['2',2]].forEach(([t,v])=>{const b=document.createElement('button');b.textContent=t;b.className=v===loops?'on':'';b.onclick=()=>{loops=v;$$('#loops button').forEach(x=>x.classList.toggle('on',x===b));sum()};$('#loops').append(b)});
function sum(){players=+$('#np').value;$('#npv').textContent=players;const total=players*(loops+1);$('#sum').textContent=loops?`${total} panels, everyone draws ${loops===1?'twice':'three times'}`:`${total} panels`}
$('#np').oninput=sum;sum();$('#glogin').innerHTML=GI+'Log in with Google';
$('#go').onclick=async()=>{sessionStorage.setItem('setup',JSON.stringify({players,loops}));$('#go').disabled=true;
 const r=await fetch('/api/comics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({players,loops,friends:sel})});$('#go').disabled=false;
 if(r.status===401)return $('#loginbox').classList.remove('hide');if(!r.ok)return alert('Something went wrong. Please try again.');
 location='/play/'+(await r.json()).token};

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let FR=null,sel={}; // sel: player index -> friend's user id
function slots(){const box=$('#fslots');box.innerHTML='';const used=new Set(Object.values(sel));
 for(let i=1;i<players;i++){const l=document.createElement('label');l.className='fs';l.append('Player '+(i+1));const s=document.createElement('select');
  s.innerHTML='<option value="">Link or email</option>'+FR.map(f=>`<option value="${f.id}"${f.id===sel[i]?' selected':''}${used.has(f.id)&&f.id!==sel[i]?' disabled':''}>${esc(f.name||f.email)}</option>`).join('');
  s.onchange=()=>{if(s.value)sel[i]=s.value;else delete sel[i];slots()};l.append(s);box.append(l)}}
$('#np').addEventListener('input',()=>{for(const k in sel)if(+k>=players)delete sel[k];if(FR&&FR.length)slots()});
(async()=>{const r=await fetch('/api/friends'),h=$('#fhint');$('#fwrap').classList.remove('hide');
 if(r.status===401){h.textContent='Log in to pick friends who get their turns automatically.';return}
 if(!r.ok){$('#fwrap').classList.add('hide');return}
 FR=(await r.json()).friends;
 if(!FR.length){h.innerHTML='No friends yet. <a href="/friends">Add some</a> to have turns sent automatically.';return}
 h.textContent='Friends you pick get their turn automatically. Everyone else gets a link or email from the person before them.';slots()})();
