(function(){
var KEY="libro3d.v1",S={books:[],cur:null,fs:16},book,s=0,bookEl=document.getElementById("book"),M=document.getElementById("measure");
function load(){try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);if(d&&d.books&&d.books.length){S=d;if(!S.fmt){S.books.forEach(function(b){b.pages=b.pages.map(esc)});S.fmt=2}}}}catch(e){}
 if(!S.books.length){S.books=[mk("Il mio primo libro")];S.cur=S.books[0].id}shFix()}
var cloud=null,uid=null,dirty={},timer=null,quiet=0;
function status(t){var e=document.getElementById("st");if(e)e.textContent=t}
function hm(){return new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"})}
var svT=0,svPend=0,pgOnly=0;
function persistLocal(){svPend=0;try{S.fmt=2;localStorage.setItem(KEY,JSON.stringify(S));status("Salvato alle "+hm()+(cloud?", anche online":", su questo dispositivo"))}catch(e){status("Salvataggio locale non riuscito")}}
function save(){var po=pgOnly;pgOnly=0;if(!po)hlSoon();var q=quiet;quiet=0;if(!q&&book){book.u=Date.now();dirty[book.id]=1}
 if(book&&book.pages.length>120){svPend=1;clearTimeout(svT);svT=setTimeout(persistLocal,po?1200:500)}else persistLocal();
 if(cloud&&!q){clearTimeout(timer);timer=setTimeout(push,1500)}}
window.addEventListener("pagehide",function(){if(svPend)persistLocal()});document.addEventListener("visibilitychange",function(){if(document.hidden&&svPend)persistLocal()});
async function push(){if(!cloud)return;var ids=Object.keys(dirty);dirty={};var ok=true;
 for(var k=0;k<ids.length;k++){var id=ids[k],b=S.books.filter(function(x){return x.id===id})[0];if(!b)continue;
  try{await cloud.doc("b_"+id).set({title:b.title||"",pages:b.pages,h:2,bm:b.bm==null?-1:b.bm,pg:b.pg||0,tabs:b.tabs||[],cards:b.cards||[],u:b.u||Date.now(),sh:shNm(shId(b))})}catch(e){ok=false;dirty[id]=1}}
 status(ok?"Salvato alle "+hm()+", anche online":"Salvato qui, online non riuscito")}
async function saveFile(name,data){try{var dl=await claude.use("downloads");if(dl){await dl.save({filename:name,data:data});return}}catch(e){if(e&&e.code==="declined")return}
 try{await navigator.clipboard.writeText(data);alert("Download non disponibile: contenuto copiato negli appunti")}catch(_){alert("Download non disponibile in questa vista")}}
function hasText(b){return b.pages.some(Boolean)}
async function cloudInit(){try{if(!window.claude||!claude.use)return;var db=await claude.use("db"),us=await claude.use("user");if(!db||!us)return;uid=await us.id();if(!uid)return;
 var col=db.collection("data/users/"+uid),snap=await col.get(),seen={},ch=false;
 snap.docs.forEach(function(d){var v=d.data();if(!v||!Array.isArray(v.pages))return;var id=d.id.slice(2);seen[id]=1;var l=S.books.filter(function(x){return x.id===id})[0];
  if(!l){S.books.push({id:id,title:v.title||"",pages:cp(v),bm:v.bm>=0?v.bm:undefined,pg:v.pg||0,tabs:v.tabs||[],cards:v.cards||[],u:v.u||0,sh:v.sh?shByName(v.sh):undefined});ch=true}
  else if((v.u||0)>(l.u||0)){l.title=v.title||"";l.pages=cp(v);l.bm=v.bm>=0?v.bm:undefined;l.pg=v.pg||0;l.tabs=v.tabs||[];l.cards=v.cards||[];l.lay=0;l.u=v.u;if(v.sh)l.sh=shByName(v.sh);ch=true}
  else if((l.u||0)>(v.u||0))dirty[id]=1});
 S.books.forEach(function(b){if(!seen[b.id]&&(b.u||hasText(b)))dirty[b.id]=1});
 cloud=col;
 if(ch){var a=document.activeElement;if(!(a&&a.classList&&a.classList.contains("txt"))){S.books=S.books.filter(function(b){return hasText(b)||b.u||S.books.length===1||b.id===S.cur});book=cb();reflowAll();render();buildHome()}}
 try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
 status("Sincronizzazione online attiva");if(Object.keys(dirty).length)push()}catch(e){}}
function mk(t){return{id:"b"+Date.now()+Math.floor(Math.random()*999),title:t,pages:["",""]}}
function cb(){return S.books.filter(function(b){return b.id===S.cur})[0]||S.books[0]}
var PW=380,PH=520,SC=1;
function size(){hlSync();document.documentElement.style.setProperty("--fr",(dock()?284:16)+"px");var w=window.innerWidth,av=w-(dock()?284:0),h=window.innerHeight-130;
 var k=Math.min(1,(w-56)/(2*380),h/520*0.92);PW=Math.floor(380*Math.max(k,.55));PH=Math.floor(PW*520/380);
 if(w<500){PW=Math.floor((w-48)/2);PH=Math.floor(PW*1.38)}
 SC=dock()?Math.max(.5,Math.min(1,(av-56)/(2*PW))):1;bookEl.style.transform="rotateX(14deg) scale("+SC+")";document.documentElement.style.setProperty("--sc",SC);
 document.documentElement.style.setProperty("--pw",PW+"px");document.documentElement.style.setProperty("--ph",PH+"px");
 document.documentElement.style.setProperty("--fs",S.fs+"px");
 M.style.width=PW+"px";M.style.height=PH+"px";M.style.fontSize=S.fs+"px";M.style.paddingBottom="34px"}
/* divide il testo: parte che entra nella pagina + resto */
function fitOld(t){M.textContent=t;if(M.scrollHeight<=M.clientHeight+1)return[t,""];
 var lo=0,hi=t.length;while(lo<hi){var mid=Math.ceil((lo+hi)/2);M.textContent=t.slice(0,mid);if(M.scrollHeight<=M.clientHeight+1)lo=mid;else hi=mid-1}
 var cut=lo,sp=Math.max(t.lastIndexOf(" ",cut),t.lastIndexOf("\n",cut));if(sp>cut*0.6)cut=sp+1;
 return[t.slice(0,cut),t.slice(cut)]}
function cascade(i,c){var pg=book.pages;
 while(i<pg.length){var r=fit(pg[i]);if(!r[1])break;
  pg[i]=r[0];
  if(i+1>=pg.length)pg.push("");
  pg[i+1]=jn(r[1],pg[i+1]);
  var L=tlen(r[0]);if(c>L){c-=L;i++}else{c=Math.min(c,L);/* resta qui, ma continua a distribuire */
   var j=i+1;while(j<pg.length){var q=fit(pg[j]);if(!q[1])break;pg[j]=q[0];if(j+1>=pg.length)pg.push("");pg[j+1]=jn(q[1],pg[j+1]);j++}
   break}}
 return[i,c]}
function reflowAll(){quiet=1;size();var pg=book.pages,k=0;for(var i=0;i<pg.length;i++){var r=fit(pg[i]);if(r[1]){pg[i]=r[0];if(i+1>=pg.length)pg.push("");pg[i+1]=jn(r[1],pg[i+1])}}
 book.lay=sigNow();save()}
function sigNow(){return PW+"x"+PH+"@"+S.fs}
function nSp(){return Math.max(1,Math.ceil(book.pages.length/2))}function nLeaves(){return nSp()+1}
function render(){if(tts.on)stopSpeak();bookEl.innerHTML="";bookEl.style.setProperty("--cc",bookColor(book));var pg=book.pages;if(pg.length%2)pg.push("");var n=nLeaves();if(s>nSp()-1)s=nSp()-1;
 var rb0=document.createElement("div");rb0.className="rib";rb0.id="rib";rb0.innerHTML="<i></i>";bookEl.appendChild(rb0);pos();fcUI();document.getElementById("title").value=book.title;
}
function mkLeaf(i,n){var lf=document.createElement("div");lf.className="leaf"+(i<=s?" f":"");lf.style.zIndex=i<=s?i:(n-i);lf.dataset.i=i;lf.appendChild(face(2*i-1,"front",i===0));lf.appendChild(face(2*i,"back",i===n-1));return lf}
/* nel DOM restano solo i fogli vicini alla pagina corrente: i libri grandi restano veloci */
function ensureWin(){var n=nLeaves(),lo=Math.max(0,s-4),hi=Math.min(n-1,s+6),have={},ch=0,ls=bookEl.querySelectorAll(".leaf");
 for(var k=0;k<ls.length;k++){var i=+ls[k].dataset.i;if(i<lo||i>hi){bookEl.removeChild(ls[k]);ch=1}else have[i]=1}
 for(var j=lo;j<=hi;j++)if(!have[j]){bookEl.appendChild(mkLeaf(j,n));ch=1}
 if(ch)redrawTabs()}
function leafFor(li){var ls=bookEl.querySelectorAll(".leaf"),best=null,bd=1e9;for(var k=0;k<ls.length;k++){var d=Math.abs(+ls[k].dataset.i-li);if(d<bd){bd=d;best=ls[k]}}return best||bookEl}
function face(p,side,cover){var f=document.createElement("div");f.className="face "+side;if(cover){f.classList.add("cover");if(p<0){var ct=document.createElement("div");ct.className="ctt";ct.textContent=book.title||"Senza titolo";f.appendChild(ct)}return f}
 if(p<0||p>=book.pages.length){f.classList.add("blank");return f}
 var t=document.createElement("div");t.className="txt";t.contentEditable="true";t.spellcheck=false;t.dataset.p=p;t.dataset.ph="Scrivi o incolla qui…";t.innerHTML=book.pages[p];
 t.addEventListener("input",function(){onEdit(t)});
 t.addEventListener("paste",function(e){e.preventDefault();var cd=e.clipboardData||window.clipboardData,h=cd.getData("text/html"),tx=cd.getData("text/plain");if(h){var c=cleanHtml(h);if(c){document.execCommand("insertHTML",false,c);return}}document.execCommand("insertText",false,tx)});
 f.appendChild(t);var nm=document.createElement("div");nm.className="num";nm.textContent=(p+1);f.appendChild(nm);return f}
function caret(el){var sl=getSelection();if(!sl.rangeCount)return el.innerText.length;var r=sl.getRangeAt(0).cloneRange();r.selectNodeContents(el);r.setEnd(sl.getRangeAt(0).endContainer,sl.getRangeAt(0).endOffset);return r.toString().length}
function setCaret(el,off){el.focus();var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n,rem=off,last=null;
 while((n=w.nextNode())){last=n;if(rem<=n.length){var r=document.createRange();r.setStart(n,rem);r.collapse(true);var sl=getSelection();sl.removeAllRanges();sl.addRange(r);return}rem-=n.length}
 var r2=document.createRange();r2.selectNodeContents(el);r2.collapse(false);var s2=getSelection();s2.removeAllRanges();s2.addRange(r2)}
function onEdit(el){var p=+el.dataset.p,txt=el.innerHTML;if(txt==="<br>"){txt="";el.innerHTML=""}book.pages[p]=txt;
 var c=caret(el),before=book.pages.length,res=cascade(p,c),ti=res[0],tc=res[1];
 for(var i=p;i<book.pages.length&&i<p+16;i++){var e=bookEl.querySelector('.txt[data-p="'+i+'"]');if(e&&e!==el&&e.innerHTML!==book.pages[i])e.innerHTML=book.pages[i]}
 if(book.pages[p]!==txt){el.innerHTML=book.pages[p]}
 if(book.pages.length!==before){var keep=ti,kc=tc;render();var tgt=pageSpread(ti);if(tgt!==s){s=tgt;pos()}setTimeout(function(){var e2=bookEl.querySelector('.txt[data-p="'+keep+'"]');if(e2)setCaret(e2,kc)},50);save();return}
 if(ti!==p){var s2=pageSpread(ti);if(s2!==s){s=s2;pos()}var e3=bookEl.querySelector('.txt[data-p="'+ti+'"]');setTimeout(function(){if(e3)setCaret(e3,tc)},s2!==s?50:0)}
 else if(book.pages[p]!==txt)setCaret(el,tc);
 save()}
function pageSpread(p){return Math.floor(p/2)}
function pos(){var n=nLeaves();ensureWin();var ls=bookEl.querySelectorAll(".leaf");
 for(var i=0;i<ls.length;i++){var li=+ls[i].dataset.i,f=li<=s;ls[i].classList.toggle("f",f);ls[i].style.zIndex=f?li:(n-li);
  ls[i].style.pointerEvents="auto"}
 bookEl.style.transform="rotateX(14deg) scale("+SC+")";
 var rb=document.getElementById("rib");if(book.bm!=null&&book.bm>nSp()-1)book.bm=nSp()-1;
 if(rb)rb.classList.toggle("on",book.bm===s);if(!noPg&&!reader.hidden&&s>=0&&book.pg!==s){book.pg=s;pgOnly=1;quiet=1;save()}
 var bb=document.getElementById("bm");if(bb)bb.classList.toggle("on",book.bm===s);var gb=document.getElementById("gobm");if(gb)gb.disabled=book.bm==null||book.bm===s;
 var tot=book.pages.length;
 document.getElementById("info").textContent=""+(2*s+1)+"–"+(2*s+2)+" / "+tot;
 document.getElementById("prev").disabled=s<=0;document.getElementById("next").disabled=s>=nSp()-1;var al=document.getElementById("arL"),ar=document.getElementById("arR");if(al){al.disabled=s<=0;ar.disabled=s>=nSp()-1}tabsUI()}
function go(d){var n=nSp();s=Math.max(0,Math.min(n-1,s+d));pos()}
function visiblePage(){var a=document.activeElement;if(a&&a.dataset&&a.dataset.p!==undefined)return+a.dataset.p;return Math.min(book.pages.length-1,2*s)}
document.getElementById("prev").onclick=function(){go(-1)};
document.getElementById("next").onclick=function(){go(1)};
document.getElementById("addp").onclick=function(){if(book.pages.length%2)book.pages.push("");book.pages.push("","");save();render();void bookEl.offsetWidth;s=pageSpread(book.pages.length-2);pos();
 setTimeout(function(){var e=bookEl.querySelector('.txt[data-p="'+(book.pages.length-2)+'"]');if(e)e.focus()},900)};
document.getElementById("delp").onclick=function(){if(book.pages.length<=2)return;var p=visiblePage();if(!confirm("Eliminare la pagina "+(p+1)+"?"))return;book.pages.splice(p,1);if(book.pages.length%2)book.pages.push("");save();render()};
function newBook(sh){var t=prompt("Titolo del nuovo libro:","Nuovo documento");if(t===null)return;var b=mk(t||"Nuovo documento");if(sh)b.sh=sh;S.books.push(b);S.cur=b.id;book=b;s=0;save();render();buildHome();showReader()}
document.getElementById("newb").onclick=function(){newBook()};
document.getElementById("delb").onclick=function(){if(!confirm("Eliminare il libro “"+book.title+"”?"))return;if(cloud)cloud.doc("b_"+book.id).delete().catch(function(){});S.books=S.books.filter(function(b){return b.id!==book.id});if(!S.books.length)S.books.push(mk("Nuovo libro"));S.cur=S.books[0].id;book=cb();s=0;reflowAll();save();render();showHome()};
document.getElementById("title").oninput=function(){book.title=this.value;var cc=bookEl.querySelector(".ctt");if(cc)cc.textContent=this.value||"Senza titolo";save()};
function fs(d){S.fs=Math.max(11,Math.min(26,S.fs+d));size();reflowAll();render()}
document.getElementById("fminus").onclick=function(){fs(-1)};document.getElementById("fplus").onclick=function(){fs(1)};
document.getElementById("exp").onclick=function(){var t=book.title+"\n\n"+book.pages.map(toText).join("\n\n");var u="data:text/plain;charset=utf-8,"+encodeURIComponent(t);saveFile((book.title||"libro").replace(/[^\w\- ]+/g,"")+".txt",t)};
document.getElementById("savenow").onclick=function(){S.books.forEach(function(b){if(b.u||hasText(b))dirty[b.id]=1});save();persistLocal();clearTimeout(timer);if(cloud)push()};
document.getElementById("bk").onclick=function(){saveFile("libro3d-backup.json",JSON.stringify({app:"libro3d",v:1,fmt:2,shelves:S.shelves.map(function(x){return{id:x.id,name:x.name}}),books:S.books}))};
document.getElementById("imp").onclick=function(){document.getElementById("file").click()};
document.getElementById("file").onchange=function(){var f=this.files[0];if(!f)return;var inp=this,r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result),n=0;if(!d||!Array.isArray(d.books))throw 0;var dm={};(Array.isArray(d.shelves)?d.shelves:[]).forEach(function(x){if(x&&x.id&&typeof x.name==="string")dm[x.id]=x.name});
 d.books.forEach(function(b){if(!b||!Array.isArray(b.pages))return;var id=b.id;if(!id||S.books.some(function(x){return x.id===id})){id="b"+Date.now()+Math.floor(Math.random()*9999);}
  S.books.push({id:id,title:(b.title||"Libro importato")+(id!==b.id?" (copia)":""),pages:(d.fmt===2?b.pages.map(String).map(cleanHtml):b.pages.map(String).map(esc)),bm:b.bm,pg:b.pg||0,tabs:Array.isArray(b.tabs)?b.tabs:[],cards:Array.isArray(b.cards)?b.cards.map(function(c){return{id:String(c.id||"c"+Date.now().toString(36)+Math.floor(Math.random()*999)),f:String(c.f||""),b:String(c.b||""),p:+c.p||0,u:+c.u||Date.now()}}):[],u:Date.now(),sh:(b.sh&&dm[b.sh])?shByName(dm[b.sh]):undefined});dirty[id]=1;S.cur=id;n++});
 if(!n)throw 0;book=cb();s=0;reflowAll();save();render();showHome();alert("Importati "+n+" libri")}catch(e){alert("File non valido: scegli un backup .json di questa app")}inp.value=""};r.readAsText(f)};
var rzT=0;window.addEventListener("resize",function(){clearTimeout(rzT);rzT=setTimeout(function(){size();reflowAll();render();if(!home.hidden)buildHome()},250)});
document.addEventListener("keydown",function(e){if(e.altKey&&e.key==="ArrowRight")go(1);if(e.altKey&&e.key==="ArrowLeft")go(-1)});
var T2=document.createElement("div");T2.style.cssText="position:absolute;left:-9999px;top:0;width:480px;white-space:pre-wrap";document.body.appendChild(T2);
var tts={on:false,tok:0};
function esc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function jn(a,b){if(!b)return a;if(!a)return b;return a+(a.slice(-1)===">"||b.charAt(0)==="<"?"":" ")+b}
function cp(v){var a=v.pages.map(String);return v.h===2?a.map(cleanHtml):a.map(esc)}
function textOf(h){return new DOMParser().parseFromString(h,"text/html").body.textContent}
function tlen(h){return textOf(h).length}
function toText(h){T2.innerHTML=h;return T2.innerText.replace(/\n{3,}/g,"\n\n").trim()}
var MAP={MARK:"mark",STRONG:"b",B:"b",EM:"i",I:"i",U:"u",S:"s",STRIKE:"s",DEL:"s",SUB:"sub",SUP:"sup",P:"p",DIV:"p",H1:"h1",H2:"h2",H3:"h3",H4:"h4",H5:"h4",H6:"h4",UL:"ul",OL:"ol",LI:"li",BLOCKQUOTE:"blockquote",A:"a",PRE:"p",CODE:"code",TD:"p",TH:"p",SECTION:"p",ARTICLE:"p"};
var BL=/^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|TABLE|PRE|TR|TD|TH|SECTION|ARTICLE)$/;
function hasBlk(n){for(var c=n.firstChild;c;c=c.nextSibling)if(c.nodeType===1&&BL.test(c.tagName))return true;return false}
function san(n,out,pre){
 if(n.nodeType===3){var t=pre?n.nodeValue:n.nodeValue.replace(/[ \t\r\n\f]+/g," ");if(t)out.appendChild(document.createTextNode(t));return}
 if(n.nodeType!==1)return;var g=n.tagName;
 if(/^(SCRIPT|STYLE|IFRAME|HEAD|META|LINK|IMG|SVG|OBJECT|NOSCRIPT|TITLE|CANVAS|VIDEO|AUDIO|INPUT|BUTTON|SELECT|TEXTAREA)$/.test(g))return;
 if(g==="BR"){out.appendChild(document.createElement("br"));return}
 var st=n.style||{},tag=MAP[g];if(g==="MARK"&&!n.getAttribute("data-h"))tag=null;
 if((g==="B"||g==="STRONG")&&st.fontWeight==="normal")tag=null;
 if(tag==="p"&&hasBlk(n))tag=null;
 var host=out,e;function put(t){e=document.createElement(t);host.appendChild(e);host=e;return e}
 if(tag){put(tag);if(tag==="mark"){var hc=n.getAttribute("data-c");e.setAttribute("data-h",(n.getAttribute("data-h")||"").replace(/[^\w-]/g,""));e.setAttribute("data-c",/^[ygbp]$/.test(hc)?hc:"y")}
  if(tag==="a"){var h=n.getAttribute("href")||"";if(/^(https?:|mailto:)/i.test(h)){e.setAttribute("href",h);e.setAttribute("target","_blank");e.setAttribute("rel","noopener")}}
  else if(/^(p|h1|h2|h3|h4|blockquote)$/.test(tag)&&/^(center|right|justify|left)$/.test(st.textAlign||""))e.style.textAlign=st.textAlign}
 if(!/^(ul|ol)$/.test(tag||"")){
  var fw=st.fontWeight;if((fw==="bold"||+fw>=600)&&!/^(b|h1|h2|h3|h4)$/.test(tag||""))put("b");
  if(st.fontStyle==="italic"&&tag!=="i")put("i");
  var td=st.textDecorationLine||st.textDecoration||"";if(/underline/.test(td)&&tag!=="u"&&tag!=="a")put("u");if(/line-through/.test(td)&&tag!=="s")put("s");
  var m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(st.color||"");if(m&&(+m[1]*.3+ +m[2]*.59+ +m[3]*.11)<150&&(+m[1]+ +m[2]+ +m[3])>30)put("span").style.color=st.color}
 var pr=pre||g==="PRE";for(var c=n.firstChild;c;c=c.nextSibling)san(c,host,pr)}
function bl(n){return n.nodeType===1&&/^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|BR)$/.test(n.tagName)}
function post(r){Array.prototype.slice.call(r.childNodes).forEach(function(x){if(x.nodeType===3){if(/^[ \t\r\n\f]*$/.test(x.nodeValue)){var a=x.previousSibling,b=x.nextSibling;if(!a||!b||bl(a)||bl(b))r.removeChild(x)}}else if(x.nodeType===1)post(x)})}
function cleanHtml(h){var d=new DOMParser().parseFromString(h,"text/html"),o=document.createElement("div");for(var c=d.body.firstChild;c;c=c.nextSibling)san(c,o,false);post(o);return o.innerHTML}
function ser(fr){var d=document.createElement("div");d.appendChild(fr);var all=d.querySelectorAll("*");for(var i=all.length-1;i>=0;i--){var x=all[i];if(x.tagName!=="BR"&&x.tagName!=="HR"&&!x.textContent&&!x.querySelector("br,hr"))x.parentNode.removeChild(x)}return d.innerHTML}
function pointAt(root,n){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),x,rem=n;while((x=w.nextNode())){if(rem<=x.length)return[x,rem];rem-=x.length}return null}
function splitAt(h,n){var root=document.createElement("div");root.innerHTML=h;var pt=pointAt(root,n);if(!pt)return[h,""];
 var r1=document.createRange();r1.setStart(root,0);r1.setEnd(pt[0],pt[1]);var r2=document.createRange();r2.setStart(pt[0],pt[1]);r2.setEnd(root,root.childNodes.length);
 return[ser(r1.cloneContents()),ser(r2.cloneContents())]}
function fitsH(h){M.innerHTML=h;return M.scrollHeight<=M.clientHeight+1}
function fit(h){if(!h||fitsH(h))return[h,""];var tx=textOf(h),T=tx.length,lo=0,hi=T;
 while(lo<hi){var mid=Math.ceil((lo+hi)/2);if(fitsH(splitAt(h,mid)[0]))lo=mid;else hi=mid-1}
 var cut=lo,sp=Math.max(tx.lastIndexOf(" ",cut-1),tx.lastIndexOf("\n",cut-1));if(sp>cut*0.6)cut=sp+1;if(cut<1)cut=Math.min(T,1);
 return splitAt(h,cut)}
function chunks(t){var out=[],parts=t.replace(/\s+/g," ").trim().match(/[^.!?;:]+[.!?;:]*\s*/g)||[],cur="";parts.forEach(function(x){if((cur+x).length>180){if(cur)out.push(cur);cur=x}else cur+=x});if(cur)out.push(cur);return out}
function setBtn(){document.getElementById("rd").textContent=tts.on?"Stop lettura":"Leggi"}
function stopSpeak(){tts.tok++;tts.on=false;try{speechSynthesis.cancel()}catch(e){}setBtn()}
function speak(){if(!window.speechSynthesis)return;if(tts.on){stopSpeak();return}
 var sel=String(getSelection()).trim(),q=[];
 if(sel){chunks(sel).forEach(function(c){q.push({t:c,p:-1})})}
 else{for(var p=Math.min(2*s,book.pages.length-1);p<book.pages.length;p++)chunks(toText(book.pages[p])).forEach(function(c){q.push({t:c,p:p})})}
 if(!q.length)return;tts.on=true;var tok=++tts.tok;setBtn();
 var v=speechSynthesis.getVoices().filter(function(x){return /^it/i.test(x.lang)})[0]||null,rate=+document.getElementById("rate").value;
 (function next(i){if(tok!==tts.tok)return;if(i>=q.length){tts.on=false;setBtn();return}
  var it=q[i];if(it.p>=0){var ns=pageSpread(it.p);if(ns!==s){s=ns;pos()}}
  var u=new SpeechSynthesisUtterance(it.t);u.lang=v?v.lang:"it-IT";if(v)u.voice=v;u.rate=rate;
  u.onend=function(){next(i+1)};u.onerror=function(){if(tok===tts.tok){tts.on=false;setBtn()}};speechSynthesis.speak(u)})(0)}
var rdb=document.getElementById("rd");rdb.addEventListener("mousedown",function(e){e.preventDefault()});rdb.onclick=speak;
function placeBm(){book.bm=book.bm===s?undefined:s;save();pos()}
document.getElementById("bm").onclick=placeBm;
document.getElementById("gobm").onclick=function(){if(book.bm==null)return;s=Math.max(0,Math.min(nSp()-1,book.bm));pos()};
if(!window.speechSynthesis){rdb.hidden=true;document.getElementById("rate").hidden=true}

var noPg=0,opening=0,home=document.getElementById("home"),reader=document.getElementById("reader");
var PAL=["#2f4a3f","#6b2c35","#27405e","#8a6a2a","#4b3a2e","#3d4a57","#5a3d63","#7a4a2a"];
function hs(x){var h=0;for(var i=0;i<x.length;i++)h=(h*31+x.charCodeAt(i))|0;return Math.abs(h)}
function bookColor(b){return PAL[hs(b.id)%PAL.length]}
function spine(b){var h=hs(b.id),n=b.pages.length,el=document.createElement("div"),ti=b.title||"Senza titolo";el.className="sb";el.tabIndex=0;el.setAttribute("role","button");el.setAttribute("aria-label","Apri "+ti);
 var dp=100+(h>>3)%38,gp=4+(h>>7)%16;el.className="sb v"+(h>>11)%3;
 el.style.cssText="--t:"+Math.max(34,Math.min(64,30+n*2))+"px;--h:"+(176+h%44)+"px;--c:"+PAL[h%PAL.length]+";--d:"+dp+"px;--z:"+(-(dp/2+gp))+"px";
 el.innerHTML='<div class="sp"><span></span></div><div class="cv"><div class="ct"></div></div><div class="sl"></div><div class="st"></div><div class="sd"></div>';el.querySelector(".sp span").textContent=ti;el.querySelector(".ct").textContent=ti;
 el.onclick=function(){if(Date.now()-sup<350)return;openBook(b.id,el)};el.oncontextmenu=function(e){e.preventDefault()};
 el.onpointerdown=function(e){spineDown(e,el,b)};el.onpointermove=spineMove;el.onpointerup=function(e){spineUp(e,el)};el.onpointercancel=function(e){spineUp(e,el,1)};
 el._b=b;el.onkeydown=function(e){if(e.altKey&&/^Arrow(Left|Right|Up|Down)$/.test(e.key)){e.preventDefault();shKeyMove(b,e.key);return}if(e.key==="Enter"||e.key===" "){e.preventDefault();openBook(b.id,el)}};return el}
/* trascina i libri per riordinarli e per spostarli da uno scaffale all'altro */
var dg=null,sup=0;
function spineDown(e,el,b){if(e.button>0)return;dg={el:el,b:b,x:e.clientX,y:e.clientY,cx:e.clientX,cy:e.clientY,sy0:document.querySelector(".case").scrollTop,on:false,id:e.pointerId,touch:e.pointerType!=="mouse",t:null,ins:null,sh:null,scr:0};try{el.setPointerCapture(e.pointerId)}catch(x){}
 if(dg.touch)dg.t=setTimeout(dragStart,320)}
function dragStart(){if(!dg||dg.on)return;dg.on=true;clearTimeout(dg.t);dg.el.classList.add("drag");try{if(navigator.vibrate)navigator.vibrate(10)}catch(e){}
 /* scorre la libreria quando il libro è vicino al bordo, per raggiungere scaffali lontani */
 dg.scr=setInterval(function(){if(!dg||!dg.on)return;var cs=document.querySelector(".case"),r=cs.getBoundingClientRect(),v=dg.cy<r.top+70?-14:dg.cy>r.bottom-70?14:0;if(v){cs.scrollTop+=v;dragUpdate()}},30)}
function dragUpdate(){if(!dg||!dg.on)return;var ds=document.querySelector(".case").scrollTop-dg.sy0;dg.el.style.setProperty("--mx",(dg.cx-dg.x)+"px");dg.el.style.setProperty("--my",(dg.cy-dg.y+ds)+"px");dropTarget(dg.cx,dg.cy)}
function spineMove(e){if(!dg||e.pointerId!==dg.id)return;var dx=e.clientX-dg.x,dy=e.clientY-dg.y,mv=Math.hypot(dx,dy);
 if(!dg.on){if(dg.touch){if(mv>10){clearTimeout(dg.t);dg=null}return}if(mv>6)dragStart();else return}
 dg.cx=e.clientX;dg.cy=e.clientY;dragUpdate()}
function dropTarget(px,py){var best=null,bd=1e9;document.querySelectorAll("#shelf .row").forEach(function(r){var q=r.getBoundingClientRect(),d=py<q.top?q.top-py:py>q.bottom?py-q.bottom:0;if(d<bd){bd=d;best=r}});if(!best)return;
 var others=[].slice.call(document.querySelectorAll("#shelf .sb")).filter(function(x){return x!==dg.el}),ro=others.filter(function(x){return x.parentNode===best}),c=0,idx,mx,rq=best.getBoundingClientRect();
 ro.forEach(function(x){var q=x.getBoundingClientRect();if(q.left+q.width/2<px)c++});
 if(c<ro.length){idx=others.indexOf(ro[c]);mx=ro[c].getBoundingClientRect().left-2}else if(ro.length){idx=others.indexOf(ro[ro.length-1])+1;mx=ro[ro.length-1].getBoundingClientRect().right+1}else{idx=others.filter(function(x){return!!(x.compareDocumentPosition(best)&4)}).length;mx=rq.left+10}
 dg.ins=idx;dg.sh=best.parentNode.dataset.sh;document.querySelectorAll("#shelf .sec").forEach(function(x){x.classList.toggle("over",x===best.parentNode)});
 var m=document.getElementById("dmark");m.style.display="block";m.style.left=mx+"px";m.style.top=(rq.top+20)+"px";m.style.height=(rq.height-24)+"px"}
function spineUp(e,el,cancel){if(!dg||e.pointerId!==dg.id)return;clearTimeout(dg.t);var d=dg;dg=null;clearInterval(d.scr);try{el.releasePointerCapture(e.pointerId)}catch(x){}
 if(!d.on)return;sup=Date.now();document.getElementById("dmark").style.display="none";document.querySelectorAll("#shelf .sec").forEach(function(x){x.classList.remove("over")});
 if(!cancel&&d.ins!=null&&d.sh){var arr=[].slice.call(document.querySelectorAll("#shelf .sb")).filter(function(x){return x!==d.el}).map(function(x){return x._b});
  arr.splice(d.ins,0,d.b);var was=shId(d.b);d.b.sh=d.sh;if(was!==d.sh){d.b.u=Date.now();dirty[d.b.id]=1}
  S.books=arr.concat(S.books.filter(function(x){return arr.indexOf(x)<0}));shSave()}buildHome()}
/* scaffali: ogni libro appartiene a uno scaffale con un nome, senza limite di scaffali */
function shFix(){if(!Array.isArray(S.shelves))S.shelves=[];S.shelves=S.shelves.filter(function(x){return x&&x.id&&typeof x.name==="string"});if(!S.shelves.length)S.shelves.push({id:"s0",name:"Scaffale principale"})}
function shId(b){for(var i=0;i<S.shelves.length;i++)if(S.shelves[i].id===b.sh)return b.sh;return S.shelves[0].id}
function shNm(id){for(var i=0;i<S.shelves.length;i++)if(S.shelves[i].id===id)return S.shelves[i].name;return S.shelves[0].name}
function shByName(n){n=String(n||"").trim().slice(0,60);if(!n)return S.shelves[0].id;for(var i=0;i<S.shelves.length;i++)if(S.shelves[i].name===n)return S.shelves[i].id;
 var x={id:"s"+Date.now().toString(36)+Math.floor(Math.random()*999),name:n};S.shelves.push(x);return x.id}
function shSave(){persistLocal();if(cloud){clearTimeout(timer);timer=setTimeout(push,1500)}}
function shNew(){var t=prompt("Nome del nuovo scaffale (es. Narrativa, Saggi, Da leggere):","");if(t===null)return null;t=t.trim().slice(0,60);if(!t){alert("Il nome dello scaffale non può essere vuoto.");return null}
 var x={id:"s"+Date.now().toString(36)+Math.floor(Math.random()*999),name:t};S.shelves.push(x);shSave();return x}
function shRen(i){var t=prompt("Nome dello scaffale:",S.shelves[i].name);if(t===null)return;t=t.trim().slice(0,60);if(!t){alert("Il nome dello scaffale non può essere vuoto.");return}S.shelves[i].name=t;shSave();buildHome()}
function shDel(i){if(S.shelves.length<2)return;var sh=S.shelves[i],bs=S.books.filter(function(x){return shId(x)===sh.id}),dest=S.shelves[i>0?i-1:1];
 if(!confirm("Eliminare lo scaffale «"+sh.name+"»?"+(bs.length?"\nI "+bs.length+(bs.length===1?" libro che contiene verrà spostato":" libri che contiene verranno spostati")+" in «"+dest.name+"». Nessun libro viene cancellato.":"")))return;
 bs.forEach(function(b){b.sh=dest.id;b.u=Date.now();dirty[b.id]=1});S.books=S.books.filter(function(x){return bs.indexOf(x)<0}).concat(bs);S.shelves.splice(i,1);shSave();buildHome()}
function shMove(i,d){var j=i+d;if(j<0||j>=S.shelves.length)return;var t=S.shelves[i];S.shelves[i]=S.shelves[j];S.shelves[j]=t;shSave();buildHome()}
/* Alt + frecce sul dorso: sinistra/destra riordina nello scaffale, su/giù sposta nello scaffale precedente o successivo */
function shKeyMove(b,k){var id=shId(b),si=0;S.shelves.forEach(function(x,n){if(x.id===id)si=n});
 if(k==="ArrowLeft"||k==="ArrowRight"){var l=S.books.filter(function(x){return shId(x)===id}),i=l.indexOf(b),j=i+(k==="ArrowLeft"?-1:1);if(j<0||j>=l.length)return;var a=S.books.indexOf(b),c=S.books.indexOf(l[j]);S.books[a]=l[j];S.books[c]=b}
 else{var t=si+(k==="ArrowUp"?-1:1);if(t<0||t>=S.shelves.length)return;b.sh=S.shelves[t].id;S.books=S.books.filter(function(x){return x!==b});S.books.push(b)}
 b.u=Date.now();dirty[b.id]=1;shSave();buildHome();var el=[].slice.call(document.querySelectorAll("#shelf .sb")).filter(function(x){return x._b===b})[0];if(el)el.focus()}
function buildHome(){var c=document.getElementById("shelf");c.innerHTML="";shFix();var per=Math.max(3,Math.min(12,Math.floor((Math.min(innerWidth,960)-110)/54)));
 S.shelves.forEach(function(sh,si){var bs=S.books.filter(function(b){return shId(b)===sh.id}),sec=document.createElement("section");sec.className="unit sec";sec.dataset.sh=sh.id;
  var h=document.createElement("div");h.className="shh";h.innerHTML='<span class="shn"></span><span class="shc"></span><span class="sha"></span>';
  h.querySelector(".shn").textContent=sh.name;h.querySelector(".shc").textContent=bs.length+(bs.length===1?" libro":" libri");
  var ac=h.querySelector(".sha");[["↑","Sposta lo scaffale più in alto",si>0,function(){shMove(si,-1)}],["↓","Sposta lo scaffale più in basso",si<S.shelves.length-1,function(){shMove(si,1)}],["✎","Rinomina lo scaffale",true,function(){shRen(si)}],["✕","Elimina lo scaffale",S.shelves.length>1,function(){shDel(si)}],["+","Aggiungi un nuovo scaffale sotto questo",true,function(){shAddAfter(si)},"shadd"]].forEach(function(a){
   var bt=document.createElement("button");if(a[4])bt.className=a[4];bt.textContent=a[0];bt.title=a[1];bt.setAttribute("aria-label",a[1]+" «"+sh.name+"»");bt.disabled=!a[2];bt.onclick=a[3];ac.appendChild(bt)});
  sec.appendChild(h);var it=bs.slice();it.push(null);
  for(var i=0;i<it.length;i+=per){var row=document.createElement("div");row.className="row";row.innerHTML='<i class="fl"></i><i class="wl"></i><i class="wr"></i><i class="wb"></i>';
   it.slice(i,i+per).forEach(function(b){if(b)row.appendChild(spine(b));else{var n=document.createElement("div");n.className="nw";n.textContent="+";n.title="Nuovo libro in «"+sh.name+"»";n.onclick=function(){newBook(sh.id)};row.appendChild(n)}});
   sec.appendChild(row);var pl=document.createElement("div");pl.className="plank";sec.appendChild(pl)}
  c.appendChild(sec)});
 /* i libri più vicini al centro si sovrappongono a quelli laterali, come con un occhio che guarda al centro dello scaffale */
 c.querySelectorAll(".row").forEach(function(row){var mid=row.clientWidth/2;row.querySelectorAll(".sb").forEach(function(sb){sb.style.zIndex=Math.max(1,300-Math.round(Math.abs(sb.offsetLeft+sb.offsetWidth/2-mid)/3))})})}
function shAddAfter(si){var x=shNew();if(!x)return;S.shelves.pop();S.shelves.splice(si+1,0,x);shSave();buildHome();var e=document.querySelector('#shelf .sec[data-sh="'+x.id+'"]');if(e)e.scrollIntoView({behavior:"smooth",block:"center"})}
/* sposta il libro aperto in un altro scaffale */
var shm=document.getElementById("shm");
function shMoveList(){var l=document.getElementById("shml");l.innerHTML="";var cur=shId(book);S.shelves.forEach(function(x){var b=document.createElement("button");b.textContent=x.name+(x.id===cur?"  ✓":"");if(x.id===cur)b.className="cur";b.onclick=function(){shMoveTo(x.id)};l.appendChild(b)})}
function shMoveTo(id){var b=book;if(shId(b)!==id){b.sh=id;S.books=S.books.filter(function(x){return x!==b});S.books.push(b);b.u=Date.now();dirty[b.id]=1;shSave();buildHome();toast("Spostato in «"+shNm(id)+"»")}shm.hidden=true}
document.getElementById("mvsh").onclick=function(){shMoveList();shm.hidden=false};
document.getElementById("shmc").onclick=function(){shm.hidden=true};
document.getElementById("shmn").onclick=function(){var x=shNew();if(x)shMoveTo(x.id)};
function openBook(id,el){if(opening)return;opening=1;S.cur=id;book=cb();s=-1;noPg=1;size();if(book.lay!==sigNow())reflowAll();render();
 if(el&&!matchMedia("(prefers-reduced-motion:reduce)").matches){var rr=el.parentNode.getBoundingClientRect(),k=700/400,ox=rr.left+rr.width/2,oy=rr.top-60,ex=rr.left+el.offsetLeft+el.offsetWidth/2,ey=rr.top+el.offsetTop+el.offsetHeight/2;
  el.style.setProperty("--dx",((innerWidth/2-ox)/k+ox-ex)+"px");el.style.setProperty("--dy",((innerHeight/2-oy)/k+oy-ey)+"px");
  home.classList.add("opening");el.classList.add("open");setTimeout(showReader,900)}else showReader()}
function showReader(){home.hidden=true;home.classList.remove("opening");reader.hidden=false;reader.classList.remove("fadein");void reader.offsetWidth;reader.classList.add("fadein");
 if(s>=0&&!noPg){opening=0;return}
 var tgt=Math.max(0,Math.min(nSp()-1,book.pg||0));setTimeout(function(){var ls=bookEl.querySelectorAll(".leaf");for(var i=0;i<ls.length;i++)ls[i].style.transitionDelay=Math.min(i,8)*70+"ms";
  s=tgt;pos();setTimeout(function(){noPg=0;opening=0;for(var i=0;i<ls.length;i++)ls[i].style.transitionDelay=""},1600)},350)}
function showHome(){stopSpeak();opening=0;noPg=0;reader.hidden=true;home.hidden=false;home.classList.remove("opening");buildHome()}
document.getElementById("tohome").onclick=showHome;
/* musica di sottofondo: brani dell'utente, salvati nel browser (IndexedDB) */
var au=new Audio(),tracks=[],cur=-1,mdb=null;au.preload="auto";
function mus(){return S.music||(S.music={vol:60})}
function mpm(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function msg(t){document.getElementById("mmsg").textContent=t||""}
function dbo(){return new Promise(function(res,rej){if(mdb)return res(mdb);try{var r=indexedDB.open("libro3d-music",1);r.onupgradeneeded=function(){r.result.createObjectStore("t",{keyPath:"id"})};r.onsuccess=function(){mdb=r.result;res(mdb)};r.onerror=function(){rej()}}catch(e){rej()}})}
function dbAll(){return dbo().then(function(d){return new Promise(function(res){var q=d.transaction("t").objectStore("t").getAll();q.onsuccess=function(){res(q.result||[])};q.onerror=function(){res([])}})}).catch(function(){return[]})}
function dbPut(t){return dbo().then(function(d){return new Promise(function(res,rej){var x=d.transaction("t","readwrite");x.objectStore("t").put(t);x.oncomplete=res;x.onerror=rej})})}
function dbDel(id){return dbo().then(function(d){d.transaction("t","readwrite").objectStore("t").delete(id)}).catch(function(){})}
function mUIb(){document.getElementById("mpp").textContent=au.paused?"▶":"⏸";document.querySelectorAll(".musbtn").forEach(function(b){b.classList.toggle("on",!au.paused)})}
function mList(){var L=document.getElementById("mlist");L.innerHTML="";
 if(!tracks.length){L.innerHTML='<div style="font-size:12px;opacity:.7;padding:4px">Nessun brano. Aggiungi file MP3, M4A, WAV… dal tuo dispositivo.</div>';return}
 tracks.forEach(function(t,i){var d=document.createElement("div");d.className="t"+(i===cur?" cur":"");var s=document.createElement("span");s.textContent=t.name;var x=document.createElement("button");x.textContent="×";x.setAttribute("aria-label","Rimuovi");d.appendChild(s);d.appendChild(x);
  d.onclick=function(){mPlayIdx(i)};
  x.onclick=function(e){e.stopPropagation();dbDel(t.id);var was=i===cur;tracks.splice(i,1);if(i<cur)cur--;if(was){au.pause();cur=-1;au.removeAttribute("src")}mList();mUIb()};L.appendChild(d)})}
function mPlayIdx(i){if(!tracks.length)return;cur=(i+tracks.length)%tracks.length;var t=tracks[cur];if(au._u)URL.revokeObjectURL(au._u);au._u=URL.createObjectURL(t.blob);au.src=au._u;au.volume=mus().vol/100;msg("");
 var pr=au.play();if(pr&&pr.catch)pr.catch(function(){msg("Premi ▶ per avviare: il browser vuole un tuo tocco.")});mList()}
au.onended=function(){mPlayIdx(cur+1)};au.onplay=au.onpause=mUIb;
document.querySelectorAll(".musbtn").forEach(function(b){b.onclick=function(e){e.stopPropagation();var m=document.getElementById("mp");m.hidden=!m.hidden}});
document.addEventListener("click",function(e){var m=document.getElementById("mp");if(!m.hidden&&!(e.composedPath&&e.composedPath().indexOf(m)>=0))m.hidden=true});
document.getElementById("madd").onclick=function(){document.getElementById("mfile").click()};
document.getElementById("mfile").onchange=function(){var fs=Array.prototype.slice.call(this.files),inp=this;
 Promise.all(fs.map(function(f,k){var t={id:Date.now()+"-"+k+Math.floor(Math.random()*999),name:f.name.replace(/\.[^.]+$/,""),blob:f};tracks.push(t);return dbPut(t).catch(function(){msg("Brano aggiunto, ma non salvabile per la prossima volta.")})})).then(function(){mList();if(cur<0&&tracks.length)mPlayIdx(0)});inp.value=""};
document.getElementById("mpp").onclick=function(){if(cur<0)mPlayIdx(0);else if(au.paused)au.play();else au.pause()};
document.getElementById("mprev").onclick=function(){mPlayIdx(cur<0?0:cur-1)};
document.getElementById("mnext").onclick=function(){mPlayIdx(cur<0?0:cur+1)};
document.getElementById("mv").oninput=function(){mus().vol=+this.value;au.volume=this.value/100;mpm()};
/* tab colorati laterali + vai a pagina */
function tabs(){return book.tabs||(book.tabs=[])}
function drawTabs(){var max=nSp()-1,all=tabs().slice().sort(function(a,b){return a.p-b.p}),st=Math.max(14,Math.min(34,(PH-70)/Math.max(1,all.length)));all.forEach(function(t,i){var e=document.createElement("div");e.className="tab";e.dataset.p=Math.min(max,t.p);e.style.background=t.c;e.style.top=(28+i*st)+"px";e.title="Pagine "+(2*t.p+1)+"–"+(2*t.p+2);e.onclick=function(){s=Math.min(max,t.p);pos()};leafFor(Math.min(max,t.p)+1).appendChild(e)})}
function redrawTabs(){bookEl.querySelectorAll(".tab").forEach(function(e){e.remove()});drawTabs();tabsUI()}
function tabsUI(){var t=tabs().filter(function(x){return x.p===s})[0],b=document.getElementById("tabb"),c=document.getElementById("tabc");if(b){b.textContent=t?"Tab −":"Tab +";b.classList.toggle("on",!!t);b.title=t?"Togli il tab da questa pagina":"Aggiungi un tab a questa pagina"}if(t&&c)c.value=t.c;bookEl.querySelectorAll(".tab").forEach(function(e){e.classList.toggle("cur",+e.dataset.p===s)})}
document.getElementById("tabb").onclick=function(){if(s<0)return;var a=tabs(),i=-1;a.forEach(function(x,k){if(x.p===s)i=k});if(i>=0)a.splice(i,1);else a.push({p:s,c:document.getElementById("tabc").value});save();redrawTabs()};
document.getElementById("tabc").oninput=function(){var c=this.value;tabs().forEach(function(x){if(x.p===s)x.c=c});if(tabs().some(function(x){return x.p===s})){save();redrawTabs()}};
function jump(){var i=document.getElementById("gop"),n=parseInt(String(i.value).replace(/\D/g,""),10);if(!n){i.focus();return}n=Math.max(1,Math.min(book.pages.length,n));s=pageSpread(n-1);pos();status("Pagina "+n);i.value="";i.blur()}
document.getElementById("gob").onclick=jump;
document.getElementById("gop").onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();jump()}};
var mnb=document.getElementById("mbtn"),mn=document.getElementById("menu");
mnb.onclick=function(e){e.stopPropagation();mn.hidden=!mn.hidden;mnb.setAttribute("aria-expanded",String(!mn.hidden))};
document.addEventListener("click",function(e){if(!mn.hidden&&!(e.composedPath&&e.composedPath().indexOf(mn)>=0)){mn.hidden=true;mnb.setAttribute("aria-expanded","false")}});
mn.addEventListener("click",function(e){if(e.target.closest&&e.target.closest("button"))setTimeout(function(){mn.hidden=true;mnb.setAttribute("aria-expanded","false")},0)});
document.getElementById("arL").onclick=function(){go(-1)};document.getElementById("arR").onclick=function(){go(1)};
document.addEventListener("keydown",function(e){if(reader.hidden||e.altKey||e.ctrlKey||e.metaKey||(e.key!=="ArrowLeft"&&e.key!=="ArrowRight"))return;var t=e.target;if(t&&(t.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)))return;go(e.key==="ArrowLeft"?-1:1)});
/* evidenziatore + pannello laterale */
var hlsel=null,hlEl=null,hlT=0,hlT2=0,HC={y:"#f2c94c",g:"#6fcf97",b:"#56ccf2",p:"#f48fb1"};
function hlOpenState(){return S.hlOpen===undefined?innerWidth>=980:S.hlOpen}
function dock(){return hlOpenState()&&innerWidth>=980}
function hlSync(){var a=document.getElementById("hlp");if(a)a.hidden=!hlOpenState()}
function hlSoon(){clearTimeout(hlT);hlT=setTimeout(hlRender,200)}
function hlCollect(){var map={},ord=[];book.pages.forEach(function(h,p){if(h.indexOf("data-h")<0)return;var d=document.createElement("div");d.innerHTML=h;d.querySelectorAll("mark[data-h]").forEach(function(m){var id=m.getAttribute("data-h");if(!map[id]){map[id]={id:id,c:m.getAttribute("data-c")||"y",p:p,t:""};ord.push(id)}map[id].t+=m.textContent})});return ord.map(function(i){return map[i]})}
function goHl(x){s=Math.min(nSp()-1,pageSpread(x.p));pos()}
function hlRender(){var L=document.getElementById("hll");if(!L||!book)return;var a=hlCollect();document.getElementById("hln").textContent=a.length?String(a.length):"";var tb=document.getElementById("hlt");if(tb)tb.textContent=a.length?"Evidenziati · "+a.length:"Evidenziati";L.innerHTML="";
 if(!a.length){var e=document.createElement("div");e.className="hle";e.textContent="Seleziona del testo in una pagina per evidenziarlo: lo ritroverai qui.";L.appendChild(e);return}
 a.forEach(function(x){var c=document.createElement("div");c.className="hc";c.style.setProperty("--hc",HC[x.c]||HC.y);c.tabIndex=0;var t=document.createElement("div");t.className="tx";t.textContent=x.t.trim();var f=document.createElement("div");f.className="ft";var pg=document.createElement("span");pg.textContent="Pag. "+(x.p+1);var d=document.createElement("button");d.textContent="Rimuovi";d.title="Rimuovi evidenziazione";f.appendChild(pg);f.appendChild(d);c.appendChild(t);c.appendChild(f);
  c.onclick=function(){goHl(x)};c.onkeydown=function(e){if(e.key==="Enter")goHl(x)};d.onclick=function(e){e.stopPropagation();hlRemove(x.id)};L.appendChild(c)})}
function unwrap(m){var p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m)}
function hlRemove(id){book.pages.forEach(function(h,p){if(h.indexOf('data-h="'+id+'"')<0)return;var d=document.createElement("div");d.innerHTML=h;d.querySelectorAll('mark[data-h="'+id+'"]').forEach(unwrap);d.normalize();book.pages[p]=d.innerHTML;var el=bookEl.querySelector('.txt[data-p="'+p+'"]');if(el&&el.innerHTML!==book.pages[p])el.innerHTML=book.pages[p]});save();hlRender()}
function wrapRange(r,id,c){var sc=r.startContainer,so=r.startOffset,ec=r.endContainer,eo=r.endOffset,w=document.createTreeWalker(hlEl,NodeFilter.SHOW_TEXT),ns=[],n;while((n=w.nextNode())){if(r.intersectsNode(n))ns.push(n)}
 ns.forEach(function(t){var a=t===sc?so:0,b=t===ec?eo:t.length;if(b<=a||!/\S/.test(t.nodeValue.slice(a,b)))return;var pm=t.parentNode.closest&&t.parentNode.closest("mark[data-h]");if(pm){pm.setAttribute("data-c",c);return}
  var x=t;if(b<t.length)t.splitText(b);if(a>0)x=t.splitText(a);var m=document.createElement("mark");m.setAttribute("data-h",id);m.setAttribute("data-c",c);x.parentNode.insertBefore(m,x);m.appendChild(x)})}
function hlDone(){var p=+hlEl.dataset.p;book.pages[p]=hlEl.innerHTML;save();try{getSelection().removeAllRanges()}catch(e){}document.getElementById("hlbar").hidden=true;hlRender()}
function hlApply(c){if(!hlsel||!hlEl)return;wrapRange(hlsel,"h"+Date.now().toString(36)+Math.floor(Math.random()*999),c);hlDone()}
function hlErase(){if(!hlsel||!hlEl)return;var r=hlsel;hlEl.querySelectorAll("mark[data-h]").forEach(function(m){if(r.intersectsNode(m))unwrap(m)});hlEl.normalize();hlDone()}
function hlCheck(){var b=document.getElementById("hlbar"),sl=getSelection();if(reader.hidden||!sl||sl.isCollapsed||!sl.rangeCount){fcMode(0);b.hidden=true;return}
 var r=sl.getRangeAt(0),a=r.startContainer,z=r.endContainer;a=a.nodeType===3?a.parentNode:a;z=z.nodeType===3?z.parentNode:z;var ta=a.closest&&a.closest(".txt"),tz=z.closest&&z.closest(".txt");
 if(!ta||ta!==tz||!String(sl).trim()){fcMode(0);b.hidden=true;return}
 hlsel=r.cloneRange();hlEl=ta;var q=r.getBoundingClientRect();b.hidden=false;var w=b.offsetWidth||170;b.style.left=Math.max(8,Math.min(innerWidth-w-8,q.left+q.width/2-w/2))+"px";b.style.top=(q.top>56?q.top-46:q.bottom+10)+"px"}
document.addEventListener("selectionchange",function(){clearTimeout(hlT2);hlT2=setTimeout(hlCheck,120)});
var hb=document.getElementById("hlbar");hb.addEventListener("mousedown",function(e){e.preventDefault()});hb.addEventListener("pointerdown",function(e){e.preventDefault()});
hb.querySelectorAll(".sw").forEach(function(b){b.onclick=function(){hlApply(b.getAttribute("data-c"))}});document.getElementById("hlx").onclick=hlErase;
function hlToggle(){S.hlOpen=!hlOpenState();setTimeout(mpm,400);hlSync();size()}
document.getElementById("hlt").onclick=hlToggle;document.getElementById("hlc").onclick=hlToggle;
/* flashcard */
var fcE=document.getElementById("fce"),fcR=document.getElementById("fcr"),fcCard=document.getElementById("fccard"),fcTF=document.getElementById("fctf"),fcTB=document.getElementById("fctb"),fcEd=null,fcTxt="",fcPg=0,rv={q:[],know:0,flip:false},tmo=0;
function $(i){return document.getElementById(i)}
function toast(t){var e=$("toast");e.textContent=t;e.classList.add("on");clearTimeout(tmo);tmo=setTimeout(function(){e.classList.remove("on")},2600)}
function fcCards(){return book.cards||(book.cards=[])}
function fcById(id){return fcCards().filter(function(x){return x.id===id})[0]}
function fcUI(){var f=$("fab");if(!f||!book)return;var n=book.cards?book.cards.length:0;$("fabn").textContent=n;f.title=n?n+(n===1?" flashcard":" flashcard")+" · clicca per ripetere":"Nessuna flashcard ancora";f.setAttribute("aria-label",f.title)}
function nowFlip(c,on){c.style.transition="none";c.classList.toggle("flip",on);void c.offsetWidth;c.style.transition=""}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
/* barra di selezione: crea flashcard -> front/back */
function fcMode(on){$("hlmain").hidden=!!on;$("fcpick").hidden=!on;if(on)hlCheck()}
$("fcbtn").onclick=function(){fcTxt=hlsel?hlsel.toString().replace(/\s+/g," ").trim():"";fcPg=hlEl?(+hlEl.dataset.p||0):0;if(!fcTxt)return;fcMode(1)};
$("fcx").onclick=function(){fcMode(0)};
$("fcpick").querySelectorAll("[data-s]").forEach(function(b){b.onclick=function(){var s=b.getAttribute("data-s"),t=fcTxt,p=fcPg;fcMode(0);$("hlbar").hidden=true;try{getSelection().removeAllRanges()}catch(e){}
 openEd({f:s==="f"?t:"",b:s==="b"?t:"",side:s,p:p})}});
/* editor */
function openEd(o){fcEd=o;fcTF.value=o.f||"";fcTB.value=o.b||"";$("fcet").textContent=o.id?"Modifica flashcard":"Nuova flashcard";$("fcdel").hidden=!o.id;fcE.hidden=false;nowFlip(fcCard,o.side==="b")}
$("fcflip").onclick=function(){fcCard.classList.toggle("flip")};
$("fcec").onclick=function(){fcE.hidden=true};
$("fcsave").onclick=function(){var f=fcTF.value.trim(),b=fcTB.value.trim();if(!f&&!b){fcTF.focus();return}var a=fcCards();
 if(fcEd&&fcEd.id){var c=fcById(fcEd.id);if(c){c.f=f;c.b=b;c.u=Date.now()}}else a.push({id:"c"+Date.now().toString(36)+Math.floor(Math.random()*999),f:f,b:b,p:fcEd?(fcEd.p||0):0,u:Date.now()});
 save();fcUI();fcE.hidden=true;if(!fcR.hidden)fcFill();toast("Flashcard salvata · "+a.length+" nel libro")};
$("fcdel").onclick=function(){if(!fcEd||!fcEd.id||!confirm("Eliminare questa flashcard?"))return;book.cards=fcCards().filter(function(x){return x.id!==fcEd.id});rv.q=rv.q.filter(function(i){return i!==fcEd.id});save();fcUI();fcE.hidden=true;if(!fcR.hidden)fcShow()};
/* ripasso */
function fcFill(){var c=fcById(rv.q[0]);if(!c)return;var f=$("fcrf"),b=$("fcrb");f.textContent=c.f||"—";b.textContent=c.b||"—";f.classList.toggle("em",!c.f);b.classList.toggle("em",!c.b)}
function fcFlip(){rv.flip=!rv.flip;$("fcrcard").classList.toggle("flip",rv.flip);$("fcra2").classList.toggle("v0",!rv.flip)}
function fcShow(){while(rv.q.length&&!fcById(rv.q[0]))rv.q.shift();var done=!rv.q.length,tot=rv.know+rv.q.length;
 ["fcrsc","fcra1","fcra2","fcra3"].forEach(function(i){$(i).hidden=done});$("fcrdone").hidden=!done;$("fcrp").textContent=tot?"Sapute "+rv.know+" / "+tot:"";
 if(done){$("fcrdt").textContent=tot?"Ripasso completato! Hai saputo tutte le "+tot+" card.":"Non ci sono più flashcard in questo libro.";$("fcrag").hidden=!fcCards().length;return}
 rv.flip=false;nowFlip($("fcrcard"),false);$("fcra2").classList.add("v0");fcFill();var sc=$("fcrsc");sc.style.animation="none";void sc.offsetWidth;sc.style.animation=""}
function fcStart(){var c=fcCards();if(!c.length){toast("Nessuna flashcard: seleziona del testo e scegli «Crea flashcard»");return}
 rv.q=shuffle(c.map(function(x){return x.id}));rv.know=0;fcR.hidden=false;fcShow()}
$("fab").onclick=fcStart;
$("fcrsc").onclick=fcFlip;$("fcrflip").onclick=fcFlip;
$("fcrok").onclick=function(){rv.q.shift();rv.know++;fcShow()};
$("fcrno").onclick=function(){rv.q.push(rv.q.shift());fcShow()};
$("fcrsh").onclick=function(){rv.q=shuffle(rv.q);fcShow()};
$("fcred").onclick=function(){var c=fcById(rv.q[0]);if(c)openEd({id:c.id,f:c.f,b:c.b,side:rv.flip?"b":"f",p:c.p})};
$("fcrc").onclick=$("fcrcl").onclick=function(){fcR.hidden=true};
$("fcrag").onclick=fcStart;
document.addEventListener("keydown",function(e){if(fcE.hidden&&fcR.hidden)return;
 if(e.key==="Escape"){e.preventDefault();e.stopPropagation();if(!fcE.hidden)fcE.hidden=true;else fcR.hidden=true;return}
 if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.stopPropagation();return}
 if(e.key===" "&&fcE.hidden&&!/^(BUTTON|TEXTAREA|INPUT)$/.test(e.target.tagName)){e.preventDefault();fcFlip()}},true);
/* importa EPUB */
var epf=$("epubf");
function busy(on,t){$("busy").hidden=!on;if(t)$("busyt").textContent=t}
function tick(){return new Promise(function(r){var d=0;function g(){if(!d){d=1;r()}}requestAnimationFrame(g);setTimeout(g,60)})}
function zipIndex(u8,dv){var n=u8.length,e=-1,i;for(i=n-22;i>=Math.max(0,n-65558);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
 if(e<0)throw 0;var cnt=dv.getUint16(e+10,true),off=dv.getUint32(e+16,true),f={},dec=new TextDecoder();
 for(var k=0;k<cnt;k++){if(dv.getUint32(off,true)!==0x02014b50)break;var nl=dv.getUint16(off+28,true),el=dv.getUint16(off+30,true),cl=dv.getUint16(off+32,true);
  f[dec.decode(u8.subarray(off+46,off+46+nl))]={m:dv.getUint16(off+10,true),c:dv.getUint32(off+20,true),o:dv.getUint32(off+42,true)};off+=46+nl+el+cl}
 return f}
async function zipRead(u8,dv,f){var lo=f.o,st=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),d=u8.subarray(st,st+f.c);
 if(f.m===0)return d;if(f.m!==8)throw 0;
 return new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer())}
function rsv(base,href){var o=[];(base+href.split("#")[0]).split("/").forEach(function(x){if(x==="..")o.pop();else if(x&&x!==".")o.push(x)});return o.join("/")}
function perPage(){return Math.max(250,Math.floor(((PW-68)/(.48*S.fs))*((PH-74)/(1.55*S.fs))*.9))}
var LT=0,cancelImp=false,trQuiet=false;
async function yieldUI(label,n){if(performance.now()-LT>100){if(!trQuiet)busy(true,label+" · "+n+" pagine…");await tick();LT=performance.now();if(cancelImp)throw"cancel"}}
function headAt(h,n){var root=document.createElement("div");root.innerHTML=h;var pt=pointAt(root,n);if(!pt)return h;var r=document.createRange();r.setStart(root,0);r.setEnd(pt[0],pt[1]);return ser(r.cloneContents())}
async function place(pc,acc,out,label){var cur=pc;
 for(;;){if(fitsH(acc+cur))return acc+cur;
  var tx=textOf(cur),T=tx.length,lo=0,hi=T-1;
  while(lo<hi){var mid=Math.ceil((lo+hi)/2);if(fitsH(acc+headAt(cur,mid)))lo=mid;else hi=mid-1}
  if(lo<1){if(acc){out.push(acc);acc="";continue}lo=Math.min(T,1)}
  var cut=lo,sp=tx.lastIndexOf(" ",cut-1);if(sp>0&&cut-sp<60&&sp+1<T)cut=sp+1;
  var sh=splitAt(cur,cut);out.push(acc+sh[0]);acc="";cur=sh[1];if(!cur)return"";
  await yieldUI(label,out.length)}}
async function paginate(html,LIM,out,label){var d=document.createElement("div");d.innerHTML=html;var acc="",nodes=Array.prototype.slice.call(d.childNodes);M.innerHTML="";
 for(var ni=0;ni<nodes.length;ni++){if(trQuiet)M.innerHTML=acc;var n=nodes[ni],oh,len;
  if(n.nodeType===3){if(!/\S/.test(n.nodeValue))continue;oh="<p>"+esc(n.nodeValue)+"</p>";len=n.nodeValue.length}
  else if(n.nodeType===1){len=n.textContent.length;if(!len)continue;oh=n.outerHTML}else continue;
  var pieces=[],rest=oh;
  if(len>LIM*4){var tx=n.textContent,pos=0,W=LIM*2;while(tx.length-pos>LIM*4){var c=pos+W,sp=tx.lastIndexOf(" ",c);if(sp>pos+W*.6)c=sp+1;var r=splitAt(rest,c-pos);pieces.push(r[0]);rest=r[1];pos=c;await yieldUI(label,out.length)}}
  pieces.push(rest);
  for(var pi=0;pi<pieces.length;pi++){var pc=pieces[pi],before=M.lastChild;
   M.insertAdjacentHTML("beforeend",pc);
   if(M.scrollHeight<=M.clientHeight+1){acc+=pc;continue}
   while(M.lastChild!==before&&M.lastChild)M.removeChild(M.lastChild);
   acc=await place(pc,acc,out,label);M.innerHTML=acc}
  await yieldUI(label,out.length)}
 if(acc)out.push(acc)}
async function importEpub(f){if(tj&&tj.on){alert("Attendi la fine della traduzione prima di importare un EPUB.");return}cancelImp=false;LT=performance.now();busy(true,"Leggo l'EPUB…");await tick();
 try{var buf=await f.arrayBuffer(),u8=new Uint8Array(buf),dv=new DataView(buf),idx=zipIndex(u8,dv),dec=new TextDecoder("utf-8");
  var get=async function(n){var e=idx[n];if(!e){try{e=idx[decodeURIComponent(n)]}catch(x){}}return e?dec.decode(await zipRead(u8,dv,e)):null};
  var X=function(t){return new DOMParser().parseFromString(t,"application/xml")};
  var ct=await get("META-INF/container.xml");if(!ct)throw 0;
  var rf=X(ct).getElementsByTagName("rootfile")[0];if(!rf)throw 0;
  var opfp=rf.getAttribute("full-path"),opf=await get(opfp);if(!opf)throw 0;
  var od=X(opf),base=opfp.indexOf("/")>=0?opfp.slice(0,opfp.lastIndexOf("/")+1):"",man={};
  Array.prototype.slice.call(od.getElementsByTagName("item")).forEach(function(it){man[it.getAttribute("id")]={h:it.getAttribute("href")||"",t:it.getAttribute("media-type")||"",pr:it.getAttribute("properties")||""}});
  var sp=Array.prototype.slice.call(od.getElementsByTagName("itemref")).map(function(r){return man[r.getAttribute("idref")]}).filter(function(m){return m&&/html/i.test(m.t)&&!/\bnav\b/.test(m.pr)});
  var tl=od.getElementsByTagNameNS("*","title")[0],au=od.getElementsByTagNameNS("*","creator")[0];
  var title=(tl&&tl.textContent.trim())||f.name.replace(/\.epub$/i,""),author=au?au.textContent.trim():"";
  size();var LIM=perPage(),out=["<h1>"+esc(title)+"</h1>"+(author?"<p>"+esc(author)+"</p>":"")],got=0;
  for(var i=0;i<sp.length;i++){busy(true,"Capitolo "+(i+1)+" di "+sp.length+"…");await tick();
   var tx=await get(rsv(base,sp[i].h));if(!tx)continue;var html=cleanHtml(tx);if(!/\S/.test(textOf(html)))continue;await paginate(html,LIM,out,"Capitolo "+(i+1)+" di "+sp.length);got++}
  if(!got)throw 0;if(out.length%2)out.push("");
  if(JSON.stringify(S).length+JSON.stringify(out).length>4600000){busy(false);alert("Questo EPUB è troppo grande per essere salvato nel browser (limite di circa 4 MB di testo in totale). Elimina qualche libro o prova con un file più piccolo.");return}
  var b={id:"b"+Date.now()+Math.floor(Math.random()*999),title:title,pages:out,u:Date.now()};
  S.books.push(b);S.cur=b.id;book=b;s=0;busy(true,"Impagino…");await tick();
  reflowAll();save();render();buildHome();showReader()}
 catch(e){if(e==="cancel"){status("Importazione annullata")}else alert("Non riesco a leggere questo file. Serve un EPUB valido e senza protezione DRM.")}
 finally{busy(false)}}
$("busyx").onclick=function(){cancelImp=true;$("busyt").textContent="Annullo…"};
function pickEpub(){epf.click()}
$("epubb").onclick=pickEpub;$("epubm").onclick=pickEpub;
epf.onchange=function(){var f=this.files[0];this.value="";if(f)importEpub(f)};
/* traduzione del libro con il traduttore integrato del browser (Translator API di Chrome): gratuita, sul dispositivo, senza chiavi */
var TL=[["it","Italiano","Italian"],["en","English","English"],["es","Español","Spanish"],["fr","Français","French"],["de","Deutsch","German"],["pt","Português","Portuguese"],["nl","Nederlands","Dutch"],["pl","Polski","Polish"],["ru","Русский","Russian"],["ja","日本語","Japanese"],["zh","中文","Chinese (Simplified)"],["ar","العربية","Arabic"]],tj=null,trCache=null,tdb=null;
function tlName(c){return TL.filter(function(x){return x[0]===c})[0]||TL[0]}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function tro(){return new Promise(function(res,rej){if(tdb)return res(tdb);try{var r=indexedDB.open("libro3d-tr",1);r.onupgradeneeded=function(){r.result.createObjectStore("j",{keyPath:"id"})};r.onsuccess=function(){tdb=r.result;res(tdb)};r.onerror=function(){rej()}}catch(e){rej()}})}
function trGet(id){return tro().then(function(d){return new Promise(function(res){var q=d.transaction("j").objectStore("j").get(id);q.onsuccess=function(){res(q.result||null)};q.onerror=function(){res(null)}})}).catch(function(){return null})}
function trPut(j){return tro().then(function(d){return new Promise(function(res){var x=d.transaction("j","readwrite");x.objectStore("j").put(j);x.oncomplete=res;x.onerror=res})}).catch(function(){})}
function trDel(id){return tro().then(function(d){return new Promise(function(res){var x=d.transaction("j","readwrite");x.objectStore("j").delete(id);x.oncomplete=res;x.onerror=res})}).catch(function(){})}
/* il libro torna un testo continuo: i paragrafi spezzati dal cambio pagina vengono riuniti */
function srcHtml(b){var parts=[];b.pages.forEach(function(pg){if(!pg||!/\S/.test(pg))return;var l=parts.length-1;
 if(l>=0&&/<\/p>$/.test(parts[l])&&/^<p[ >]/.test(pg)){var t=parts[l].slice(-400).replace(/<[^>]*>/g,"").trim().slice(-1);if(t&&!/[.!?…:;»"”’)\]]/.test(t)){parts[l]=parts[l].slice(0,-4)+" "+pg.replace(/^<p[^>]*>/,"");return}}
 parts.push(pg)});return parts.join("")}
function trSegs(b){var html=srcHtml(b).replace(/<\/?(mark|span)[^>]*>/gi,"").replace(/ style="[^"]*"/gi,""),d=document.createElement("div");d.innerHTML=html;var segs=[],acc="",al=0,SEG=3200;
 function flush(){if(acc){segs.push(acc);acc="";al=0}}
 Array.prototype.slice.call(d.childNodes).forEach(function(n){var oh,len;
  if(n.nodeType===3){if(!/\S/.test(n.nodeValue))return;oh="<p>"+esc(n.nodeValue)+"</p>";len=n.nodeValue.length}
  else if(n.nodeType===1){len=n.textContent.length;if(!len)return;oh=n.outerHTML}else return;
  if(len>SEG*1.6){flush();var tx=n.textContent,pos=0,rest=oh;while(tx.length-pos>SEG*1.6){var c=pos+SEG,sp=tx.lastIndexOf(" ",c);if(sp>pos+SEG*.6)c=sp+1;var r=splitAt(rest,c-pos);segs.push(r[0]);rest=r[1];pos=c}acc=rest;al=tx.length-pos;return}
  if(/^H[1-3]$/.test(n.tagName)&&al>600)flush();
  if(al&&al+len>SEG)flush();acc+=oh;al+=len});
 flush();return segs}
function trErr(e){return e&&e.message||String(e)}
var BLK=/^(P|H[1-6]|LI|DIV|BLOCKQUOTE|UL|OL|TABLE|THEAD|TBODY|TR|TD|TH|FIGURE|FIGCAPTION|SECTION|ARTICLE)$/,BLKSEL="p,h1,h2,h3,h4,h5,h6,li,div,blockquote,ul,ol,table,tr,td,th,figure,section,article";
function trLeaves(root,out){Array.prototype.slice.call(root.children).forEach(function(c){if(BLK.test(c.tagName)&&c.querySelector(BLKSEL))trLeaves(c,out);else out.push(c)})}
/* spezza un testo lungo in pezzi per frasi (il traduttore ha un limite di input) */
function trSplit(t,max){if(t.length<=max)return[t];var ss=t.match(/[^.!?…]+[.!?…]+["»”’)\]]*\s*|[^.!?…]+$/g)||[t],o=[],cur="";
 ss.forEach(function(x){while(x.length>max){var c=x.lastIndexOf(" ",max);if(c<max*.5)c=max;if(cur){o.push(cur);cur=""}o.push(x.slice(0,c));x=x.slice(c)}
  if(cur&&cur.length+x.length>max){o.push(cur);cur=""}cur+=x});if(cur)o.push(cur);return o.map(function(x){return x.trim()}).filter(Boolean)}
/* traduce un frammento di testo; se è interamente in corsivo/grassetto ecc. rimette gli stessi tag attorno */
async function trPiece(part,cfg){var op="",cl="",x=part,m;
 while((m=/^\s*<(b|i|u|s|em|strong|sub|sup)(?:\s[^>]*)?>([\s\S]*)<\/\1>\s*$/i.exec(x))){var t=m[1].toLowerCase();op+="<"+t+">";cl="</"+t+">"+cl;x=m[2]}
 if(/</.test(x)){op="";cl="";x=part}
 var d=document.createElement("div");d.innerHTML=x;var txt=d.textContent.replace(/\s+/g," ").trim();
 if(!/[\p{L}\p{N}]/u.test(txt))return part;
 var lead=/^\s/.test(part)?" ":"",trail=/\s$/.test(part)?" ":"",ch=trSplit(txt,1200),out=[];
 for(var k=0;k<ch.length;k++){if(tj.cancel)throw"cancel";out.push(await cfg.T.translate(ch[k],{signal:tj.ac.signal}))}
 return lead+op+esc(out.join(" "))+cl+trail}
async function trDo(i,job,segs,cfg){var d=document.createElement("div");d.innerHTML=segs[i];var leaves=[];trLeaves(d,leaves);
 for(var k=0;k<leaves.length;k++){if(tj.cancel)throw"cancel";var el=leaves[k],parts=el.innerHTML.split(/<br\s*\/?>/i),res=[];
  for(var p=0;p<parts.length;p++)res.push(await trPiece(parts[p],cfg));el.innerHTML=res.join("<br>")}
 var clean=cleanHtml(d.innerHTML);if(!/\S/.test(textOf(clean)))throw new Error("Una sezione è risultata vuota dopo la traduzione.");job.out[i]=clean}
async function trDetect(b){if(!("LanguageDetector" in self))return null;
 try{var t=textOf(srcHtml(b)).replace(/\s+/g," ").trim(),mid=Math.max(0,Math.floor(t.length/2)-1500),det=await LanguageDetector.create(),r=await det.detect(t.slice(mid,mid+3000));
  return r&&r[0]&&r[0].detectedLanguage!=="und"&&r[0].confidence>.5?r[0].detectedLanguage:null}catch(e){return null}}
/* aggiunge in coda a un libro il testo tradotto di una sezione, riempiendo l'ultima pagina */
async function trAppend(b,html){trQuiet=true;cancelImp=false;LT=performance.now();
 try{size();var full=false;
  if(b.lay!==sigNow()){var kb=book;book=b;try{reflowAll()}finally{book=kb}full=true}
  var LIM=perPage(),len=b.pages.length;
  while(len>0&&!/\S/.test(textOf(b.pages[len-1])))len--;
  var parts=html.split(/(?=<h1[ >])/i).filter(function(x){return /\S/.test(textOf(x))}),tail=[],base=len;
  for(var i=0;i<parts.length;i++){var ph=parts[i];
   if(i===0&&len>0&&!/^\s*<h1[ >]/i.test(ph)){ph=b.pages[len-1]+ph;base=len-1}
   await paginate(ph,LIM,tail,"")}
  if((base+tail.length)%2)tail.push("");
  Array.prototype.splice.apply(b.pages,[base,b.pages.length-base].concat(tail));
  b.u=Date.now();b.lay=sigNow();trRefresh(b,base,full)}
 finally{trQuiet=false}}
/* se il libro tradotto è aperto, mostra subito le pagine nuove senza disturbare la lettura */
function trRefresh(b,from,full){if(book!==b||reader.hidden)return;
 if(full){render();return}
 var ae=document.activeElement,ls=bookEl.querySelectorAll(".leaf");
 for(var k=0;k<ls.length;k++){if(2*(+ls[k].dataset.i)>=from&&!(ae&&ls[k].contains(ae)))bookEl.removeChild(ls[k])}
 pos()}
async function trRun(src,cfg,job,segs){
 if(tj&&tj.on)return;tj={on:true,cancel:false,ac:new AbortController(),b:null};var n=segs.length,fail=null,lastPut=0,next=1,b=null,pumping=null;
 if(job.bookId)b=S.books.filter(function(x){return x.id===job.bookId&&x.tr})[0]||null;
 if(!b)job.bookId=null;
 else if(job.reset){b.pages=[];b.tr.part=0;b.tr.live=true}
 job.reset=false;tj.b=b;
 function done(){var c=0;job.out.forEach(function(x){if(x)c++});return c}
 function ui(){var d=done();$("trt").textContent="Traduzione in "+tlName(cfg.lang)[1]+" · "+Math.round(d/n*100)+"% ("+d+"/"+n+")";$("trbar").style.width=(d/n*100)+"%";
  $("trop").hidden=!b||(book===b&&!reader.hidden)}
 function persist(f){if(f||Date.now()-lastPut>3000){lastPut=Date.now();return trPut(job)}}
 /* impagina nel libro, in ordine, le sezioni già tradotte: la lettura può iniziare subito */
 function pump(){if(pumping)return pumping;
  pumping=(async function(){await null;try{
   for(;;){var k=b?b.tr.part:0;if(k>=n||!job.out[k])break;
    if(!b){b={id:"b"+Date.now()+Math.floor(Math.random()*999),title:src.title+" ("+tlName(cfg.lang)[1]+")",pages:[],u:Date.now(),lay:sigNow(),sh:src.sh,tr:{from:src.id,lang:cfg.lang,part:0,live:true}};
     S.books.push(b);tj.b=b;job.bookId=b.id;dirty[b.id]=1;buildHome();trPut(job);toast("Le prime pagine sono pronte: tocca «Apri» per leggerle mentre la traduzione continua.")}
    if(S.books.indexOf(b)<0){fail=new Error("Il libro tradotto è stato eliminato.");tj.cancel=true;tj.ac.abort();break}
    var snap=b.pages.slice();await trAppend(b,job.out[k]);
    if(JSON.stringify(S).length>4600000){b.pages=snap;trRefresh(b,0,true);fail=new Error("Spazio del browser esaurito (limite di circa 4 MB di testo in totale). Elimina qualche libro e usa «Continua».");tj.cancel=true;tj.ac.abort();break}
    b.tr.part=k+1;dirty[b.id]=1;persistLocal();ui()}
  }catch(e){if(e!=="cancel"&&!fail)fail=e;tj.cancel=true;tj.ac.abort()}
  pumping=null})();return pumping}
 async function one(i){try{await trDo(i,job,segs,cfg);ui();persist();pump()}catch(e){if(!tj.cancel&&!fail)fail=e}}
 async function worker(){while(!fail&&!tj.cancel){var i=next++;if(i>=n)return;if(job.out[i])continue;await one(i)}}
 $("trp").hidden=false;$("trx").textContent="Interrompi";ui();
 pump();
 if(!job.out[0])await one(0);
 await worker();try{cfg.T.destroy()}catch(e){}
 await pump();await persist(true);$("trp").hidden=true;var was=tj.cancel;tj.on=false;var d=done();
 if(d<n||(b&&b.tr.part<n)){var pc=Math.round(d/n*100),keep=b?" Le pagine già tradotte restano nel libro «"+b.title+"».":"";
  if(fail)alert("Traduzione interrotta al "+pc+"%: "+trErr(fail)+"\nI progressi sono salvati: riprendi da ⋯ → Traduci libro → Continua."+keep);
  else toast("Traduzione interrotta al "+pc+"%. Riprendila da ⋯ → Traduci libro."+keep);return}
 if(b){delete b.tr.part;delete b.tr.live;b.u=Date.now();dirty[b.id]=1;persistLocal();buildHome()}
 await trDel(job.id);
 toast("Traduzione completata: «"+(b?b.title:"")+"»"+(b&&book!==b?" è nella tua libreria.":"."))}
function trOpenLive(){var b=tj&&tj.b;if(!b||S.books.indexOf(b)<0)return;S.cur=b.id;book=b;s=0;size();if(b.lay!==sigNow())reflowAll();render();showReader()}
var trm=$("trm");
TL.forEach(function(l){var o=document.createElement("option");o.value=l[0];o.textContent=l[1];$("trlang").appendChild(o)});
async function trCheck(){if(!trCache||trCache.id!==book.id||trCache.u!==book.u)trCache={id:book.id,u:book.u,segs:trSegs(book)};var segs=trCache.segs,ch=0;
 segs.forEach(function(x){ch+=x.replace(/<[^>]*>/g,"").length});var N=segs.length,ok="Translator" in self;
 $("tri").innerHTML="«"+esc(book.title||"Senza titolo")+"»: circa "+Math.round(ch/6).toLocaleString("it-IT")+" parole in "+N+" sezioni.<br>"+(ok?
  "Traduzione gratuita eseguita sul tuo dispositivo dal browser: nessuna chiave e nessun testo inviato online. La prima volta per ogni coppia di lingue Chrome scarica un piccolo modello. Le pagine tradotte compaiono man mano nel libro nuovo: puoi aprirlo e leggere mentre il resto continua. Tieni aperta questa scheda durante la traduzione. Il corsivo o il grassetto su singole parole dentro una frase non viene mantenuto.":
  "<b>Questo browser non ha il traduttore integrato.</b> Serve Chrome per computer (versione 138 o successiva). Apri il file da lì per usare la traduzione.");
 $("trgo").disabled=!ok;
 var j=await trGet(book.id+"|"+$("trlang").value),d=0;if(j&&j.total===N)j.out.forEach(function(x){if(x)d++});
 $("trres").hidden=!d;$("trres").textContent=d>=N?"Completa e impagina":"Continua ("+Math.round(d/N*100)+"%)"}
function trOpen(){if(tj&&tj.on){toast("Una traduzione è già in corso");return}if(!book||!book.pages.some(function(x){return /\S/.test(x)})){alert("Questo libro non ha ancora testo da tradurre.");return}
 var c=S.tr||{};if(c.key){delete c.key;mpm()}
 $("trlang").value=c.lang||"it";$("trsrc").value=c.src||"auto";trm.hidden=false;trCheck()}
async function trStart(resume){
 if(!("Translator" in self)){alert("Questo browser non ha il traduttore integrato. Usa Chrome per computer (versione 138 o successiva).");return}
 var lang=$("trlang").value,sel=$("trsrc").value;
 if(!resume&&!$("trres").hidden&&!confirm("Esiste già una traduzione parziale. Ricominciare da capo? I progressi salvati andranno persi."))return;
 var src=book,segs=trCache&&trCache.id===src.id&&trCache.u===src.u?trCache.segs:trSegs(src),n=segs.length;
 if(!n){alert("Il libro non contiene testo da tradurre.");return}
 var from=sel;
 if(sel==="auto"){from=await trDetect(src);if(!from){alert("Non riesco a riconoscere la lingua del libro: scegliela a mano da «Lingua originale».");return}}
 if(from===lang){alert("La lingua originale e quella di destinazione sono la stessa.");return}
 var av="unavailable";try{av=await Translator.availability({sourceLanguage:from,targetLanguage:lang})}catch(e){}
 if(av==="unavailable"){alert("Il browser non può tradurre da «"+from+"» a «"+lang+"». Prova con un'altra lingua.");return}
 S.tr={lang:lang,src:sel};mpm();trm.hidden=true;
 $("trp").hidden=false;$("trt").textContent="Preparo il traduttore…";
 var T;try{T=await Translator.create({sourceLanguage:from,targetLanguage:lang,monitor:function(m){m.addEventListener("downloadprogress",function(e){$("trt").textContent="Scarico il modello linguistico… "+Math.round(e.loaded*100)+"%"})}})}
 catch(e){$("trp").hidden=true;alert("Impossibile avviare il traduttore ("+trErr(e)+"). Se doveva scaricare un modello, riprova e attendi: il download parte solo dopo un tuo click.");return}
 var id=src.id+"|"+lang,job=resume?await trGet(id):null;
 if(!job||job.total!==n){var oj=resume?null:await trGet(id);job={id:id,total:n,out:[],gloss:{},style:"",lang:lang};for(var k=0;k<n;k++)job.out.push(null);if(oj&&oj.bookId){job.bookId=oj.bookId;job.reset=true}}
 trRun(src,{lang:lang,T:T},job,segs)}
TL.forEach(function(l){var o=document.createElement("option");o.value=l[0];o.textContent=l[1];$("trsrc").appendChild(o)});
$("trb").onclick=trOpen;$("trcl").onclick=function(){trm.hidden=true};$("trlang").onchange=trCheck;
$("trgo").onclick=function(){trStart(false)};$("trres").onclick=function(){trStart(true)};
$("trop").onclick=trOpenLive;
$("trx").onclick=function(){if(tj&&tj.on){tj.cancel=true;tj.ac.abort();$("trx").textContent="Interrompo…"}};
function mInit(){dbAll().then(function(a){tracks=a.sort(function(x,y){return x.id<y.id?-1:1});mList()});document.getElementById("mv").value=mus().vol;au.volume=mus().vol/100;mUIb()}
load();book=cb();S.cur=book.id;size();if(book.lay!==sigNow())reflowAll();render();buildHome();mInit();status("Salvato su questo dispositivo");cloudInit();
})();
