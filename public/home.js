const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let players=4,loops=0;const sv=JSON.parse(sessionStorage.getItem('setup')||'null');if(sv){players=sv.players;loops=sv.loops;$('#np').value=players}
[['0',0],['1',1],['2',2]].forEach(([t,v])=>{const b=document.createElement('button');b.textContent=t;b.className=v===loops?'on':'';b.onclick=()=>{loops=v;$$('#loops button').forEach(x=>x.classList.toggle('on',x===b));sum()};$('#loops').append(b)});
function sum(){players=+$('#np').value;$('#npv').textContent=players;const total=players*(loops+1);$('#sum').textContent=loops?`${total} panels, everyone draws ${loops===1?'twice':'three times'}`:`${total} panels`}
$('#np').oninput=sum;sum();$('#glogin').innerHTML=GI+'Log in with Google';
$('#go').onclick=async()=>{sessionStorage.setItem('setup',JSON.stringify({players,loops}));$('#go').disabled=true;
 const r=await fetch('/api/comics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({players,loops})});$('#go').disabled=false;
 if(r.status===401)return $('#loginbox').classList.remove('hide');if(!r.ok)return alert('Something went wrong. Please try again.');
 location='/play/'+(await r.json()).token};
