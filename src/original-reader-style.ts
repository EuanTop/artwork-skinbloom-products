export const originalReaderCss = `
.ow-app{
  --label-serif: ui-serif, "New York", Georgia, serif;
  --sheet: #1c1c1e;
  --control: #2c2c2e;
  --accent: #ffd60a;
  --package-blend: difference;
  --bubble-ink: rgb(0 0 0 / .75);
  --card-edge: linear-gradient(154deg, #000 0%, #fff 100%);
  container-type: inline-size;
}
.ow-app[data-theme="light"]{
  color-scheme: light;
  --bg:#fff; --fg:#000; --muted:#666; --line:#0002;
  --sheet:#f2f2f7; --control:#e5e5ea; --accent:#ffd60a;
  --package-blend:multiply;
  --bubble-ink:#fff;
  --card-edge:linear-gradient(154deg,#fff,#000);
}
.ow-header{height:80px;padding:7px 30px 0;gap:12px}
.ow-header h1{font:700 36px/1.05 var(--label-serif)}
.ow-header button,.ow-expanded-nav button{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px}
.ow-card{border:0!important;background:linear-gradient(var(--card) 0 50%,var(--bg))!important}
.ow-card::after{
  content:"";position:absolute;inset:0;border-radius:inherit;padding:2px;
  background:var(--card-edge);mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  pointer-events:none;z-index:5
}
.ow-card h2{left:16px;top:16px;right:16px}
.ow-card .ow-package{
  width:calc(100% / .6);left:50%;top:50%;transform:translate(-50%, -50%);
  mix-blend-mode:var(--package-blend)
}
.ow-card .ow-volume{color:var(--fg);right:16px;bottom:12px}
.ow-volume span{font-size:20px;border:0;padding:0}
.ow-volume span::after{content:"";display:block;width:20px;height:1px;margin:auto;background:currentColor}
.ow-volume b{padding:0}
.ow-learned{left:30px;bottom:28px}
.ow-learned svg{width:32px;height:32px}
.ow-gallery-track{
  padding:var(--gallery-inset, 68px) 24px 94px 0;
  height:100%;scrollbar-width:none;
}
.ow-person{
  align-self:stretch;display:grid;place-items:center start;
  transform:none;opacity:1;flex-basis:31%;width:31%;
  mask-image:linear-gradient(to right,#000 0 calc(100% - 36px),transparent);
}
.ow-person svg{width:auto;height:min(90%,var(--figure-height));max-width:125%;transform:translateX(-15%);overflow:visible}
.ow-gallery-track[data-horizontal="true"] .ow-card{
  opacity:var(--card-opacity, 1);
  scale:var(--card-scale, 1);
}
.ow-body:has(.ow-scene-window){background:var(--bg);overscroll-behavior:contain}
.ow-scene-window{position:relative;width:var(--view-width);height:var(--view-height);overflow:hidden;margin-inline:auto}
.ow-expanded{
  position:absolute;inset:0;min-height:0;width:var(--scene-w);height:var(--scene-h);
  transform:scale(var(--scene-scale));transform-origin:top left;
  background:linear-gradient(var(--card) 0 33.333%,var(--bg) 66.667% 100%);
  border-radius:20px;overflow:hidden
}
.ow-expanded-nav{top:calc(var(--scene-h) * .04);z-index:9;isolation:auto}
.ow-back{gap:.35em;font-size:20px!important}
.ow-scene-art{position:absolute;inset:0;z-index:2;isolation:isolate;mix-blend-mode:var(--package-blend);background:var(--bg)}
.ow-active-package{z-index:3;height:100%;inset:0}
.ow-active-package>.ow-package{width:var(--package-size);height:var(--package-size);mix-blend-mode:normal}
.ow-page-title{bottom:20px;font:700 48px/1.15 var(--label-serif)}
.ow-page-volume{right:16px;bottom:12px;display:grid;line-height:1.1}
.ow-bubbles{position:absolute;inset:0;display:block;padding:0;mix-blend-mode:normal}
.ow-bubble-svg{display:block}
.ow-bubble-circle,.ow-bubble-text{
  animation-name:ow-bubbles-drift;animation-duration:1.3s;
  animation-timing-function:cubic-bezier(.22,.75,.28,1);animation-fill-mode:both
}
.ow-bubble-text{
  color:var(--bubble-ink);background:none;border-radius:0;min-height:0;
  overflow:auto;scrollbar-width:none;overscroll-behavior:contain;
  font-size:17px;line-height:1.22;gap:8px;hyphens:none;overflow-wrap:normal
}
.ow-bubble-text[data-align="center"]{text-align:center}
.ow-bubble-text .ow-ingredient-source{border:0;padding:0}
.ow-bubble-text .ow-ingredient-source p + p{margin-top:.2em}
.ow-bubble-columns{display:grid;grid-template-columns:1fr 1fr;gap:.75em}
.ow-bubble-columns > div{display:grid;align-content:start;gap:.45em}
@keyframes ow-bubbles-drift{
  from{transform:translate(var(--from-x),var(--from-y)) scale(.01)}
  to{transform:translate(0,0) scale(1)}
}
.ow-nozzle,.ow-cap,.ow-cream-cap,.ow-original-hand{transition:transform .36s cubic-bezier(.22,.75,.28,1)}
.ow-cream-cap,.ow-original-hand{transition-duration:.92s}
.ow-package [data-art-motion]{transform:var(--rest-transform,none)}
.ow-package.is-engaged [data-art-motion]{transform:var(--engaged-transform,none)}
.ow-sheet{background:var(--sheet);border-color:var(--line)}
.ow-sheet-head{position:relative}
.ow-sheet .ow-search{color:var(--fg);background:var(--control);border-color:var(--line)}
.ow-sheet .ow-table th{color:var(--muted);background:var(--sheet)}
.ow-sheet .ow-table tr[data-catalog]:hover{background:var(--control)}
.ow-skin-content{max-width:810px;margin:auto;padding:20px;position:relative;z-index:2}
.ow-skin-content h2{text-align:center;font-size:28px;margin:0 0 32px}
.ow-skin-type{display:block;margin:0 0 9px}
.ow-skin-type b{display:flex;gap:8px;align-items:center;font-size:17px;line-height:1.15}
.ow-skin-type input{margin:0;accent-color:var(--accent);width:18px;height:18px}
.ow-skin-type p,.ow-inquiry-note{color:var(--muted);font-size:16px;line-height:1.25}
.ow-confirm{
  display:flex;align-items:center;gap:8px;background:var(--accent)!important;
  border-radius:999px;margin:35px auto;color:#000!important;padding:12px 25px!important
}
.ow-confirm:disabled{cursor:default}
.ow-intro{position:absolute;inset:0;z-index:15;display:grid;align-items:center;overflow:auto;background:var(--bg)}
.ow-intro-hand{position:absolute;width:min(65%,850px);left:62%;top:73%;transform:translate(-50%,-30%) rotate(180deg);pointer-events:none}
[data-theme="light"] .ow-intro-hand{filter:invert(1)}
.ow-alert .ow-sheet{width:270px;border-radius:14px;text-align:center}
.ow-alert h2{font-size:17px;padding:20px 14px;line-height:1.26}
.ow-alert button{border-top:1px solid var(--line);padding:10px;color:var(--accent);font-size:17px}
.ow-dots{display:inline-flex;padding-left:0;margin-right:6px;isolation:isolate}
.ow-dot{display:inline-block;width:20px;height:20px;border-radius:50%;opacity:.7;background:var(--dot);vertical-align:middle;flex:none}
.ow-dots .ow-dot + .ow-dot{margin-left:-6px}
.ow-legend{display:grid;gap:8px;padding:8px 6px}
.ow-legend p{display:flex;align-items:center;gap:8px}
.ow-warning{color:#ff453a;font-weight:700}
.ow-table-compact{display:none}
.ow-full-table .ow-sheet{width:100%;max-height:100%;height:100%;border:0;border-radius:0}
.ow-full-table{padding:0}
.ow-export .ow-scene-window{height:var(--view-height)}
.ow-export .ow-expanded{height:var(--scene-h);min-height:0}
.ow-export .ow-bubble-circle,.ow-export .ow-bubble-text{animation:none!important}
@container (max-width:650px){
  .ow-header{padding:0 10px 0 16px;height:65px;gap:0}
  .ow-header h1{font-size:clamp(20px,5.5cqw,30px)}
  .ow-header button{min-width:38px}
  .ow-person{display:none}
  .ow-gallery-track{padding:20px;width:100%}
  .ow-skin-content h2{margin-bottom:22px;font-size:22px}
  .ow-skin-type p,.ow-inquiry-note{font-size:14px}
  .ow-confirm{margin:20px auto}
  .ow-intro-hand{width:min(100%,520px);left:57%}
  .ow-table-compact{display:table-cell}
  .ow-sheet .ow-table .ow-table-wide{display:none}
}
.ow-gallery-track[data-horizontal="false"]{
  flex-direction:column;align-items:center;height:100%;width:100%;flex:1;
  padding:24px 20px;gap:40px;scroll-snap-type:y mandatory;scroll-padding-top:24px;
}
.ow-gallery-track[data-horizontal="false"] .ow-card{
  flex:none;width:min(calc(100% - 14px),420px);max-width:none;height:auto;aspect-ratio:.6;
}
.ow-gallery-track[data-horizontal="true"]{flex-direction:row;scroll-snap-type:x mandatory;scroll-padding:0}
.ow-gallery-track[data-horizontal="true"] .ow-card{width:auto;max-width:none;height:100%}
.ow-gallery[data-horizontal="false"] .ow-person{display:none}


.ow-card .ow-package{background:var(--bg)}
.ow-expanded-nav{left:calc(var(--nav-offset, 0px) + var(--nav-width) * .04);right:auto;width:calc(var(--nav-width) * .92)}
.ow-page-title{left:auto;right:49px;bottom:9px;text-align:right}
.ow-bubble-columns{grid-template-columns:3fr 2fr;border-block:1px solid currentColor}
.ow-bubble-columns > div + div{border-left:1px solid currentColor;padding-left:.4em}
.ow-caution-symbol{align-self:center}
.ow-export .ow-page-title{right:49px}

.ow-gallery-main{flex:1;min-height:0;display:flex;position:relative}

.ow-layers{display:contents}
.ow-overlay .ow-sheet{position:relative}
.ow-skin-sheet{width:min(850px,100%)}
.ow-skin-sheet .ow-sheet-head,.ow-detail-sheet .ow-sheet-head{border:0}
.ow-skin-sheet .ow-sheet-head button,.ow-detail-sheet .ow-sheet-head button{font-weight:700;color:var(--muted)}
.ow-guide{width:min(500px,100%)}
.ow-table-head button{min-width:40px;display:grid;place-items:center}
.ow-table-grain{position:absolute;inset:0;background-size:100% 100%;mix-blend-mode:screen;opacity:.1;pointer-events:none}
.ow-detail-sheet{width:min(790px,100%)}
.ow-detail-package .ow-package{height:min(350px,32vh);aspect-ratio:1;margin-inline:auto}
.ow-detail-sheet h2{font:700 22px/1.3 var(--label-serif)}
.ow-cosmetic-title{font:400 28px/1.2 -apple-system,sans-serif;margin:8px 0!important}
.ow-detail-fields{gap:20px;flex-wrap:wrap}
.ow-cosmetic-ingredients{border-top:1px solid var(--fg);padding:10px 0}
.ow-app .ow-dragging [data-art-motion]{transition:none}

@container(max-width:650px){

  .ow-table-head{padding:12px}
  .ow-table-compact b{display:block;font-size:15px;margin-bottom:5px}
  .ow-table-compact p{margin:2px 0}
}

.ow-bubble-definition + .ow-bubble-definition,.ow-ingredient-source + .ow-ingredient-source{border-top:1px solid color-mix(in srgb,currentColor 24%,transparent)}
.ow-bubble-text .ow-ingredient-source{border-top-width:1px;padding-top:.1em}
.ow-bubble-text[data-topic="2:3"]{padding-inline:42px}
.ow-bubble-text[data-topic="4:4"],.ow-bubble-text[data-topic="6:3"]{padding-inline:25px}
.ow-ray-diagram{flex:none;width:100%;height:3.5em;align-self:center}

/* These are part of SwiftUI's card background: white bubbles also invert
   the title and volume where they overlap. */
.ow-page-title,.ow-page-volume{z-index:1}
.ow-bubble-text[data-topic="1:4"]{padding-right:15px}
.ow-bubble-text[data-topic="1:5"]{padding-inline:4px 13px}
`;
