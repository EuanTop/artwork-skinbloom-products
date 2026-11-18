/** Original BornWithSkin software, moved into the document artwork host. */
import {css} from './style';
import {originalReaderCss} from './original-reader-style';
import {originalBubblePosition,originalScene,type OriginalScene,type OriginalTheme} from './original-scene';
import {originalPages,originalSkinInquiry,originalTitle,type OriginalPage,type OriginalBubble} from './original-content';
import {originalPackage,personFigure,originalHand,sourceNoise} from './original-packaging';
type Values=Record<string,number|string|boolean>;
type Context={root:HTMLElement;width:number;height:number;parameters:Values;data:Record<string,unknown>[];mapping:unknown;seed:number;time:number;selectedId:string|null;mode:'screen'|'poster';onParameters:(p:Values)=>void;onSelected:(id:string|null)=>void};
const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const flag=(value:unknown)=>value===true||value===1||value==='1'||value==='true';
const colors:Record<string,string>={'.red':'#ff453a','.yellow':'#ffd60a'};
const color=(p:OriginalPage)=>colors[p.cardColor]??p.cardColor;
const fields=['in_cleanser','in_moist','in_suncreen','in_acne','in_brighten','in_repair','in_anti_aging'];
const ICONS={
 face:'<circle cx="12" cy="12" r="9.3" fill="currentColor" stroke="none"/><path d="M8 14q4 4.5 8 0M8.5 9h.1M15.5 9h.1" stroke="var(--bg)" stroke-linecap="round"/>',
 table:'<path d="M12 21H5V3h9l4 4v4M14 3v5h4M8 9h2m-2 4h2"/><circle cx="15.8" cy="16.9" r="3.4"/><path d="m18.2 19.3 3 3"/>',
 sun:'<circle cx="12" cy="12" r="4.2"/><path stroke-linecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>',
 moon:'<path d="M18.8 16.4A8.8 8.8 0 0 1 8.2 5a8.7 8.7 0 1 0 10.6 11.4Z" fill="currentColor"/><path d="M17 3v5m-2.5-2.5h5M21 9v3m-1.5-1.5h3"/>',
 back:'<path stroke-linecap="round" stroke-linejoin="round" d="m15 4-8 8 8 8"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/>',
 learned:'<path d="m12 1 3 2.2 3.6.2 1.2 3.4 2.8 2.2-.9 3.5.9 3.5-2.8 2.2-1.2 3.4-3.6.2L12 24l-3-2.2-3.6-.2-1.2-3.4L1.4 16l.9-3.5-.9-3.5 2.8-2.2 1.2-3.4L9 3.2z" fill="currentColor" stroke="none"/><path d="m7 12 3.4 3.4 6.6-7" stroke="var(--bg)"/>',
 info:'<circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 11v6m0-10h.01"/>',
};
const icon=(name:keyof typeof ICONS)=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${ICONS[name]}</svg>`;
const skinTypes=['Combination','Dry','Normal','Oily','Sensitive'];
const efficacy=[
 [0,'Clean','#30d158'],[1,'Moist','#0a84ff'],[2,'Suncreen','#ff9f0a'],
 [4,'Brighten','#8e8e93'],[3,'Acne','#ff453a'],[5,'Repair','#ffd60a'],[6,'Anti-aging','#bf5af2'],
] as const;
function saved(key:string){
 try{return localStorage.getItem('born-with-skin:'+key);}catch{return null;}
}
function save(key:string,value:string){
 try{localStorage.setItem('born-with-skin:'+key,value);}catch{/* Preview may be sandboxed. */}
}
export function createArtwork(initial:Context){
 let context=initial,signature='',disposed=false,selectedSkin='',search='',listLimit=80;
 let galleryOffset={x:0,y:0},previousFocus:HTMLElement|null=null;
 let theme:OriginalTheme=saved('theme')==='light'?'light':'dark';
 let skinType=saved('skin')||String(initial.parameters.skinType||'Normal');
 let introComplete=!!saved('skin');
 let alertTimer:ReturnType<typeof setTimeout>|undefined,resetTimer:ReturnType<typeof setTimeout>|undefined;
 let alertPage:number|null=null,essenceOffset=0;
 let guideOpen=false,tableScope:'global'|'lesson'='global';
 const stateSignature=(next:Context)=>JSON.stringify([next.parameters,next.mode,next.width,next.height]);
 const instanceId='ow-'+Math.random().toString(36).slice(2,10);
 const root=document.createElement('article');root.className='ow-app';root.setAttribute('aria-label','Born with Skin');initial.root.append(root);
 const category=()=>{const n=Number(context.parameters.category??-1);return n>=0&&n<7?n:-1;};
 const currentPage=()=>originalPages[category()];
 const poster=()=>context.mode==='poster';
 function change(partial:Values, redraw:()=>void=render){
  if(disposed)return;
  context={...context,parameters:{...context.parameters,...partial}};
  signature=stateSignature(context);
  redraw();
  context.onParameters(partial);
 }
 const volume=(page:OriginalPage,expanded=false)=>`<div class="ow-volume${expanded?" ow-page-volume":""}"><span>vol</span><b>${page.id}</b></div>`;
 const header=()=>`<header class="ow-header"><h1>${originalTitle}</h1>
   ${poster()?"":`
   <button data-action="theme" aria-label="${theme==="dark"?"Light appearance":"Dark appearance"}" title="${theme==="dark"?"Light appearance":"Dark appearance"}">${icon(theme==="dark"?"sun":"moon")}</button>
   <button data-action="skin" aria-label="What's my skin type?" title="What's my skin type?">${icon("face")}</button>
   <button data-action="global-table" aria-label="Table" title="Table">${icon("table")}</button>
   `}</header>`;
 const galleryHorizontal=()=>context.width>=720 && context.width/context.height>=.93;
 function gallery(){
  const mode=galleryHorizontal();
  return `<div class="ow-gallery" data-horizontal="${mode}">
    ${mode?`<div class="ow-person" style="--figure-height:${Math.min(context.height-24,context.width*.63)}px">${personFigure(theme)}</div>`:""}
    <div class="ow-gallery-track" data-horizontal="${mode}" style="--gallery-inset:${Math.min(68,context.height*.078)}px">
      ${originalPages.map((page,index)=>`<button class="ow-card" data-category="${index}" aria-label="${esc(page.title)}" style="--card:${color(page)}">
        <h2>${esc(page.title)}</h2>${originalPackage(page,false,false,theme)}
        ${learned() & (1<<index)?`<span class="ow-learned" aria-label="Learned">${icon("learned")}</span>`:""}${volume(page)}
      </button>`).join("")}
    </div>
  </div>`;
 }
 const learned=()=>Number(context.parameters.learned??0)|Number(saved('learned')??0);
 function bubbleContents(bubble:OriginalBubble,pageId:number){
  const literals=[...bubble.labelSwift.matchAll(/Text\(("(?:\\.|[^"\\])*")\)/g)];let position=0;
  const runs=bubble.texts.map(text=>{const plain=text.replace(/\\n/g,'\n');let style='';
   for(let i=position;i<literals.length;i++){let decoded='';try{decoded=JSON.parse(literals[i][1]);}catch{}if(decoded!==plain)continue;position=i+1;const after=bubble.labelSwift.slice(literals[i].index!+literals[i][0].length,literals[i+1]?.index??bubble.labelSwift.length).replace(/\/\/[^\n]*/g,'');const explicit=after.match(/\.font\(\.system\(size:\s*([\d.]+)/);let size=explicit?Number(explicit[1]):after.includes('.font(.title3)')?20:after.includes('.font(.title2)')?22:after.includes('.font(.title)')?28:17;style=`font-size:${size/17}em;font-weight:${after.includes('.bold()')||after.includes('weight: .bold')||after.includes('.fontWeight(.bold)')?700:400};${after.includes('design: .serif')?'font-family:var(--label-serif);':''}`;break;}
   return {plain,style};
  });
  const paragraph=(run:typeof runs[number],align?:'center')=>`<p style="${run.style}${align?';text-align:center':''}">${esc(run.plain)}</p>`;
  const inline=(list:typeof runs)=>`<p>${list.map(run=>`<span style="${run.style}">${esc(run.plain)}</span>`).join('')}</p>`;
  let out=runs.map((run,i)=>paragraph(run,
    (pageId===1&&bubble.id>=3&&i===0)||(pageId===5&&i===1)||(pageId===4&&bubble.id===2&&i===0)?'center':undefined)).join('');
  if(pageId===4&&bubble.id===2&&runs.length===7){
   out=`${paragraph(runs[0],'center')}<div class="ow-bubble-columns" role="group" aria-label="Classifacation">
    <div>${[runs[1],runs[3],runs[4]].map(run=>paragraph(run,'center')).join('')}</div>
    <div>${[runs[2],runs[5]].map(run=>paragraph(run,'center')).join('')}</div>
   </div>${paragraph(runs[6],'center')}`;
  }else if(pageId===7||(pageId===2&&bubble.id===1)||(pageId===6&&bubble.id===1)){
   out=inline(runs);
  }else if(pageId===2&&bubble.id===3){
   out=[0,2,4].map(i=>`<div class="ow-bubble-definition">${runs.slice(i,i+2).map(run=>paragraph(run)).join('')}</div>`).join('');
  }
  if(pageId===3&&bubble.id===2)out=`<svg class="ow-ray-diagram" viewBox="0 0 240 72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M153 26 48 68l45-24M174 27l-30 43 5-21"/>
    <g transform="translate(165 0) scale(1.2)">${ICONS.sun}</g>
   </svg>${out}`;
  if(pageId===4&&bubble.id===3)out+=`<svg class="ow-caution-symbol" viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 10 18H2zM12 8v6m0 2v2"/></svg>`;
  if(bubble.ingredientItems?.length)out+=bubble.ingredientItems.map(item=>`<div class="ow-ingredient-source">${bubble.ingredientFields?.includes('name')?`<h3>${esc(item.name)}</h3>`:''}${(bubble.ingredientFields??[]).filter(field=>field!=='name'&&item[field]).map(field=>`<p>${field==='function'&&bubble.labelSwift.includes('ingredient.function')?'&quot;':''}${esc(item[field])}${field==='function'&&bubble.labelSwift.includes('ingredient.function')?'&quot;':''}</p>`).join('')}</div>`).join('');return out;
 }

 function scene():OriginalScene{
  const width=root.clientWidth||context.width;
  const headerHeight=width<=650?65:80;
  return originalScene(width,context.height-headerHeight,poster());
 }
 function bubbleMarkup(page:OriginalPage,layout:OriginalScene){
  const {width,height}=layout;
  const filter=instanceId+'-bubbles-'+page.id;
  const bubbles=page.bubbles.map(b=>({b,...originalBubblePosition(b,layout)}));
  const motionStyle=(item:typeof bubbles[number],label=false)=>`--from-x:${item.fromX}px;--from-y:${item.fromY}px;animation-delay:${poster()?0:item.b.delay+(label?.20:.10)}s`;
  return `<svg class="ow-bubble-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <defs><filter id="${filter}" x="-35%" y="-50%" width="170%" height="200%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="10"/>
      <feComponentTransfer><feFuncA type="linear" slope="30" intercept="-12"/></feComponentTransfer>
    </filter></defs>
    <g filter="url(#${filter})">${bubbles.map(item=>`<circle class="ow-bubble-circle" cx="${item.x}" cy="${item.y}" r="${item.diameter/2}" fill="${theme==='dark'?'white':'black'}" style="${motionStyle(item)}"/>`).join('')}</g>
  </svg>${bubbles.map(item=>{
   const {b,x,y,diameter}=item,d=diameter*.8;
   const left=Math.max(10,x-d/2),top=Math.max(5,y-d/2);
   const textWidth=Math.max(1,Math.min(width-left-10,d));
   const textHeight=Math.max(1,Math.min(height-top-10,d));
   const center=b.labelSwift.includes('.multilineTextAlignment(.center)');
   return `<div class="ow-bubble-text" data-topic="${page.id}:${b.id}" data-align="${center?'center':'leading'}" data-original-bubble="${page.id}:${b.id}"
    style="left:${left}px;top:${top}px;width:${textWidth}px;height:${textHeight}px;${motionStyle(item,true)}">${bubbleContents(b,page.id)}</div>`;
  }).join('')}`;
 }
 function active(page:OriginalPage,force=false){
  const layout=scene(),{width,height,scale}=layout,engaged=force||Boolean(context.parameters.engaged);
  const viewWidth=Math.min(root.clientWidth||context.width,width*scale);
  return `<div class="ow-scene-window" style="--view-width:${width*scale}px;--view-height:${height*scale}px">
   <section class="ow-expanded" data-original-page="${page.className}" style="--card:${color(page)};--scene-w:${width}px;--scene-h:${height}px;--scene-scale:${scale};--package-size:${Math.min(width,height)}px;--nav-width:${viewWidth/scale}px">
    <div class="ow-expanded-nav"><button class="ow-back" data-action="back">${icon('back')} Back</button><button data-action="table" aria-label="Table">${icon('table')}</button></div>
    <div class="ow-scene-art"><div class="ow-bubbles">${engaged?bubbleMarkup(page,layout):''}</div>
    <div class="ow-active-package">${originalPackage(page,engaged,!poster(),theme)}</div></div>
    <h2 class="ow-page-title">${esc(page.title)}</h2>${volume(page,true)}
   </section>
  </div>`;
 }
 function parseList(value:unknown):string[]{if(Array.isArray(value))return value.map(String);try{const data=JSON.parse(String(value));if(Array.isArray(data))return data.map(String);}catch{}return[];}
 function visibleCatalogue(){
  const page=currentPage();
  const rows=tableScope==='lesson'&&page?context.data.filter(row=>flag(row[fields[page.id-1]])):context.data;
  const query=search.trim().toLowerCase();
  if(!query)return rows;
  const includes=(v:unknown)=>String(v).toLowerCase().includes(query);
  const matches=[...rows.filter(row=>includes(row.Name)),...rows.filter(row=>includes(row.Brand))];
  if(tableScope==='lesson')matches.push(...rows.filter(row=>parseList(row.Ingredients).some(includes)));
  return [...new Set(matches)];
 }
 const dots=(row:Record<string,unknown>)=>`<span class="ow-dots">${efficacy.filter(([index])=>flag(row[fields[index]])).map(([,label,color])=>`<span class="ow-dot" style="--dot:${color}" role="img" aria-label="${label}" title="${label}"></span>`).join('')}</span>`;
 function inapplicable(row:Record<string,unknown>,fallback=''){
  const types=skinTypes.filter(type=>!flag(row[type]));
  if(types.length===skinTypes.length)return 'Unknown';
  if(!types.length)return fallback;
  const name=types[0];
  return `<span class="${name===skinType?'ow-warning':''}">${name==='Combination'?name:name.toLowerCase()}</span>`;
 }
 function skinInquiry(){
  return `<div class="ow-skin-content">
   <h2 id="${instanceId}-dialog">${esc(skinType?originalSkinInquiry.currentTitlePrefix+skinType:originalSkinInquiry.title)}</h2>
   ${originalSkinInquiry.types.map(type=>`<label class="ow-skin-type"><b><input type="radio" name="${instanceId}-skin" value="${type.name}" ${selectedSkin===type.name?'checked':''}/>${esc(type.name)}</b><p>${esc(type.description)}</p></label>`).join('')}
   <button class="ow-confirm" data-action="confirm" ${selectedSkin?'':'disabled'}>${icon('check')}${originalSkinInquiry.confirm}</button>
   <p class="ow-inquiry-note">${esc(originalSkinInquiry.note)}</p>
  </div>`;
 }
 const isIntro=()=>!introComplete&&category()<0&&!poster();
 const dialogLabel=()=>`role="dialog" aria-modal="true" aria-labelledby="${instanceId}-dialog"`;
 const closeSheetButton='<button data-action="close">Close</button>';
 function sheet(){
  if(poster())return '';
  if(isIntro())return `<section class="ow-intro" ${dialogLabel()}>${originalHand()}${skinInquiry()}</section>`;
  if(alertPage!==null&&alertPage===category())return `<div class="ow-overlay ow-alert"><section class="ow-sheet" ${dialogLabel()}>
   <h2 id="${instanceId}-dialog">${esc(currentPage().alertText)}</h2><button data-action="dismiss-alert">OK</button></section></div>`;
  const dialog=context.parameters.dialog;
  if(!dialog||dialog==='none')return '';
  if(dialog==='skin')return `<div class="ow-overlay"><section class="ow-sheet ow-skin-sheet" ${dialogLabel()}>
   <header class="ow-sheet-head">${closeSheetButton}</header><div class="ow-sheet-body">${skinInquiry()}</div></section></div>`;
  if(guideOpen)return `<div class="ow-overlay"><section class="ow-sheet ow-guide" ${dialogLabel()}>
   <header class="ow-sheet-head"><h2 id="${instanceId}-dialog">Illustration of [Efficacy]</h2>${closeSheetButton}</header>
   <div class="ow-sheet-body ow-legend">${efficacy.map(([,name,color])=>`<p><span class="ow-dot" style="--dot:${color}"></span>${name}</p>`).join('')}</div>
  </section></div>`;
  if(dialog==='detail'){
   const row=context.data.find(r=>Number(r.id)===Number(context.parameters.catalogId));if(!row)return'';
   const labelPage:Record<string,number>={'Cleanser':0,'Moisturizer':1,'Sun protect':2,'Treatment':3,'Face Mask':5,'Eye cream':6};
   const image=originalPages[labelPage[String(row.Label)]];
   const warning=inapplicable(row);
   return `<div class="ow-overlay"><section class="ow-sheet ow-detail-sheet" ${dialogLabel()}>
    <header class="ow-sheet-head">${closeSheetButton}</header><div class="ow-sheet-body">
    ${image?`<div class="ow-detail-package">${originalPackage(image,false,false,theme)}</div>`:''}
    <h2 id="${instanceId}-dialog">${esc(row.Brand)}</h2><p class="ow-cosmetic-title">${esc(row.Name)}</p>
    <div class="ow-detail-fields"><div><b>Price</b> ${esc(row.Price)}</div><div><b>Rank</b> ${esc(row.Rank)}</div>
     <div><b>${warning?'Inapplicable for':'Applicable for all'}</b> ${warning}</div><div><b>Function</b> ${dots(row)}</div></div>
    <div class="ow-cosmetic-ingredients"><b>Ingredients</b><p>${esc(new Intl.ListFormat('en',{type:'conjunction'}).format(parseList(row.Ingredients)))}</p></div>
   </div></section></div>`;
  }
  const visible=visibleCatalogue(),global=tableScope==='global';
  const hint=global?'Search for Brand or Name':'Search';
  return `<div class="ow-overlay ${global?'ow-full-table':''}"><section class="ow-sheet" ${dialogLabel()}>
   <header class="ow-sheet-head ow-table-head"><button data-action="close" aria-label="Back">${icon('back')}</button>
    <h2 id="${instanceId}-dialog">Table</h2><button data-action="guide" aria-label="Illustration of Efficacy">${icon('info')}</button></header>
   <div class="ow-sheet-body ow-table-body">
    <input class="ow-search" placeholder="${hint}" aria-label="${hint}" type="search" value="${esc(search)}"/>
    <table class="ow-table"><thead><tr><th class="ow-table-compact">Table</th>${['ID','Brand','Name','Efficacy','Inapplicable'].map(label=>`<th class="ow-table-wide">${label}</th>`).join('')}</tr></thead>
    <tbody>${visible.slice(0,listLimit).map(row=>`<tr data-catalog="${esc(row.id)}" tabindex="0" aria-label="${esc(row.Brand)} · ${esc(row.Name)}">
     <td class="ow-table-compact"><b>${esc(row.Brand)} - ${esc(row.Name)}</b><p>Efficacy: ${dots(row)}</p><p>Inapplicable Skin Type: ${inapplicable(row,'none')}</p></td>
     <td class="ow-table-wide">${esc(row.id)}</td><td class="ow-table-wide">${esc(row.Brand)}</td><td class="ow-table-wide">${esc(row.Name)}</td><td class="ow-table-wide">${dots(row)}</td><td class="ow-table-wide">${inapplicable(row)}</td>
    </tr>`).join('')}</tbody></table>
    ${visible.length>listLimit?'<button data-action="more">More</button>':''}${!visible.length?'<div class="ow-no-results">No results</div>':''}
   </div><div class="ow-table-grain" aria-hidden="true" style="background-image:url(${sourceNoise})"></div>
  </section></div>`;
 }
 function paint(){
  for(const bubble of root.querySelectorAll<HTMLElement>('.ow-bubble-text')){
   const normal=bubble.dataset.topic?.startsWith('1:')&&bubble.dataset.topic!=='1:1'?14.5:17;
   let factor=1;
   bubble.style.fontSize=normal+'px';bubble.style.gap='8px';
   for(let i=0;i<9&&bubble.scrollHeight>bubble.clientHeight+1;i++){
    factor=Math.max(.5,factor*.9);bubble.style.fontSize=`${normal*factor}px`;bubble.style.gap=`${8*factor}px`;
   }
  }
 }
 function renderLayers(){
  const layers=root.querySelector<HTMLElement>('.ow-layers');
  if(!layers)return;
  layers.innerHTML=sheet();
  const modal=!!layers.firstElementChild;
  for(const child of root.querySelectorAll<HTMLElement>('.ow-header,.ow-main'))child.inert=modal;
 }
 let renderedPage=-1;
 const bodyElement=()=>root.querySelector<HTMLElement>('.ow-body');
 const galleryTrack=()=>root.querySelector<HTMLElement>('.ow-gallery-track');
 function onScroll(){
  const body=bodyElement(),expanded=root.querySelector<HTMLElement>('.ow-expanded');
  if(body&&expanded)expanded.style.setProperty('--nav-offset',`${body.scrollLeft/scene().scale}px`);
  const track=galleryTrack();
  if(!track||track.dataset.horizontal!=='true')return;
  for(const card of track.querySelectorAll<HTMLElement>('.ow-card')){
   const width=card.offsetWidth,local=card.offsetLeft-track.scrollLeft;
   const hidden=Math.max(0,-local,local+width-track.clientWidth);
   const fraction=Math.min(1,hidden/(width*.6));
   card.style.setProperty('--card-scale',String(1-fraction*.1));
   card.style.setProperty('--card-opacity',String(1-fraction*.7));
  }
 }
 function render(){
  if(disposed)return;
  const previous=bodyElement(),priorTrack=galleryTrack(),page=category();
  if(priorTrack)galleryOffset={x:priorTrack.scrollLeft,y:priorTrack.scrollTop};
  const priorPos=page===renderedPage&&previous?{x:previous.scrollWidth>previous.clientWidth?previous.scrollLeft:null,y:previous.scrollTop}:null;
  root.style.height=poster()?'auto':`${context.height}px`;
  root.className=`ow-app${poster()?' ow-export':''}`;root.dataset.theme=theme;
  const content=page<0?(poster()?originalPages.map(p=>active(p,true)).join(''):gallery()):active(currentPage(),poster());
  const plainGallery=page<0&&!poster();
  root.innerHTML=`<style>${css}${originalReaderCss}</style>${header()}
   ${plainGallery?`<div class="ow-main ow-gallery-main">${content}</div>`:`<div class="ow-main ow-body" ${page>=0&&!poster()?'tabindex="0" aria-label="Illustration"':''}>${content}</div>`}
   <div class="ow-layers"></div>`;
  const body=bodyElement(),track=galleryTrack();
  if(track){track.scrollTo(galleryOffset.x,galleryOffset.y);track.addEventListener('scroll',onScroll,{passive:true});}
  if(body){body.scrollTo(priorPos?.x??Math.max(0,(body.scrollWidth-body.clientWidth)/2),priorPos?.y??0);body.addEventListener('scroll',onScroll,{passive:true});}
  renderedPage=page;renderLayers();onScroll();positionPackageHit();paint();
 }
 function openDialog(dialog:string){
  previousFocus=document.activeElement as HTMLElement;search='';listLimit=80;guideOpen=false;selectedSkin='';
  clearTimeout(alertTimer);alertPage=null;
  change({dialog},renderLayers);
  root.querySelector<HTMLElement>('[role=dialog] button')?.focus();
 }
 function closeDialog(){
  if(guideOpen||context.parameters.dialog==='detail'){
   guideOpen=false;change({dialog:'table'},renderLayers);root.querySelector<HTMLInputElement>('.ow-search')?.focus();return;
  }
  const action=previousFocus?.dataset.action;change({dialog:'none'},renderLayers);
  if(action)root.querySelector<HTMLElement>(`[data-action=${action}]`)?.focus({preventScroll:true});
 }
 function motionOff(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
 function matchPackage(from:DOMRect|undefined,to:HTMLElement|null,duration:number){
  if(!from||!to||!from.width||motionOff())return;
  const end=to.getBoundingClientRect();
  if(!end.width)return;
  const dx=from.left+from.width/2-end.left-end.width/2,dy=from.top+from.height/2-end.top-end.height/2;
  to.animate([{translate:`${dx}px ${dy}px`,scale:from.width/end.width},{translate:'0px 0px',scale:1}],{duration,easing:'cubic-bezier(.22,.75,.28,1)'});
 }
 function enter(target:HTMLElement,index:number){
  const rect=target.getBoundingClientRect();
  const from=target.querySelector('.ow-package')?.getBoundingClientRect();
  essenceOffset=0;alertPage=null;clearTimeout(resetTimer);clearTimeout(alertTimer);
  change({category:index,engaged:false});
  const pkg=root.querySelector<HTMLElement>('.ow-active-package .ow-package');
  const stage=root.querySelector<HTMLElement>('.ow-expanded');
  if(stage&&!motionOff()){
   const end=stage.getBoundingClientRect(),edge=20;
   const inset=[rect.top-end.top,end.right-rect.right,end.bottom-rect.bottom,rect.left-end.left].map(value=>Math.max(0,value/scene().scale)+'px');
   stage.animate([{clipPath:`inset(${inset.join(' ')} round ${edge}px)`},{clipPath:'inset(0 round 20px)'}],{duration:260,easing:'cubic-bezier(.22,.75,.28,1)'});
  }
  matchPackage(from,pkg,260);
  context.onSelected(`page:${index+1}`);
  alertTimer=setTimeout(()=>{
   if(disposed||category()!==index||context.parameters.engaged)return;
   alertPage=index;renderLayers();root.querySelector<HTMLElement>('[data-action=dismiss-alert]')?.focus();
  },700);
 }
 function back(){
  const index=category();
  const from=root.querySelector('.ow-active-package .ow-package')?.getBoundingClientRect();
  const progress=learned()|(1<<index);
  save('learned',String(progress));clearTimeout(alertTimer);clearTimeout(resetTimer);alertPage=null;essenceOffset=0;
  change({category:-1,engaged:false,learned:progress});
  const card=root.querySelector<HTMLElement>(`[data-category="${index}"]`);
  matchPackage(from,card?.querySelector<HTMLElement>('svg.ow-package-svg')??null,380);
  card?.focus({preventScroll:true});
 }
 function engage(value:boolean){
  const page=currentPage();if(!page)return;
  clearTimeout(alertTimer);clearTimeout(resetTimer);alertPage=null;
  change({engaged:value},()=>{
   const layer=root.querySelector<HTMLElement>('.ow-bubbles');
   if(layer)layer.innerHTML=value?bubbleMarkup(page,scene()):'';
   const pkg=root.querySelector<HTMLElement>('.ow-active-package .ow-package');
   pkg?.classList.toggle('is-engaged',value);
   renderLayers();positionPackageHit();paint();
  });
  if(value&&[1,2,3,4,5,7].includes(page.id))resetTimer=setTimeout(()=>{
   if(disposed||currentPage()?.id!==page.id)return;
   essenceOffset=0;engage(false);
  },500000);
 }
 function onClick(event:MouseEvent){
  const target=(event.target as Element).closest<HTMLElement>('button,[data-catalog]');if(!target||!root.contains(target))return;
  if(target.dataset.category!==undefined){enter(target,Number(target.dataset.category));return;}
  if(target.dataset.catalog!==undefined){change({catalogId:Number(target.dataset.catalog),dialog:'detail'},renderLayers);root.querySelector<HTMLElement>('[role=dialog] button')?.focus();return;}
  switch(target.dataset.action){
   case 'back':back();break;
   case 'theme':theme=theme==='dark'?'light':'dark';save('theme',theme);render();root.querySelector<HTMLElement>('[data-action=theme]')?.focus();break;
   case 'package':
    if(performance.now()<suppressPackageClickUntil)break;
    if([4,5].includes(currentPage()?.id)){
     root.querySelector<SVGElement>('.ow-pinch')?.animate([{scale:'1 1'},{scale:'.9 1'},{scale:'1 1'}],{duration:motionOff()?0:500});break;
    }
    engage(!context.parameters.engaged);break;
   case 'skin':openDialog('skin');break;
   case 'global-table':tableScope='global';openDialog('table');break;
   case 'table':tableScope='lesson';openDialog('table');break;
   case 'guide':guideOpen=true;renderLayers();root.querySelector<HTMLElement>('[role=dialog] button')?.focus();break;
   case 'close':closeDialog();break;
   case 'dismiss-alert':alertPage=null;renderLayers();root.querySelector<HTMLElement>('[data-action=package]')?.focus({preventScroll:true});break;
   case 'confirm':
    if(!selectedSkin)break;
    skinType=selectedSkin;introComplete=true;save('skin',skinType);selectedSkin='';
    change({skinType,dialog:'none'},renderLayers);
    root.querySelector<HTMLElement>(previousFocus?'[data-action=skin]':'[data-category="0"]')?.focus({preventScroll:true});
    break;
   case 'more':{
    const scroll=root.querySelector('.ow-table-body')?.scrollTop??0;
    listLimit+=80;renderLayers();root.querySelector('.ow-table-body')?.scrollTo(0,scroll);
    break;
   }
  }
 }
 function onChange(event:Event){
  const target=event.target as HTMLInputElement;
  if(target.name===instanceId+'-skin'){
   selectedSkin=target.value;const confirm=root.querySelector<HTMLButtonElement>('.ow-confirm');
   if(confirm)confirm.disabled=false;
  }
 }
 function onInput(event:Event){
  const target=event.target as HTMLInputElement;
  if(!target.matches('.ow-search'))return;
  search=target.value;listLimit=80;
  const table=target.closest('.ow-table-body');if(!table)return;
  const next=document.createElement('div');next.innerHTML=sheet();
  const fresh=next.querySelector('.ow-table-body');
  if(fresh){for(const item of [...table.children])if(item!==target)item.remove();for(const item of [...fresh.children])if(!item.matches('.ow-search'))table.append(item);}
  table.scrollTop=0;
 }
 function onKey(event:KeyboardEvent){
  const target=event.target as HTMLElement;
  if(target.matches('[data-action=package]')&&[4,5].includes(currentPage()?.id)&&['ArrowUp','ArrowDown'].includes(event.key)){
   event.preventDefault();essenceOffset=event.key==='ArrowUp'?-200:0;engage(essenceOffset<0);return;
  }
  if(event.key==='Escape'){
   if(alertPage!==null){root.querySelector<HTMLElement>('[data-action=dismiss-alert]')?.click();return;}
   if(context.parameters.dialog&&context.parameters.dialog!=='none'){event.preventDefault();closeDialog();return;}
   if(category()>=0){event.preventDefault();back();return;}
  }
  if((event.key==='Enter'||event.key===' ')&&target.matches('[data-catalog]')){event.preventDefault();target.click();}
  if(event.key!=='Tab')return;
  const dialog=root.querySelector('[role=dialog]');if(!dialog)return;
  const nodes=[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input,[tabindex="0"]')];
  const first=nodes[0],last=nodes[nodes.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
 let suppressPackageClickUntil=0;
 let drag:{target:HTMLElement;start:number;id:number;rest:number;offset:number}|null=null;
 function positionPackageHit(offset=essenceOffset,dragging=false){
  const pkg=root.querySelector<HTMLElement>('.ow-active-package .ow-package');
  const hit=pkg?.querySelector<HTMLElement>('.ow-package-hit'),page=currentPage();
  if(!hit||!pkg||!page)return;
  const engaged=Boolean(context.parameters.engaged);
  const dropper=[4,5].includes(page.id);
  pkg.style.setProperty('--dropper-lift',`${offset}px`);
  pkg.classList.toggle('ow-dragging',dragging);
  if(dropper){
   if(dragging)pkg.querySelector<SVGElement>('.ow-cap')?.style.setProperty('transform',`translateY(${offset}px)`);
   else pkg.querySelector<SVGElement>('.ow-cap')?.style.removeProperty('transform');
  }
  const shift=(dropper?offset*.6:engaged?(page.id===3?-.3*.7*1000:[1,2].includes(page.id)?.03*.7*1000:0):0)/10;
  hit.style.transform=`translateY(${shift*pkg.offsetHeight/100}px)`;
  hit.setAttribute('aria-pressed',String(engaged));
 }
 function onPointerDown(event:PointerEvent){
  const target=(event.target as Element).closest<HTMLElement>('[data-action=package]');
  if(!target||event.button!==0||![4,5].includes(currentPage()?.id))return;
  drag={target,start:event.clientY,id:event.pointerId,rest:essenceOffset,offset:essenceOffset};
  target.setPointerCapture(event.pointerId);
 }
 function onPointerMove(event:PointerEvent){
  if(!drag||drag.id!==event.pointerId)return;
  const packageSize=root.querySelector('.ow-active-package .ow-package')?.getBoundingClientRect().height||1;
  const delta=(event.clientY-drag.start)/packageSize*1000/.6;
  drag.offset=Math.max(-200,Math.min(0,drag.rest+delta));
  positionPackageHit(drag.offset,true);
 }
 function onPointerEnd(event:PointerEvent){
  if(!drag||drag.id!==event.pointerId)return;
  const {offset,rest,start}=drag;drag=null;
  if(Math.abs(event.clientY-start)<5){positionPackageHit();return;}
  suppressPackageClickUntil=performance.now()+350;
  essenceOffset=Math.abs(offset)<12?0:offset;
  if(essenceOffset!==rest)engage(essenceOffset<0);else positionPackageHit();
 }
 function onPointerCancel(){drag=null;positionPackageHit();}
 function onWheel(event:WheelEvent){
  const track=(event.target as Element).closest<HTMLElement>('.ow-gallery-track[data-horizontal="true"]');
  if(!track||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
  event.preventDefault();
  const previous=track.style.scrollSnapType;
  track.style.scrollSnapType='none';track.scrollLeft+=event.deltaY;
  clearTimeout(wheelTimer);
  wheelTimer=setTimeout(()=>{track.style.scrollSnapType=previous==='none'?'':previous;},120);
 }
 let wheelTimer:ReturnType<typeof setTimeout>|undefined;
 root.addEventListener('click',onClick);
 root.addEventListener('change',onChange);root.addEventListener('input',onInput);
 root.addEventListener('keydown',onKey);root.addEventListener('wheel',onWheel,{passive:false});
 root.addEventListener('pointerdown',onPointerDown);root.addEventListener('pointermove',onPointerMove);
 root.addEventListener('pointerup',onPointerEnd);root.addEventListener('pointercancel',onPointerCancel);
 const observer=new ResizeObserver(()=>paint());observer.observe(root);
 signature=stateSignature(context);render();
 return {
  get objects(){
   return originalPages.map(page=>({id:'page:'+page.id,label:page.title}));
  },
  update(next:Context){
   const changed=next.data!==context.data;
   context=next;const nextSignature=stateSignature(next);
   if(changed||nextSignature!==signature){signature=nextSignature;render();}
  },
  dispose(){
   disposed=true;clearTimeout(alertTimer);clearTimeout(resetTimer);clearTimeout(wheelTimer);
   observer.disconnect();root.remove();
  },
 };
}
