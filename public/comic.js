const $=s=>document.querySelector(s),id=location.pathname.split('/').pop();
async function compose(urls,title){const n=urls.length,c=n<=3||n===5?n:n===4?2:n<=10?Math.ceil(n/2):Math.ceil(Math.sqrt(n)),r=Math.ceil(n/c),P=600,G=28,H=title?130:G,k=document.createElement('canvas');k.width=G+c*(P+G);k.height=H+r*(P+G);
 const x=k.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,k.width,k.height);try{await document.fonts.load("80px 'Caveat Brush'")}catch(e){}
 if(title){x.fillStyle='#1d1d24';x.textAlign='center';x.font="84px 'Caveat Brush',cursive";x.fillText(title,k.width/2,92,k.width-2*G)}
 const imgs=await Promise.all(urls.map(u=>new Promise(res=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.src=u})));
 imgs.forEach((i,j)=>{const px=G+(j%c)*(P+G),py=H+Math.floor(j/c)*(P+G);x.drawImage(i,px,py,P,P);x.lineWidth=6;x.strokeStyle='#1d1d24';x.strokeRect(px-3,py-3,P+6,P+6)});
 return k.toDataURL('image/png')}
(async()=>{try{const r=await fetch('/api/comics/'+id),d=await r.json();
 if(!r.ok||d.status==='active'){$('#msg').classList.remove('hide');$('#msg').innerHTML=d.status==='active'?`<h2>Still in progress</h2><p>Panel ${d.panel} of ${d.total}${d.loop?`, loop ${d.loop} of ${d.loops}`:''}${d.waitingOn?`, waiting on ${d.waitingOn}`:''}.</p>`:'<h2>Comic not available</h2><p>This comic is still in progress or the link is wrong. Log in to see its status if you’re part of it.</p>';return}
 let title=d.title;const nt=sessionStorage.getItem('name:'+id);
 if(d.status!=='done'){$('#msg').classList.remove('hide');$('#msg').innerHTML='<p><b>This comic ended early</b> ('+(d.status==='canceled'?'canceled by its creator':'a turn took too long')+'). Here’s what was finished.</p>'}
 if(!d.panels.length){$('#msg').classList.remove('hide');$('#msg').innerHTML='<p>No panels were finished.</p>';return}
 const render=async()=>{const u=await compose(d.panels,title),im=$('#comic');im.src=u;try{await im.decode()}catch(e){}im.classList.remove('hide');$('#dl').href=u;$('#dl').download=(title||'comic')+'.png';$('#acts').classList.remove('hide')};
 if(d.status==='done'&&!title&&nt){$('#namer').classList.remove('hide');$('#fin').onclick=async()=>{const t=$('#ttl').value.trim();const rr=await fetch(`/api/comics/${id}/name`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nameToken:nt,title:t})});if(rr.ok){title=(await rr.json()).title;sessionStorage.removeItem('name:'+id);$('#namer').classList.add('hide');render()}}}
 $('#copyl').onclick=()=>{try{navigator.clipboard.writeText(location.href)}catch(e){};$('#copyl').textContent='Link copied'};
 await render()}finally{const sp=$('#spin');if(sp)sp.remove()}})();
