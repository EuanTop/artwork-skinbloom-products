import type { ArtworkObject, CaptureRequest, Mapping, Project, RenderSnapshot, Value } from '@art/contracts';
import { captureDocument, PosterCaptureSession, settleDocument, validateCaptureRequest, validatePng } from './capture';

export interface DocumentArtworkContext {
  root: HTMLElement;
  width: number;
  height: number;
  parameters: Record<string, Value>;
  data: Record<string, unknown>[];
  mapping: Mapping;
  seed: number;
  time: number;
  selectedId: string | null;
  mode: 'screen' | 'poster';
  onParameters(parameters: Record<string, Value>): void;
  onSelected(id: string | null): void;
}
export interface DocumentArtwork {
  update?(context: DocumentArtworkContext): void | Promise<void>;
  ready?: Promise<void>;
  objects?: ArtworkObject[];
  dispose?(): void;
  capture?(request: CaptureRequest): string | Promise<string>;
}
export type DocumentArtworkFactory = (context: DocumentArtworkContext) => DocumentArtwork;

/** A document has no prescribed chapters, layout, graphics library or content model. */
export function boot(createArtwork: DocumentArtworkFactory): void {
  const initial = (window as Window & { __ART_BOOT__?: RenderSnapshot }).__ART_BOOT__;
  const standalone = Boolean(initial) || window.parent === window;
  document.documentElement.style.cssText = 'width:100%;min-height:100%;height:auto;overflow-x:hidden;overflow-y:auto';
  document.body.style.cssText = 'margin:0;width:100%;min-height:100vh;height:auto;overflow:visible;background:#fbfaf6';
  const root = document.createElement('main');
  root.style.cssText = 'display:block;position:relative;width:100%;min-height:100vh;box-sizing:border-box';
  root.setAttribute('aria-label', '交互作品'); document.body.append(root);
  let project: Project | undefined;
  let authoritative: RenderSnapshot | undefined;
  let art: DocumentArtwork | undefined;
  let buildHash = '', codeHash = '', artKey = '';
  let width = Math.max(1, window.innerWidth), height = Math.max(1, window.innerHeight), time = 0;
  let selectedId: string | null = null;
  let mode: DocumentArtworkContext['mode'] = 'screen';
  let disposed = false, failed = false, capturing = false, capturePending = false;
  let mutation = 0;
  let applySequence = 0;
  let queue = Promise.resolve();
  const captureSession = new PosterCaptureSession();
  let errorView: HTMLPreElement | undefined;

  function send(type: string, data: Record<string, unknown> = {}): void {
    if (disposed) return;
    if (!standalone) window.parent.postMessage({ channel: 'art-runtime-v1', type, ...data }, '*');
    else if (type === 'applied') document.documentElement.dataset.visloomRender = 'ready';
    else if (type === 'error') document.documentElement.dataset.visloomRender = 'error';
  }
  function report(error: unknown, requestId?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    send('error', { message, ...(requestId ? { requestId } : {}) });
    if (standalone && !disposed) {
      errorView ??= document.createElement('pre');
      errorView.setAttribute('role', 'alert');
      errorView.style.cssText = 'position:fixed;z-index:2147483647;inset:16px 16px auto;margin:0;padding:12px;background:#fff5ee;color:#83482f;white-space:pre-wrap;font:12px/1.6 monospace';
      errorView.textContent = message;
      if (!errorView.isConnected) document.body.append(errorView);
    }
  }
  function enqueue(task: () => void | Promise<void>, requestId?: string): void {
    queue = queue.then(async () => { if (!disposed) await task(); }).catch(error => { if (!requestId) failed = true; report(error, requestId); });
  }
  function context(): DocumentArtworkContext {
    if (!project) throw new Error('作品尚未收到项目状态');
    return { root, width, height, parameters: project.state.parameters, data: project.result?.rows ?? [], mapping: project.state.mapping, seed: project.state.seed, time, selectedId, mode, onParameters, onSelected };
  }
  function safeParameters(parameters: Record<string, Value>): Record<string, Value> {
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) throw new Error('画面参数格式无效');
    const entries = Object.entries(parameters);
    if (entries.some(([key, value]) => ['__proto__', 'constructor', 'prototype'].includes(key) || !['string', 'boolean', 'number'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value)))) throw new Error('画面参数包含无效值');
    return Object.fromEntries(entries);
  }
  function onParameters(partial: Record<string, Value>): void {
    if (!project || disposed || capturing || failed) return;
    try {
      const parameters = safeParameters(partial);
      if (!Object.keys(parameters).length) return;
      if (!standalone) send('parameters', { parameters, revision: project.revision, buildHash });
      else {
        mutation++;
        enqueue(async () => {
          if (!project) return;
          project = { ...project, state: { ...project.state, parameters: { ...project.state.parameters, ...parameters } } };
          await update();
          if (authoritative) authoritative = { ...authoritative, project: structuredClone(project) };
        });
      }
    } catch (error) { report(error); }
  }
  function onSelected(id: string | null): void {
    if (!project || disposed || capturing || failed) return;
    mutation++;
    enqueue(async () => { await select(id); send('selected', { id: selectedId, revision: project!.revision, buildHash }); });
  }
  async function rebuild(): Promise<void> {
    art?.dispose?.(); art = undefined; root.replaceChildren();
    const next = createArtwork(context());
    if (!next || typeof next !== 'object') throw new Error('createArtwork 必须返回作品实例');
    art = next;
    await settleDocument(root, art.ready);
  }
  async function update(forceRebuild = false): Promise<void> {
    if (!art || forceRebuild || !art.update) await rebuild();
    else { await art.update(context()); await settleDocument(root, art.ready); }
  }
  function validateSnapshot(snapshot: RenderSnapshot, draft: boolean): void {
    if (!snapshot?.project?.state || typeof snapshot.project.codeHash !== 'string' || !snapshot.project.codeHash || typeof snapshot.buildHash !== 'string' || !snapshot.buildHash || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0 || snapshot.revision !== snapshot.project.revision || !Number.isFinite(snapshot.time) || snapshot.time < 0) throw new Error('无效的作品状态或版本');
    if (codeHash && snapshot.project.codeHash !== codeHash) throw new Error('作品代码版本与运行页面不一致');
    if (buildHash && snapshot.buildHash !== buildHash) throw new Error('作品构建版本与运行页面不一致');
    if (authoritative && (snapshot.project.id !== authoritative.project.id || snapshot.revision < authoritative.revision || (draft && snapshot.revision !== authoritative.revision))) throw new Error('页面收到过期的项目状态，请重新读取当前版本');
  }
  async function apply(snapshot: RenderSnapshot, draft = false, sequence = applySequence): Promise<void> {
    validateSnapshot(snapshot, draft);
    project = structuredClone(snapshot.project); buildHash = snapshot.buildHash; codeHash = project.codeHash; time = snapshot.time;
    width = Math.max(1, window.innerWidth); height = Math.max(1, window.innerHeight); mode = 'screen';
    const nextKey = JSON.stringify([project.result?.id, project.state.seed]);
    await update(artKey !== nextKey); artKey = nextKey;
    if (disposed) return;
    failed = false; errorView?.remove();
    if (!draft) {
      authoritative = structuredClone(snapshot);
      // A newer edit may have arrived while assets loaded. Its queued apply will
      // report readiness; never acknowledge the older image as the latest one.
      if (sequence !== applySequence) return;
      send('applied', { ack: { revision: project.revision, buildHash, frameTime: time, objects: art?.objects?.map(({ id, label, dataKey }) => ({ id, label, dataKey })) ?? [], timeline: { enabled: false, label: '作品', duration: 30, usesSeed: false }, diagnostics: { width, height, pixelWidth: width, pixelHeight: height, renderer: 'document' } } });
    }
  }
  async function select(id: unknown): Promise<void> {
    if (!art || !project) return;
    if (id !== null && typeof id !== 'string') throw new Error('无效的画面对象');
    if (typeof id === 'string' && art.objects && !art.objects.some(object => object.id === id)) throw new Error(`画面中没有对象：${id}`);
    selectedId = id as string | null;
    await update();
  }
  async function capture(request: CaptureRequest): Promise<void> {
    validateCaptureRequest(request);
    if (!authoritative || failed || request.revision !== authoritative.revision || request.buildHash !== authoritative.buildHash) throw new Error('截图要求的作品版本已不在当前页面中');
    const serial = mutation;
    const previous = { project, time, width, height, selectedId, rootStyle: root.style.cssText, scrollX: window.scrollX, scrollY: window.scrollY };
    const valid = () => { if (disposed || serial !== mutation) throw new Error('生成图片期间作品已变化，请重新导出'); };
    const png = await captureSession.run(async () => {
      capturing = true;
      project = structuredClone(authoritative!.project); time = request.time; width = request.width; height = request.height; mode = 'poster';
      root.style.width = `${width}px`; root.style.minHeight = '0'; root.style.height = 'auto'; root.style.overflow = 'visible';
      await update(); valid();
    }, async () => {
      const result = await (art?.capture ? art.capture(request) : captureDocument(root, request));
      validatePng(result); valid(); return result;
    }, async () => {
      project = previous.project; time = previous.time; width = previous.width; height = previous.height; selectedId = previous.selectedId; mode = 'screen';
      root.style.cssText = previous.rootStyle;
      try { if (!disposed && project) await update(); }
      finally { capturing = false; if (!disposed) window.scrollTo(previous.scrollX, previous.scrollY); }
    });
    valid();
    send('capture', { id: request.id, revision: request.revision, buildHash: request.buildHash, png });
  }
  function receive(event: MessageEvent): void {
    if (disposed || event.source !== window.parent || event.data?.channel !== 'art-host-v1') return;
    const message = event.data;
    if (message.type === 'dispose') { dispose(); return; }
    if (message.type === 'apply') { mutation++; const sequence = ++applySequence; enqueue(() => apply(message.snapshot, Boolean(message.draft), sequence)); }
    if (message.type === 'select') { mutation++; enqueue(() => select(message.id ?? null)); }
    if (message.type === 'capture') {
      const id = typeof message.request?.id === 'string' ? message.request.id : undefined;
      if (capturePending) { report(new Error('上一张图片仍在生成'), id); return; }
      capturePending = true;
      enqueue(async () => { try { await capture(message.request); } finally { capturePending = false; } }, id);
    }
  }
  function resize(): void {
    if (!project || disposed) return;
    mutation++;
    enqueue(async () => { width = Math.max(1, window.innerWidth); height = Math.max(1, window.innerHeight); await update(); });
  }
  function globalError(event: ErrorEvent): void { failed = true; report(event.message); }
  function rejection(event: PromiseRejectionEvent): void { failed = true; report(event.reason); }
  function dispose(): void {
    if (disposed) return;
    disposed = true; mutation++;
    window.removeEventListener('message', receive); window.removeEventListener('resize', resize);
    window.removeEventListener('error', globalError); window.removeEventListener('unhandledrejection', rejection); window.removeEventListener('pagehide', dispose);
    art?.dispose?.(); art = undefined; root.remove(); errorView?.remove();
  }
  window.addEventListener('message', receive); window.addEventListener('resize', resize);
  window.addEventListener('error', globalError); window.addEventListener('unhandledrejection', rejection); window.addEventListener('pagehide', dispose);
  if (standalone && initial) { document.title = initial.project.name; enqueue(() => apply(initial)); }
  else send('ready');
}
