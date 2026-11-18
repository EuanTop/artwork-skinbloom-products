import type { CaptureRequest } from '@art/contracts';
import { validCaptureSize } from '../../contracts/src/index';

export function validateCaptureRequest(request: CaptureRequest): void {
  if (!request || typeof request.id !== 'string' || !request.id || !Number.isSafeInteger(request.revision) || request.revision < 0 || typeof request.buildHash !== 'string' || !request.buildHash || !validCaptureSize(request.width, request.height) || !Number.isFinite(request.time) || request.time < 0 || request.time > 3600) throw new Error('截图尺寸、时间或版本无效（最大 4096 × 16384，共 2400 万像素）');
}

export function validatePng(png: unknown): asserts png is string {
  if (typeof png !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(png)) throw new Error('作品没有返回有效的 PNG 图片');
}

/** A capture is a transaction, including failure while entering poster layout. */
export class PosterCaptureSession {
  private busy = false;
  async run<T>(enter: () => void | Promise<void>, capture: () => T | Promise<T>, restore: () => void | Promise<void>): Promise<T> {
    if (this.busy) throw new Error('上一张图片仍在生成');
    this.busy = true;
    try {
      try { await enter(); return await capture(); }
      finally { await restore(); }
    } finally { this.busy = false; }
  }
}

async function bounded<T>(promise: PromiseLike<T>, message: string, milliseconds = 5000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([Promise.resolve(promise), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds); })]);
  } finally { clearTimeout(timer); }
}

/** Await the real artwork's resources before acknowledging or taking a picture. */
export async function settleDocument(root: HTMLElement, ready?: Promise<void>): Promise<void> {
  if (ready) await bounded(ready, '作品初始化超时');
  if (document.fonts) await bounded(document.fonts.ready, '作品字体加载超时');
  await Promise.all(Array.from(root.querySelectorAll('img')).map(async image => {
    if (!image.complete) await bounded(new Promise<void>((resolve, reject) => {
      const loaded = () => { clean(); resolve(); };
      const failed = () => { clean(); reject(new Error('作品图片加载失败')); };
      const clean = () => { image.removeEventListener('load', loaded); image.removeEventListener('error', failed); };
      image.addEventListener('load', loaded, { once: true }); image.addEventListener('error', failed, { once: true });
    }), '作品图片加载超时');
    if (!image.naturalWidth) throw new Error('作品包含无法加载的图片');
    if (image.decode) await bounded(image.decode(), '作品图片解码超时');
  }));
  await bounded(new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))), '作品布局等待超时');
}

function copyStyle(source: Element, target: Element, pseudo?: string): void {
  const computed = getComputedStyle(source, pseudo);
  const style = (target as HTMLElement | SVGElement).style;
  if (!style) return;
  for (const name of Array.from(computed)) {
    const value = normalizeLocalStyleUrls(computed.getPropertyValue(name), [document.URL, document.baseURI, 'about:srcdoc', 'about:blank']);
    // Foreign-object images cannot fetch external resources reliably. Fail rather
    // than export an apparently successful image with missing material or fonts.
    style.setProperty(name, value, computed.getPropertyPriority(name));
  }
  style.setProperty('animation', 'none', 'important');
  style.setProperty('transition', 'none', 'important');
}

function styleUrls(value: string): string[] {
  return Array.from(value.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi), match => (match[1] ?? match[2] ?? match[3]).trim());
}

/** Browsers resolve SVG paint references against about:srcdoc or the page URL. */
export function normalizeLocalStyleUrls(value: string, baseUrls: readonly string[]): string {
  return value.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi, (original, double: string | undefined, single: string | undefined, bare: string | undefined) => {
    const url = (double ?? single ?? bare ?? '').trim();
    if (url.startsWith('data:') || url.startsWith('#')) return original;
    const fragment = url.indexOf('#');
    if (fragment >= 0 && baseUrls.some(base => base?.split('#')[0] === url.slice(0, fragment))) return `url("${url.slice(fragment).replace(/"/g, '%22')}")`;
    throw new Error('图片包含外部样式资源；请将素材内嵌，或由作品提供 capture 方法');
  });
}

function snapshotImage(source: HTMLImageElement | HTMLCanvasElement): string {
  if (source instanceof HTMLCanvasElement) return source.toDataURL('image/png');
  const canvas = document.createElement('canvas');
  canvas.width = source.naturalWidth; canvas.height = source.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('浏览器无法导出图片');
  try { context.drawImage(source, 0, 0); return canvas.toDataURL('image/png'); }
  catch { throw new Error('图片来源不允许导出；请使用内嵌素材，或由作品提供 capture 方法'); }
}

function pseudoElement(source: Element, pseudo: '::before' | '::after'): HTMLElement | undefined {
  const content = getComputedStyle(source, pseudo).content;
  if (!content || content === 'none' || content === 'normal' || source.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
  if (!/^"(?:[^"\\]|\\.)*"$/.test(content)) throw new Error('此伪元素内容无法直接导出；请使用普通元素，或由作品提供 capture 方法');
  const element = document.createElement('span');
  try { element.textContent = JSON.parse(content); } catch { throw new Error('伪元素文本无法导出'); }
  copyStyle(source, element, pseudo);
  return element;
}

function cloneForCapture(source: Element): Element {
  if (['IFRAME', 'VIDEO', 'OBJECT', 'EMBED'].includes(source.tagName.toUpperCase())) throw new Error('嵌入媒体需要由作品提供 capture 方法');
  if (source instanceof HTMLCanvasElement || source instanceof HTMLImageElement) {
    const image = document.createElement('img');
    image.src = snapshotImage(source);
    copyStyle(source, image);
    image.setAttribute('width', String(source instanceof HTMLCanvasElement ? source.width : source.naturalWidth));
    image.setAttribute('height', String(source instanceof HTMLCanvasElement ? source.height : source.naturalHeight));
    return image;
  }
  const clone = source.cloneNode(false) as Element;
  // The clone stays detached. Keep IDs for gradients, masks, <use> and ARIA.
  for (const attribute of Array.from(clone.attributes)) if (/^on/i.test(attribute.name)) clone.removeAttribute(attribute.name);
  const href = source.getAttribute('href') ?? source.getAttribute('xlink:href');
  if (source.namespaceURI === 'http://www.w3.org/2000/svg' && href && !href.startsWith('#') && !href.startsWith('data:')) {
    const normalized = normalizeLocalStyleUrls(`url("${href}")`, [document.URL, document.baseURI, 'about:srcdoc', 'about:blank']);
    const reference = styleUrls(normalized)[0];
    clone.setAttribute(source.hasAttribute('href') ? 'href' : 'xlink:href', reference);
  }
  copyStyle(source, clone);
  const before = pseudoElement(source, '::before');
  if (before) clone.append(before);
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      if (!['SCRIPT', 'STYLE', 'LINK'].includes((child as Element).tagName.toUpperCase())) clone.append(cloneForCapture(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) clone.append(child.cloneNode());
  }
  const after = pseudoElement(source, '::after');
  if (after) clone.append(after);
  if (source instanceof HTMLInputElement) clone.setAttribute('value', source.value);
  if (source instanceof HTMLTextAreaElement) clone.textContent = source.value;
  if (source instanceof HTMLSelectElement) Array.from(clone.querySelectorAll('option')).forEach((option, index) => { if (index === source.selectedIndex) option.setAttribute('selected', ''); else option.removeAttribute('selected'); });
  return clone;
}

function embeddedFonts(): string {
  const faces: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) if (rule.type === CSSRule.FONT_FACE_RULE) {
      if (styleUrls(rule.cssText).some(url => !url.startsWith('data:'))) throw new Error('自定义字体需要内嵌后才能导出');
      faces.push(rule.cssText);
    }
  }
  return faces.join('\n');
}

/** A document keeps its own aspect ratio inside a bounded raster envelope. */
export function documentRasterSize(contentWidth:number,contentHeight:number,maxWidth:number,maxHeight:number):{width:number;height:number} {
  if(![contentWidth,contentHeight].every(n=>Number.isFinite(n)&&n>0))throw new Error('作品内容尺寸无效');
  if(!validCaptureSize(maxWidth,maxHeight))throw new Error('图片尺寸超出限制');
  const scale=Math.min(maxWidth/contentWidth,maxHeight/contentHeight);
  return {width:Math.max(1,Math.floor(contentWidth*scale)),height:Math.max(1,Math.floor(contentHeight*scale))};
}

/** Captures the complete document, including embedded canvas pixels, with no crop. */
export async function captureDocument(root: HTMLElement, request: CaptureRequest): Promise<string> {
  validateCaptureRequest(request);
  const rect = root.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(root.scrollWidth), Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(root.scrollHeight), Math.ceil(rect.height));
  const output=documentRasterSize(width,height,request.width,request.height);
  const clone = cloneForCapture(root) as HTMLElement;
  clone.style.setProperty('width', `${width}px`, 'important');
  clone.style.setProperty('height', `${height}px`, 'important');
  clone.style.setProperty('min-height', '0', 'important');
  clone.style.setProperty('overflow', 'visible', 'important');
  clone.style.setProperty('transform', 'none', 'important');
  clone.style.setProperty('margin', '0', 'important');
  const xml = new XMLSerializer().serializeToString(clone);
  const fonts = embeddedFonts().replace(/<\/style/gi, '<\\/style');
  // Decode at output size, so a long page does not allocate an unbounded bitmap.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${output.width}" height="${output.height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet"><foreignObject width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml"><style>${fonts.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</style>${xml}</div></foreignObject></svg>`;
  const image = new Image();
  await bounded(new Promise<void>((resolve, reject) => {
    image.onload = () => resolve(); image.onerror = () => reject(new Error('浏览器无法生成此作品的图片；作品可提供 capture 方法'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }), '作品图片生成超时');
  const canvas = document.createElement('canvas'); canvas.width = output.width; canvas.height = output.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('浏览器无法创建导出画布');
  context.fillStyle = getComputedStyle(document.body).backgroundColor;
  context.fillRect(0, 0, output.width, output.height);
  context.drawImage(image, 0, 0, output.width, output.height);
  let png: string;
  try { png = canvas.toDataURL('image/png'); } catch { throw new Error('作品包含无法导出的跨来源素材'); }
  validatePng(png);
  return png;
}
