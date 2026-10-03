export interface LoginSlideImage {
  id: string;
  url: string;
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface LoginVideoConfig {
  url: string;
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface LoginPageMediaSettings {
  displayMode: 'slideshow' | 'video';
  systemName: string;
  companyLogoUrl?: string;
  companyLogoDarkUrl?: string;
  slideIntervalSeconds: number;
  slides: LoginSlideImage[];
  video: LoginVideoConfig | null;
}

const META_STORAGE_KEY = 'innovista_login_page_media_meta_v1';
const IDB_NAME = 'innovista_login_media_db';
const IDB_STORE = 'media_payloads';
const IDB_KEY = 'current_login_media';

export const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
export const MAX_VIDEO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const DEFAULT_LOGIN_SLIDES: LoginSlideImage[] = [
  {
    id: 'slide-default-1',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    fileName: 'curtain_wall_tower_01.jpg',
    sizeBytes: 420000,
    updatedAt: '2026-09-26T10:00:00Z'
  },
  {
    id: 'slide-default-2',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
    fileName: 'architectural_glass_facade_02.jpg',
    sizeBytes: 380000,
    updatedAt: '2026-09-26T10:05:00Z'
  },
  {
    id: 'slide-default-3',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80',
    fileName: 'precision_cnc_fabrication_03.jpg',
    sizeBytes: 510000,
    updatedAt: '2026-09-26T10:10:00Z'
  }
];

const DEFAULT_SETTINGS: LoginPageMediaSettings = {
  displayMode: 'slideshow',
  systemName: 'Innovista Precision Suite',
  companyLogoUrl: '',
  companyLogoDarkUrl: '',
  slideIntervalSeconds: 4,
  slides: DEFAULT_LOGIN_SLIDES,
  video: null
};

class LoginMediaService {
  private currentSettings: LoginPageMediaSettings = { ...DEFAULT_SETTINGS };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSync();
    this.loadFromIndexedDB();
  }

  private loadSync() {
    try {
      const raw = localStorage.getItem(META_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.currentSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          slides: Array.isArray(parsed.slides) ? parsed.slides : DEFAULT_LOGIN_SLIDES
        };
      }
    } catch (e) {
      console.error('Failed to read login media meta from localStorage:', e);
    }
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async loadFromIndexedDB() {
    try {
      const db = await this.openDb();
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        if (req.result) {
          this.currentSettings = {
            ...DEFAULT_SETTINGS,
            ...req.result,
            slides: Array.isArray(req.result.slides) ? req.result.slides : DEFAULT_LOGIN_SLIDES
          };
          this.notify();
        }
      };
    } catch (e) {
      // Fallback to localStorage already loaded
    }
  }

  private async persist(settings: LoginPageMediaSettings) {
    this.currentSettings = settings;
    this.notify();

    // Save to IndexedDB (supports 10MB video + multiple 1MB images easily)
    try {
      const db = await this.openDb();
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(settings, IDB_KEY);
    } catch (e) {
      console.warn('IndexedDB persist warning:', e);
    }

    // Also try saving to localStorage if small enough
    try {
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // If video is large (>4MB), store lightweight meta in localStorage while full video lives in IndexedDB
      try {
        const light = {
          ...settings,
          video: settings.video ? { ...settings.video, url: '' } : null
        };
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify(light));
      } catch {}
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getSettings(): LoginPageMediaSettings {
    return this.currentSettings;
  }

  public updateSettings(patch: Partial<LoginPageMediaSettings>): LoginPageMediaSettings {
    const next: LoginPageMediaSettings = {
      ...this.currentSettings,
      ...patch
    };
    this.persist(next);
    return next;
  }

  public addSlide(slide: Omit<LoginSlideImage, 'id' | 'updatedAt'>): LoginPageMediaSettings {
    const newSlide: LoginSlideImage = {
      ...slide,
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      updatedAt: new Date().toISOString()
    };
    const next: LoginPageMediaSettings = {
      ...this.currentSettings,
      slides: [...this.currentSettings.slides, newSlide]
    };
    this.persist(next);
    return next;
  }

  public updateSlide(
    slideId: string,
    patch: Partial<Omit<LoginSlideImage, 'id'>>
  ): LoginPageMediaSettings {
    const next: LoginPageMediaSettings = {
      ...this.currentSettings,
      slides: this.currentSettings.slides.map(s =>
        s.id === slideId ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
      )
    };
    this.persist(next);
    return next;
  }

  public deleteSlide(slideId: string): LoginPageMediaSettings {
    const next: LoginPageMediaSettings = {
      ...this.currentSettings,
      slides: this.currentSettings.slides.filter(s => s.id !== slideId)
    };
    this.persist(next);
    return next;
  }

  public setVideo(video: LoginVideoConfig | null): LoginPageMediaSettings {
    const next: LoginPageMediaSettings = {
      ...this.currentSettings,
      video,
      displayMode: video ? 'video' : 'slideshow'
    };
    this.persist(next);
    return next;
  }
}

export const loginMediaService = new LoginMediaService();
