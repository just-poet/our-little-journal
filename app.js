'use strict';

const book=document.getElementById('book');
const leftPage=document.getElementById('page-left');
const rightPage=document.getElementById('page-right');
const mobile=window.matchMedia('(max-width:800px)');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const nextButtons=[document.getElementById('next'),document.getElementById('next-side')];
const previousButtons=[document.getElementById('previous'),document.getElementById('previous-side')];
let sourceBlocks=[],chapters=[],pages=[],pageIndex=0,turning=false,resizeTimer;
let measuredWidth=0;
const step=()=>mobile.matches?1:2;

function parseJournal(text){
  sourceBlocks=[];chapters=[];
  let entry=-1;
  const paragraphs=text.trim().split(/\r?\n\s*\r?\n/);
  for(const raw of paragraphs){
    if(raw.startsWith('## ')){
      entry++;const title=raw.slice(3).trim();chapters.push({title,id:entry});
      sourceBlocks.push({type:'heading',text:title,entry,id:sourceBlocks.length});
    }else{
      for(const item of raw.split(/\r?\n(?=\d+\. )/)){
        const list=item.match(/^(\d+)\. (.*)$/s);
        sourceBlocks.push({type:list?'item':'paragraph',text:list?list[2]:item.trim(),number:list?list[1]:null,entry,id:sourceBlocks.length});
      }
    }
  }
}
function makeBlock(block){
  if(block.type==='heading'){
    const node=document.createElement('h2');node.textContent=block.text;return node;
  }
  if(block.type==='item'){
    const node=document.createElement('div');node.className='list-item';
    const n=document.createElement('span');n.className='list-number';n.textContent=block.number+'.';n.setAttribute('aria-hidden','true');
    const text=document.createElement('span');text.textContent=block.text;
    node.append(n,text);node.setAttribute('aria-label',block.number+'. '+block.text);return node;
  }
  const node=document.createElement('p');node.textContent=block.text;if(block.offset)node.className='continued';return node;
}
function paginate(){
  if(!sourceBlocks.length||document.getElementById('journal-view').hidden)return;
  const body=leftPage.querySelector('.page-body');
  const width=body.clientWidth,height=body.clientHeight-3;
  if(width<10||height<50)return;
  const anchor=pages[pageIndex]?.blocks[0];
  const probe=document.createElement('div');probe.className='page-body';
  Object.assign(probe.style,{position:'absolute',left:'-9999px',top:'0',visibility:'hidden',width:width+'px',height:'auto',overflow:'visible',flex:'none'});
  document.body.append(probe);
  const output=[];let chunk=[];
  function fits(){return probe.getBoundingClientRect().height<=height;}
  function commit(){if(chunk.length){output.push({blocks:chunk,entry:chunk[0].entry});chunk=[];probe.replaceChildren();}}
  for(const block of sourceBlocks){
    if(block.type==='heading'){
      // Give each full diary entry a fresh page; the two opening milestones share one.
      if(chunk.length&&block.entry>=2)commit();
      const node=makeBlock(block);probe.append(node);chunk.push({...block});
      continue;
    }
    const words=block.text.split(/\s+/);let offset=0;
    while(offset<words.length){
      const candidate={...block,text:words.slice(offset).join(' '),offset};
      const node=makeBlock(candidate);probe.append(node);
      if(fits()){chunk.push(candidate);offset=words.length;continue;}
      node.remove();
      // A binary search fills the page without dropping a word or clipping prose.
      let low=0,high=words.length-offset;
      while(low<high){
        const mid=Math.ceil((low+high)/2);const test=makeBlock({...block,text:words.slice(offset,offset+mid).join(' '),offset});probe.append(test);
        const ok=fits();test.remove();if(ok)low=mid;else high=mid-1;
      }
      if(low===0){if(chunk.length){commit();continue;}low=1;}
      const part={...block,text:words.slice(offset,offset+low).join(' '),offset};
      chunk.push(part);probe.append(makeBlock(part));offset+=low;commit();
    }
  }
  commit();probe.remove();pages=output;measuredWidth=width;
  if(anchor){
    const found=pages.findIndex(p=>p.blocks.some(b=>b.id===anchor.id&&(b.offset||0)<=(anchor.offset||0)&&((b.offset||0)+b.text.split(/\s+/).length)>(anchor.offset||0)));
    if(found>=0)pageIndex=found;
  }else{
    try{const saved=Number(localStorage.getItem('ammu-journal-page'));if(Number.isFinite(saved))pageIndex=saved;}catch{}
  }
  pageIndex=Math.max(0,Math.min(pageIndex,pages.length-1));if(!mobile.matches)pageIndex=Math.floor(pageIndex/2)*2;
  render();renderChapters();
}
function fillPage(element,index){
  const body=element.querySelector('.page-body');body.replaceChildren();
  if(index>=pages.length){
    const end=document.createElement('div');end.className='empty-page';
    const mark=document.createElement('span');mark.className='end-mark';mark.textContent='♡';
    const text=document.createElement('p');text.textContent='For you, always.';end.append(mark,text);body.append(end);
    element.querySelector('.page-number').textContent='';element.querySelector('.page-date').textContent='';return;
  }
  const page=pages[index];for(const block of page.blocks)body.append(makeBlock(block));
  if(index===0){const doodle=document.createElement('canvas');doodle.className='page-doodle';doodle.setAttribute('aria-hidden','true');body.append(doodle);drawPageDoodle(doodle);}
  element.querySelector('.page-number').textContent=String(index+1).padStart(2,'0');
  element.querySelector('.page-date').textContent=chapters[page.entry]?.title.toUpperCase()||'';
  element.setAttribute('aria-label','Journal page '+(index+1)+' of '+pages.length);
}
function render(){
  fillPage(leftPage,pageIndex);if(!mobile.matches)fillPage(rightPage,pageIndex+1);
  const end=Math.min(pages.length,pageIndex+step());
  document.getElementById('page-status').textContent=mobile.matches?`Page ${pageIndex+1} of ${pages.length}`:`Pages ${pageIndex+1}–${end} of ${pages.length}`;
  document.getElementById('progress-fill').style.width=end/pages.length*100+'%';
  previousButtons.forEach(b=>b.disabled=pageIndex===0);
  const last=end>=pages.length;nextButtons.forEach(b=>b.disabled=last);
  document.getElementById('ending-invitation').hidden=!last;
  document.getElementById('reading-hint').hidden=last;
  try{localStorage.setItem('ammu-journal-page',String(pageIndex));}catch{}
}
function goTo(index,animate=true){
  index=Math.max(0,Math.min(index,pages.length-1));if(!mobile.matches)index=Math.floor(index/2)*2;
  if(index===pageIndex||turning)return;
  if(!animate||reduceMotion.matches){pageIndex=index;render();return;}
  turning=true;const forward=index>pageIndex;
  const leaf=document.getElementById('turning-leaf');
  const copy=(mobile.matches?leftPage:forward?rightPage:leftPage).cloneNode(true);
  copy.removeAttribute('id');copy.setAttribute('aria-hidden','true');leaf.replaceChildren(copy);
  book.classList.add(forward?'turn-forward':'turn-back');
  setTimeout(()=>{pageIndex=index;render();},320);
  setTimeout(()=>{book.classList.remove('turn-forward','turn-back');leaf.replaceChildren();turning=false;},670);
}
nextButtons.forEach(b=>b.addEventListener('click',()=>goTo(pageIndex+step())));
previousButtons.forEach(b=>b.addEventListener('click',()=>goTo(pageIndex-step())));
function renderChapters(){
  const list=document.getElementById('chapter-list');list.replaceChildren();
  chapters.forEach((chapter,i)=>{
    const button=document.createElement('button');button.className='chapter-link';
    const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');button.append(n,document.createTextNode(chapter.title));
    button.addEventListener('click',()=>{const found=pages.findIndex(p=>p.blocks.some(b=>b.entry===i));closeContents();showJournal();if(found>=0)goTo(found,false);});list.append(button);
  });
}
const contents=document.getElementById('contents');
const toggle=document.getElementById('contents-toggle');
function openContents(){contents.hidden=false;document.getElementById('contents-backdrop').hidden=false;toggle.setAttribute('aria-expanded','true');contents.setAttribute('role','dialog');contents.setAttribute('aria-modal','true');document.getElementById('contents-close').focus();}
function closeContents(){contents.hidden=true;document.getElementById('contents-backdrop').hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}
toggle.addEventListener('click',()=>contents.hidden?openContents():closeContents());
document.getElementById('contents-close').addEventListener('click',closeContents);
document.getElementById('contents-backdrop').addEventListener('click',closeContents);
function showJournal(){
  document.getElementById('journal-view').hidden=false;document.getElementById('otter-view').hidden=true;document.body.classList.remove('at-lake');
  if(sourceBlocks.length&&leftPage.querySelector('.page-body').clientWidth!==measuredWidth)paginate();
}
function showLake(){document.getElementById('journal-view').hidden=true;document.getElementById('otter-view').hidden=false;document.body.classList.add('at-lake');window.scrollTo({top:0,behavior:'instant'});const title=document.getElementById('otter-title');title.tabIndex=-1;title.focus({preventScroll:true});}
document.getElementById('continue').addEventListener('click',()=>{location.hash='lake';});
document.getElementById('return-to-journal').addEventListener('click',()=>{location.hash='journal';});
window.addEventListener('hashchange',()=>{if(location.hash==='#lake')showLake();else showJournal();});
document.addEventListener('keydown',event=>{
  if(!contents.hidden){
    if(event.key==='Escape'){closeContents();event.preventDefault();}
    if(event.key==='Tab'){
      const focusable=[...contents.querySelectorAll('button')];const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){last.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first.focus();event.preventDefault();}
    }return;
  }
  if(document.getElementById('journal-view').hidden)return;
  if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();if(event.key==='ArrowRight')goTo(pageIndex+step());if(event.key==='ArrowLeft')goTo(pageIndex-step());if(event.key==='Home')goTo(0);if(event.key==='End')goTo(pages.length-1);}
});
let touchStart=null;
book.addEventListener('touchstart',event=>{touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
book.addEventListener('touchend',event=>{
  if(!touchStart)return;const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)goTo(pageIndex+(dx<0?step():-step()));touchStart=null;
},{passive:true});
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(paginate,180);});
async function loadJournal(){
  try{
    document.getElementById('load-error').hidden=true;
    const response=await fetch('journal.txt');if(!response.ok)throw Error('Journal unavailable');
    parseJournal(await response.text());await document.fonts.ready;paginate();
    if(location.hash==='#lake')showLake();
  }catch{document.getElementById('load-error').hidden=false;document.getElementById('page-status').textContent='Journal unavailable';nextButtons.forEach(b=>b.disabled=true);previousButtons.forEach(b=>b.disabled=true);}
}
document.getElementById('retry').addEventListener('click',loadJournal);
loadJournal();
