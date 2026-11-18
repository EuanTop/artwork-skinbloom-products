/** Shared PNG limits: long documents remain bounded by total raster memory. */
export const CAPTURE_MAX_WIDTH = 4096;
export const CAPTURE_MAX_HEIGHT = 16384;
export const CAPTURE_MAX_PIXELS = 24_000_000;
export function validCaptureSize(width:number,height:number):boolean {
  return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width>=64 && height>=64 && width<=CAPTURE_MAX_WIDTH && height<=CAPTURE_MAX_HEIGHT && width*height<=CAPTURE_MAX_PIXELS;
}
export const RUNTIME_STATE_MAX_CHARACTERS=16_000_000;
export const ARTWORK_FILE_MAX_CHARACTERS=18_000_000;
export const API_VERSION = '1' as const;
export type PluginKind = 'data' | 'storage' | 'compiler' | 'renderer' | 'exporter' | 'publisher';
export interface PluginManifest { id: string; kind: PluginKind; version: string; apiVersion: string; capabilities: string[]; vendorVersion?: string }
export interface Plugin { manifest: PluginManifest; dispose?(): Promise<void> | void }
export type Value = number | string | boolean;
export interface Parameter { id: string; label: string; type: 'number' | 'color' | 'select' | 'boolean'; default: Value; min?: number; max?: number; step?: number; options?: string[]; group?: string; role?: 'art' | 'data' | 'runtime' }
export interface Mapping { field: string; transform: 'linear' | 'log' | 'reverse'; target: string }
export interface CameraState { position:[number,number,number]; target:[number,number,number] }
export interface RuntimeState { kind:string; version:number; data:string }
export interface ArtworkState { runtime?:RuntimeState; parameters: Record<string, Value>; mapping: Mapping; seed: number; time: number; paused: boolean; camera?:CameraState }
export interface Dataset { id: string; name: string; format: 'csv' | 'json'; hash: string; bytes: number; createdAt: string; schema?: unknown; profile?: unknown }
export interface DataResult { id: string; datasetId: string; sql: string; columns: string[]; rows: Record<string, unknown>[]; rowCount: number; truncated: boolean; createdAt: string }
export const dataColumnKinds = ['any', 'string', 'number', 'boolean'] as const;
export type DataColumnKind = typeof dataColumnKinds[number];
export interface DataBinding { field: string; channel: string; requires?: Record<string, DataColumnKind> }
export interface DataFit {
  required: string[];
  missing: string[];
  incompatible: { field: string; expected: DataColumnKind }[];
  unchecked: string[];
  advisoryMissing: string[];
}
export interface SourceFile { path: string; content: string; hash: string }
export interface Project { id: string; name: string; revision: number; updatedAt: string; state: ArtworkState; schema: Parameter[]; dataset?: Dataset; result?: DataResult; files: SourceFile[]; codeHash: string; notes: string; preset: string; renderer?: string; playbackMode?: 'explicit'; bindings?: DataBinding[] }
export interface ProjectEvent { cursor: number; projectId: string; revision: number; type: string; actor: string; detail: unknown; at: string }
export interface Checkpoint { id: string; projectId: string; label: string; revision: number; createdAt: string; project: Project }
export interface ThumbnailRecord { projectId: string; revision: number; codeHash: string; buildHash: string; fingerprint: string; contentHash: string; width: number; height: number; time: number; createdAt: string }
/** Derived previews never commit project state or source files. */
export interface ThumbnailStore {
  info(projectId: string): Promise<ThumbnailRecord | undefined>;
  get(projectId: string): Promise<{ record: ThumbnailRecord; bytes: Uint8Array } | undefined>;
  save(record: ThumbnailRecord, bytes: Uint8Array): Promise<boolean>;
}
export interface ProjectSummary { id: string; name: string; revision: number; updatedAt: string; thumbnail?: { status: 'ready' | 'stale' | 'waiting' | 'failed'; url?: string; revision?: number } }
export interface RepositoryPlugin extends Plugin {
  thumbnails?: ThumbnailStore;
  lifecycle?: {
    trash(id: string, expectedRevision: number): Promise<{ id: string; revision: number; deletedAt: string }>;
    restore(id: string, expectedRevision: number): Promise<Project>;
    listDeleted(): Promise<(ProjectSummary & { deletedAt: string })[]>;
  };
  create(project: Project): Promise<void>;
  list(): Promise<ProjectSummary[]>;
  get(id: string): Promise<Project>;
  commit(id: string, expectedRevision: number, next: Project, event: Omit<ProjectEvent, 'cursor'>): Promise<Project>;
  events(id: string, after?: number): Promise<ProjectEvent[]>;
  checkpoint(id: string, label: string): Promise<Checkpoint>;
  checkpoints(id: string): Promise<Checkpoint[]>;
  getCheckpoint(id: string, checkpointId: string): Promise<Checkpoint>;
  putBlob(key: string, content: Uint8Array): Promise<void>;
  getBlob(key: string): Promise<Uint8Array>;
  getProjectDirectory(id: string): string;
  syncFiles(project: Project): Promise<void>;
  saveJob(job: Job): Promise<void>;
  listJobs(): Promise<Job[]>;
}
export interface DataPlugin extends Plugin {
  importData(input: { id: string; name: string; format: 'csv' | 'json'; bytes: Uint8Array }): Promise<{ schema: unknown; profile: unknown }>;
  query(input: { datasetId: string; sql: string; maxRows: number }): Promise<{ columns: string[]; rows: Record<string, unknown>[]; rowCount: number; truncated: boolean }>;
  release(datasetId: string): Promise<void>;
}
export interface BuildArtifact { hash: string; script: string; createdAt: string }
export interface CompilerPlugin extends Plugin { compile(project: Project): Promise<BuildArtifact> }
export interface ExportPlugin extends Plugin { export(project: Project, build: BuildArtifact): Promise<{ filename: string; mimeType: string; bytes: Uint8Array }> }
export interface Publication { id:string; projectId:string; revision:number; title:string; createdAt:string; url:string; embedUrl:string; scope:'local'|'public'; contentHash:string }
export interface PublisherPlugin extends Plugin {
  publish(input:{projectId:string;revision:number;title:string;html:Uint8Array}):Promise<Publication>;
  list(projectId:string):Promise<Publication[]>;
  revoke(projectId:string,id:string):Promise<void>;
}
export interface RenderSnapshot { project: Project; buildHash: string; revision: number; time: number }
export interface PlaybackInfo { enabled:boolean; label:string; duration:number; reason?:string; enableParameters?:Record<string,Value>; usesSeed?:boolean; transport?:'hidden'|'playback'|'seek' }
export interface FrameClock { revision:number; buildHash:string; time:number; ended?:boolean }
export interface ArtworkObject { id: string; label: string; dataKey?: Record<string, Value> }
export interface RenderAck { revision: number; buildHash: string; frameTime: number; objects: ArtworkObject[]; timeline?:PlaybackInfo; diagnostics?:{width:number;height:number;pixelWidth:number;pixelHeight:number} }
export interface CaptureRequest { id: string; revision: number; buildHash: string; width: number; height: number; time: number }
export interface Job { id: string; projectId: string; type: 'capture' | 'export'; status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled'; revision: number; createdAt: string; filename?: string; error?: string; /** Relative preview path; requires the same service authorization as other API reads. */ previewPath?: string }
export interface RendererInstance { apply(snapshot: RenderSnapshot): void; capture(request: CaptureRequest): Promise<string>; dispose(): void }
export interface RendererPlugin extends Plugin { mount(host: HTMLElement, onAck: (ack: RenderAck) => void): RendererInstance }
export class WorkbenchError extends Error { constructor(public code: string, message: string, public status = 400) { super(message); this.name = 'WorkbenchError'; } }
