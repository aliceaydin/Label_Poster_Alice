document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("replyInput");
  const paper = document.getElementById("paper");
  const printBtn = document.getElementById("printBtn");
  const charCount = document.getElementById("charCount");
  const SHAPES_DEFS = document.getElementById("shapes-defs");

  if(!input || !paper || !printBtn || !charCount || !SHAPES_DEFS){
    console.error("Ein wichtiges Element fehlt im DOM!");
    return;
  }

  const POSTER_FONTS = [
    "TASA Orbiter",
    "Rubik Glitch",
    "Tilt Neon",
    "Bungee"
  ];

  const PADDING = 16;
  const THROTTLE_MS = 80;

  function rnd(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967295;}
  function rndInt(a,b){return Math.floor(rnd()*(b-a+1))+a;}
  function rndRange(a,b){return rnd()*(b-a)+a;}
  function pick(a){return a[Math.floor(rnd()*a.length)];}

  function getShapes(){
    return Array.from(SHAPES_DEFS.children).map(n=>n.cloneNode(true));
  }

  function setPaperHeight(mm){
    paper.style.height = mm+"mm";
    return new Promise(res=>requestAnimationFrame(()=>{
      const r = paper.getBoundingClientRect();
      res({w:r.width,h:r.height});
    }));
  }

  function createSvg(w,h){
    const ns="http://www.w3.org/2000/svg";
    const svg=document.createElementNS(ns,"svg");
    svg.setAttribute("viewBox",`0 0 ${w} ${h}`);
    svg.setAttribute("width","100%");
    svg.setAttribute("height","auto");

    const bg=document.createElementNS(ns,"rect");
    bg.setAttribute("width",w);
    bg.setAttribute("height",h);
    bg.setAttribute("fill","#fff");
    svg.appendChild(bg);

    return svg;
  }

  function safeBBox(el){try{return el.getBBox();}catch(e){return null;}}

  function addText(svg,x,y,txt,size){
    const ns="http://www.w3.org/2000/svg";
    const t=document.createElementNS(ns,"text");
    t.setAttribute("x",x);
    t.setAttribute("y",y);
    t.setAttribute("font-family", pick(POSTER_FONTS)+", sans-serif");
    t.setAttribute("font-size",size);
    t.setAttribute("font-weight",900);
    t.setAttribute("fill","#000");
    t.textContent=txt;
    svg.appendChild(t);

    if(rnd()<0.4){
      const b=safeBBox(t);
      if(b){
        const cx=b.x+b.width/2;
        const cy=b.y+b.height/2;
        t.setAttribute(
          "transform",
          `rotate(${pick([0,90,-90,180])} ${cx} ${cy})`
        );
      }
    }
    return t;
  }

  function fitTextToWidth(el,maxWidth){
    const box=safeBBox(el);
    if(!box||box.width<=maxWidth) return;
    const sx=maxWidth/box.width;
    el.setAttribute("transform",
      (el.getAttribute("transform")||"")+` scale(${sx} 1)`
    );
  }

  function duplicateAlt(svg,base,copies=3,step=6){
    const b=safeBBox(base); if(!b) return;
    for(let i=1;i<=copies;i++){
      const c=base.cloneNode(true);
      c.setAttribute("fill",i%2?"#fff":"#000");
      c.setAttribute(
        "transform",
        (c.getAttribute("transform")||"")+
        ` translate(${step*i*(i%2?1:-1)},${step*i*(i%2?1:-1)})`
      );
      svg.appendChild(c);
    }
  }

  function placeBigShape(svg,shapes,w,h){
    if(!shapes.length) return;
    const s=pick(shapes);
    const g=s.cloneNode(true);
    g.setAttribute(
      "transform",
      `translate(${rndRange(w*0.2,w*0.8)} ${rndRange(h*0.3,h*0.95)})
       rotate(${pick([0,90,180,-90])})
       scale(${rndRange(0.4,1.8)})`
    );
    Array.from(g.querySelectorAll("*")).forEach(n=>{
      n.setAttribute("fill","#000");
      n.setAttribute("stroke","none");
    });
    svg.appendChild(g);
  }

  function posterVertical(svg,lines,w,h){
    let y=h*0.12;
    lines.forEach(txt=>{
      const size = rnd()<0.3
        ? rndRange(h*0.25,h*0.6)
        : rndRange(h*0.08,h*0.18);
      const t=addText(svg,PADDING,y,txt,Math.round(size));
      fitTextToWidth(t,w-PADDING*2);
      if(rnd()>0.6) duplicateAlt(svg,t,rndInt(1,4),6);
      y+=size*0.9;
    });
    if(y<h*0.85){
      const filler=pick(lines);
      const size=rndRange(h*0.18,h*0.35);
      addText(svg,PADDING,h*rndRange(0.7,0.92),filler,size);
    }
  }

  function posterPattern(svg,lines,w,h){
    const word=pick(lines);
    const cols=rndInt(2,4);
    const rows=rndInt(4,8);
    const size=rndRange(h*0.08,h*0.16);
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const t=addText(svg,PADDING+c*(w/cols),PADDING+r*size*1.3,word,size);
        if(rnd()<0.4) duplicateAlt(svg,t,2,4);
      }
    }
  }

  function composePoster(lines,w,h){
    paper.innerHTML="";
    const svg=createSvg(w,h);
    paper.appendChild(svg);

    const shapes=getShapes();
    pick([posterVertical,posterPattern])(svg,lines,w,h);
    if(rnd()<0.8) placeBigShape(svg,shapes,w,h);
    if(rnd()<0.5) placeBigShape(svg,shapes,w,h);
  }

  let timer=null;

  function generate(){
    const txt=input.value.trim();
    charCount.textContent=`${txt.length}/250`;
    if(!txt){paper.innerHTML="";return;}

    let words=txt.split(/\s+/);
    if(rnd()<0.35 && words.length>3){
      words=words.map(w=>rnd()<0.3?w.toUpperCase():w);
    }

    let lines=[],line="";
    words.forEach(w=>{
      if((line+" "+w).length<20) line+=" "+w;
      else{lines.push(line.trim()); line=w;}
    });
    if(line) lines.push(line.trim());

    const mm_height=180 + txt.length*2.2 + Math.pow(txt.length,1.15);

    setPaperHeight(mm_height).then(dim=>{
      clearTimeout(timer);
      timer=setTimeout(()=>composePoster(lines,dim.w,dim.h),THROTTLE_MS);
    });
  }

  const QUESTIONS = [
  "What did you find here without looking for it?",
  "What will you remember from today?",
  "What are you thinking about right now?"
];

// setze beim Laden der Seite zufällig eine Frage
document.querySelector(".q-text").textContent = pick(QUESTIONS);

  input.addEventListener("input",generate);
  printBtn.addEventListener("click",()=>window.print());
  generate();
});
