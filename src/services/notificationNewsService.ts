import { SecurityUser } from '../types/security';
import { Notification } from '../types';
import {
  LinkedPortalObject,
  SYSTEM_PORTAL_DIRECTORY
} from './centralMessagingService';
import { numberingService } from './numberingService';

export interface NewsSpecialAttachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'dwg' | 'xlsx' | 'image' | 'doc';
  sizeLabel: string;
  description: string;
  dataUrl?: string;
}

export interface NewsSpecialLink {
  id: string;
  label: string;
  url: string;
  linkType: 'portal' | 'external_url' | 'document_ref';
  portalObject?: LinkedPortalObject;
}

export interface PublishedNewsBulletin {
  id: string;
  referenceCode: string;
  title: string;
  subtitle: string;
  content: string;
  keyPoints?: string[];
  effectiveDate?: string;
  bulletinType:
    | 'Executive News'
    | 'Operations Directive'
    | 'Safety & HSE Alert'
    | 'Policy & HR Circular'
    | 'Commercial Update'
    | 'System Release';
  priority: 'low' | 'medium' | 'high';
  publishedByUserId: string;
  publishedByName: string;
  publishedByRole: string;
  publishedAtIso: string;
  targetRoleIds: string[]; // ['ALL'] or specific roleIds
  targetDepartments: string[]; // ['ALL'] or specific departments
  attachments: NewsSpecialAttachment[];
  specialLinks: NewsSpecialLink[];
  linkedPortal?: LinkedPortalObject;
  requiresAcknowledgement: boolean;
  isPinnedGlobal?: boolean;
  acknowledgedByUserIds: string[];
  readByUserIds: string[];
  pinnedByUserIds: string[];
  notes: {
    id: string;
    authorName: string;
    authorRole: string;
    timestamp: string;
    text: string;
  }[];
}

export interface UnifiedAccountNotification {
  id: string;
  referenceCode: string;
  sourceKind: 'system_alert' | 'admin_news' | 'security_rbac' | 'task_assignment' | 'sla_deadline';
  slaRecordId?: string;
  deadlineIso?: string;
  title: string;
  subtitle: string;
  message: string;
  keyPoints?: string[];
  effectiveDate?: string;
  category: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  isRead: boolean;
  isPinned: boolean;
  publishedByName: string;
  publishedByRole: string;
  targetScopeLabel: string;
  action?: Notification['action'];
  linkedPortal?: LinkedPortalObject;
  attachments: NewsSpecialAttachment[];
  specialLinks: NewsSpecialLink[];
  requiresAcknowledgement?: boolean;
  isAcknowledged?: boolean;
  acknowledgedCount?: number;
  readCount?: number;
  notes: {
    id: string;
    authorName: string;
    authorRole: string;
    timestamp: string;
    text: string;
  }[];
}

const STORAGE_KEY_NEWS = 'innovista_published_news_bulletins_v2';
const STORAGE_KEY_NOTES = 'innovista_notification_item_notes_v1';

const SEED_NEWS_BULLETINS: PublishedNewsBulletin[] = [
  {
    id: 'news-bul-01',
    referenceCode: 'NWS-2026-101',
    title: 'Q4 Aluminium Extrusion & DGU Glass Tariff Revision & Master BOQ Sync',
    subtitle: 'Executive Commercial & Engineering Bulletin • Effective Immediately',
    content:
      'All Project Managers, Estimation Engineers, Procurement Officers, and Factory Managers are advised that the Q4 Master BOQ Rate Card for thermal-break aluminium profiles and 28mm Double Glazed Units (DGU) has been updated in the Engineering & BOQ Portal.\n\n• Updated alloy billet surcharge and PVDF coating rates are now live.\n• All new quotations and variation orders must reference Rate Revision R-2026.4.\n• Review the attached Master Rate Circular PDF and open the Engineering BOQ portal via the direct link below.',
    bulletinType: 'Executive News',
    priority: 'high',
    publishedByUserId: 'usr-admin-01',
    publishedByName: 'Alexander Vance',
    publishedByRole: 'Super Administrator',
    publishedAtIso: '2026-09-26T10:30:00Z',
    targetRoleIds: ['role-superadmin', 'role-md', 'role-pm', 'role-qs', 'role-engineer', 'role-procmgr', 'role-facmgr'],
    targetDepartments: ['ENGINEERING', 'PROCUREMENT_SUPPLY_CHAIN'],
    attachments: [
      {
        id: 'natt-1',
        name: 'Q4_2026_Master_Extrusion_DGU_Rate_Circular.pdf',
        fileType: 'pdf',
        sizeLabel: '2.4 MB',
        description: 'Signed Executive Tariff & Margin Matrix PDF'
      },
      {
        id: 'natt-2',
        name: 'Updated_Unitized_CurtainWall_BOM_Rates.xlsx',
        fileType: 'xlsx',
        sizeLabel: '890 KB',
        description: 'BOQ Cost Breakdown & Supplier MOQ Sheet'
      }
    ],
    specialLinks: [
      {
        id: 'nlnk-1',
        label: 'Open Engineering BOQ & Specs Engine',
        url: 'portal://boq-items',
        linkType: 'portal',
        portalObject: SYSTEM_PORTAL_DIRECTORY[6]
      },
      {
        id: 'nlnk-2',
        label: 'Open Procurement & Supply Chain Hub',
        url: 'portal://procurement',
        linkType: 'portal',
        portalObject: SYSTEM_PORTAL_DIRECTORY[7]
      },
      {
        id: 'nlnk-3',
        label: 'ISO-9001 Facade Glazing Standard Reference',
        url: 'https://www.iso.org/standard/62085.html',
        linkType: 'external_url'
      }
    ],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[6],
    requiresAcknowledgement: true,
    acknowledgedByUserIds: ['usr-superadmin', 'usr-pm-1'],
    readByUserIds: ['usr-superadmin'],
    pinnedByUserIds: ['usr-superadmin'],
    notes: [
      {
        id: 'nnote-1',
        authorName: 'Chaminda Silva',
        authorRole: 'Estimation Engineer',
        timestamp: 'Today, 11:12',
        text: 'Synchronized all 14 active tender templates with the R-2026.4 rate revision.'
      }
    ]
  },
  {
    id: 'news-bul-02',
    referenceCode: 'NWS-2026-102',
    title: 'Colombo Aluminium Plant — New CNC 5-Axis Machining Line Commissioning',
    subtitle: 'Factory & Production Operations Announcement • Bay 4 Ekala Plant',
    content:
      'Innovista Factory Operations has officially commissioned the new 5-Axis Elumatec SBZ-151 CNC Machining Center at FAC-CMB-01.\n\n• Daily curtain wall mullion/transom capacity increased by +38%.\n• Digital worksheets and barcode tracking are now mandatory for all Shift A and Shift B operators.\n• Please inspect the attached shopfloor layout drawing and open the Factory Control Center below.',
    bulletinType: 'Operations Directive',
    priority: 'medium',
    publishedByUserId: 'usr-fac-01',
    publishedByName: 'Rohan Wijesinghe',
    publishedByRole: 'Factory Manager',
    publishedAtIso: '2026-09-26T08:15:00Z',
    targetRoleIds: ['role-facmgr', 'role-workshopmgr', 'role-fabricator', 'role-qcinspec', 'role-qcmgr'],
    targetDepartments: ['FACTORY_PRODUCTION'],
    attachments: [
      {
        id: 'natt-3',
        name: 'Bay4_CNC_5Axis_Production_Flow_Rev02.dwg',
        fileType: 'dwg',
        sizeLabel: '5.1 MB',
        description: 'CAD Shopfloor Layout & Material Staging Bay'
      },
      {
        id: 'natt-4',
        name: 'CNC_Operator_Safety_And_Tolerance_Manual.pdf',
        fileType: 'pdf',
        sizeLabel: '1.8 MB',
        description: 'Mandatory QA/QC & Machine Calibration Guide'
      }
    ],
    specialLinks: [
      {
        id: 'nlnk-4',
        label: 'Open Factories & Workshop Control',
        url: 'portal://operational-control/factories',
        linkType: 'portal',
        portalObject: SYSTEM_PORTAL_DIRECTORY[0]
      },
      {
        id: 'nlnk-5',
        label: 'Open Equipment & Plant Machinery Portal',
        url: 'portal://equipment-management',
        linkType: 'portal',
        portalObject: SYSTEM_PORTAL_DIRECTORY[12]
      }
    ],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[0],
    requiresAcknowledgement: true,
    acknowledgedByUserIds: ['usr-superadmin', 'usr-fac-mgr-1'],
    readByUserIds: ['usr-superadmin', 'usr-fac-mgr-1'],
    pinnedByUserIds: [],
    notes: []
  },
  {
    id: 'news-bul-03',
    referenceCode: 'NWS-2026-103',
    title: 'Mandatory High-Wind Crane & Facade Hoisting Safety Protocol (Monsoon Advisory)',
    subtitle: 'HSE Safety & Site Operations Alert • All Active Construction Sites',
    content:
      'Due to seasonal gusting winds across Colombo coastal high-rise zones, all Site Supervisors, Project Managers, and Quality/HSE Inspectors must enforce strict anemometer wind-speed checks prior to hoisting unitized facade panels above Level 10.\n\n• Suspend tower crane glazing lifts if sustained wind speed exceeds 28 knots.\n• Log daily permit-to-work clearances in the Site & HSE Safety Portal.',
    bulletinType: 'Safety & HSE Alert',
    priority: 'high',
    publishedByUserId: 'usr-pm-01',
    publishedByName: 'Marcus Sterling',
    publishedByRole: 'Project Manager',
    publishedAtIso: '2026-09-25T16:45:00Z',
    targetRoleIds: ['role-sitemgr', 'role-sitesup', 'role-hse', 'role-pm', 'role-qcinspec', 'role-qcmgr'],
    targetDepartments: ['HSE'],
    attachments: [
      {
        id: 'natt-5',
        name: 'HSE_High_Altitude_Glazing_Lift_Checklist.pdf',
        fileType: 'pdf',
        sizeLabel: '950 KB',
        description: 'Permit-to-Work & Rigging Safety Checklist'
      }
    ],
    specialLinks: [
      {
        id: 'nlnk-6',
        label: 'Open Construction Site & HSE Safety Portal',
        url: 'portal://site-management',
        linkType: 'portal',
        portalObject: SYSTEM_PORTAL_DIRECTORY[9]
      }
    ],
    linkedPortal: SYSTEM_PORTAL_DIRECTORY[9],
    requiresAcknowledgement: true,
    acknowledgedByUserIds: ['usr-superadmin', 'usr-ent-admin', 'usr-sup-alu'],
    readByUserIds: ['usr-superadmin'],
    pinnedByUserIds: [],
    notes: []
  }
];

class NotificationNewsService {
  private bulletins: PublishedNewsBulletin[] = [];
  private customNotesMap: Record<
    string,
    { id: string; authorName: string; authorRole: string; timestamp: string; text: string }[]
  > = {};

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NEWS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.bulletins = parsed;
        } else {
          this.bulletins = SEED_NEWS_BULLETINS;
          this.saveBulletins();
        }
      } else {
        this.bulletins = SEED_NEWS_BULLETINS;
        this.saveBulletins();
      }

      const rawNotes = localStorage.getItem(STORAGE_KEY_NOTES);
      if (rawNotes) {
        this.customNotesMap = JSON.parse(rawNotes) || {};
      }
    } catch (e) {
      console.error('Failed to load notification news service:', e);
      this.bulletins = SEED_NEWS_BULLETINS;
    }
  }

  private saveBulletins(): void {
    try {
      localStorage.setItem(STORAGE_KEY_NEWS, JSON.stringify(this.bulletins));
    } catch (e) {
      console.error('Failed to save bulletins:', e);
    }
  }

  private saveNotes(): void {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(this.customNotesMap));
    } catch (e) {
      console.error('Failed to save notes:', e);
    }
  }

  public getBulletinsForUser(user: SecurityUser | null): PublishedNewsBulletin[] {
    if (!user) return [];

    return this.bulletins.filter(b => {
      if (b.publishedByUserId === user.id) return true;
      if (b.targetRoleIds.includes(user.roleId)) return true;
      if (!user.isExternalUser && (b.targetRoleIds.includes('ALL') || b.targetDepartments.includes('ALL'))) {
        return true;
      }
      if (user.department && b.targetDepartments.includes(user.department)) return true;
      return false;
    });
  }

  public getBulletinById(id: string): PublishedNewsBulletin | undefined {
    return this.bulletins.find(b => b.id === id);
  }

  public publishNewsBulletin(
    params: {
      title: string;
      subtitle: string;
      content: string;
      keyPoints?: string[];
      effectiveDate?: string;
      bulletinType: PublishedNewsBulletin['bulletinType'];
      priority: 'low' | 'medium' | 'high';
      targetRoleIds: string[];
      targetDepartments: string[];
      attachments: NewsSpecialAttachment[];
      specialLinks: NewsSpecialLink[];
      linkedPortal?: LinkedPortalObject;
      requiresAcknowledgement: boolean;
      isPinnedGlobal?: boolean;
    },
    publisher: SecurityUser
  ): PublishedNewsBulletin {
    const newBulletin: PublishedNewsBulletin = {
      id: `news-bul-${Date.now()}`,
      referenceCode: numberingService.consumeNextNumber('admin_news_bulletin'),
      title: params.title,
      subtitle: params.subtitle,
      content: params.content,
      keyPoints: params.keyPoints || [],
      effectiveDate: params.effectiveDate || new Date().toISOString().slice(0, 10),
      bulletinType: params.bulletinType,
      priority: params.priority,
      publishedByUserId: publisher.id,
      publishedByName: publisher.fullName,
      publishedByRole: publisher.roleName,
      publishedAtIso: new Date().toISOString(),
      targetRoleIds: params.targetRoleIds.length > 0 ? params.targetRoleIds : ['ALL'],
      targetDepartments: params.targetDepartments.length > 0 ? params.targetDepartments : ['ALL'],
      attachments: params.attachments,
      specialLinks: params.specialLinks,
      linkedPortal: params.linkedPortal,
      requiresAcknowledgement: params.requiresAcknowledgement,
      isPinnedGlobal: params.isPinnedGlobal ?? true,
      acknowledgedByUserIds: [publisher.id],
      readByUserIds: [publisher.id],
      pinnedByUserIds: params.isPinnedGlobal ? [publisher.id] : [],
      notes: []
    };

    this.bulletins = [newBulletin, ...this.bulletins];
    this.saveBulletins();
    return newBulletin;
  }

  public updateNewsBulletin(
    bulletinId: string,
    params: Partial<{
      title: string;
      subtitle: string;
      content: string;
      keyPoints: string[];
      effectiveDate: string;
      bulletinType: PublishedNewsBulletin['bulletinType'];
      priority: 'low' | 'medium' | 'high';
      targetRoleIds: string[];
      targetDepartments: string[];
      attachments: NewsSpecialAttachment[];
      specialLinks: NewsSpecialLink[];
      linkedPortal?: LinkedPortalObject;
      requiresAcknowledgement: boolean;
      isPinnedGlobal?: boolean;
    }>
  ): PublishedNewsBulletin | undefined {
    let updated: PublishedNewsBulletin | undefined;
    this.bulletins = this.bulletins.map(b => {
      if (b.id === bulletinId) {
        updated = {
          ...b,
          ...params
        };
        return updated;
      }
      return b;
    });
    this.saveBulletins();
    return updated;
  }

  public markBulletinRead(bulletinId: string, userId: string): void {
    this.bulletins = this.bulletins.map(b => {
      if (b.id === bulletinId && !b.readByUserIds.includes(userId)) {
        return { ...b, readByUserIds: [...b.readByUserIds, userId] };
      }
      return b;
    });
    this.saveBulletins();
  }

  public toggleBulletinPin(bulletinId: string, userId: string): void {
    this.bulletins = this.bulletins.map(b => {
      if (b.id === bulletinId) {
        const has = b.pinnedByUserIds.includes(userId);
        return {
          ...b,
          pinnedByUserIds: has
            ? b.pinnedByUserIds.filter(id => id !== userId)
            : [...b.pinnedByUserIds, userId]
        };
      }
      return b;
    });
    this.saveBulletins();
  }

  public acknowledgeBulletin(bulletinId: string, userId: string): void {
    this.bulletins = this.bulletins.map(b => {
      if (b.id === bulletinId && !b.acknowledgedByUserIds.includes(userId)) {
        return { ...b, acknowledgedByUserIds: [...b.acknowledgedByUserIds, userId] };
      }
      return b;
    });
    this.saveBulletins();
  }

  public deleteBulletin(bulletinId: string): void {
    this.bulletins = this.bulletins.filter(b => b.id !== bulletinId);
    this.saveBulletins();
  }

  public addNoteToItem(
    itemId: string,
    text: string,
    author: SecurityUser
  ): void {
    const now = new Date();
    const note = {
      id: `nnote-${Date.now()}`,
      authorName: author.fullName,
      authorRole: author.roleName,
      timestamp: `Today, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      text
    };

    const isBulletin = this.bulletins.some(b => b.id === itemId);
    if (isBulletin) {
      this.bulletins = this.bulletins.map(b =>
        b.id === itemId ? { ...b, notes: [note, ...b.notes] } : b
      );
      this.saveBulletins();
    } else {
      const existing = this.customNotesMap[itemId] || [];
      this.customNotesMap[itemId] = [note, ...existing];
      this.saveNotes();
    }
  }

  public getNotesForSystemNotification(itemId: string) {
    return this.customNotesMap[itemId] || [];
  }

  /**
   * Checks whether a system notification is directly relevant to the given user
   */
  public isSystemNotificationEligibleForUser(
    notif: Notification,
    user: SecurityUser | null
  ): boolean {
    if (!user) return false;

    const titleLower = (notif.title || '').toLowerCase().trim();
    const msgLower = (notif.message || '').toLowerCase().trim();

    // 1. Suppress generic UI toast noise, login greetings, and non-actionable system summaries
    if (
      titleLower.startsWith('welcome,') ||
      titleLower === 'success' ||
      titleLower === 'daily system summary' ||
      titleLower === 'pricing alert' ||
      titleLower === 'quote integrity issue' ||
      titleLower === 'settings saved' ||
      titleLower === 'template applied' ||
      titleLower === 'template saved' ||
      titleLower === 'template deleted' ||
      titleLower === 'data exported' ||
      titleLower === 'generating zip' ||
      titleLower === 'download ready' ||
      msgLower.includes('pdf generated successfully')
    ) {
      return false;
    }

    // 2. If explicitly targeted at a specific user ID, only that user sees it
    if (notif.targetUserId) {
      return notif.targetUserId === user.id;
    }

    // 3. If explicitly targeted at specific role IDs, only users with those roles see it
    if (notif.targetRoleIds && notif.targetRoleIds.length > 0) {
      return notif.targetRoleIds.includes(user.roleId);
    }

    // 4. If linked to a specific project, ensure user is assigned to that project
    const projectId = notif.action?.data?.projectId;
    if (projectId) {
      if (user.deniedProjectIds?.includes(projectId)) return false;
      if (
        user.assignedProjectIds &&
        user.assignedProjectIds.length > 0 &&
        !user.assignedProjectIds.includes('*') &&
        !user.assignedProjectIds.includes(projectId)
      ) {
        return false;
      }
    }

    const actionView = notif.action?.view || '';
    const cat = notif.category || 'General';
    const roleId = user.roleId;

    // Finance / Accounting notifications -> only Finance roles
    if (
      actionView === 'accounting' ||
      actionView === 'invoices' ||
      titleLower.includes('invoice') ||
      titleLower.includes('payment') ||
      cat === 'Accounting'
    ) {
      return roleId === 'role-finmgr' || roleId === 'role-acct';
    }

    // Project / Job / Variation notifications -> only Project & Site roles
    if (
      actionView === 'project-details' ||
      actionView === 'projects' ||
      actionView === 'variations' ||
      cat === 'Variation' ||
      titleLower.includes('job starting') ||
      titleLower.includes('job delayed')
    ) {
      return (
        roleId === 'role-pm' ||
        roleId === 'role-pcoord' ||
        roleId === 'role-sitemgr' ||
        roleId === 'role-sitesup'
      );
    }

    // Quotation / BOQ notifications -> only QS & Engineering/Sales roles
    if (
      actionView === 'editor' ||
      actionView === 'history' ||
      actionView === 'quote-details' ||
      titleLower.includes('quote') ||
      titleLower.includes('quotation') ||
      cat === 'BOQ' ||
      cat === 'Rate'
    ) {
      return roleId === 'role-qs' || roleId === 'role-engineer';
    }

    return false;
  }

  public resolvePortalForNotification(notif: Notification): LinkedPortalObject | undefined {
    const view = notif.action?.view;
    if (view === 'accounting' || view === 'invoices') return SYSTEM_PORTAL_DIRECTORY[10];
    if (view === 'project-details' || view === 'projects' || view === 'variations') {
      return SYSTEM_PORTAL_DIRECTORY[3];
    }
    if (view === 'editor' || view === 'history' || view === 'quote-details') {
      return SYSTEM_PORTAL_DIRECTORY[5];
    }
    if (notif.category === 'BOQ') return SYSTEM_PORTAL_DIRECTORY[6];
    return undefined;
  }

  public snoozeItem(itemId: string, durationMinutes: number): string {
    const snoozedUntilIso = new Date(Date.now() + Math.max(0.1, durationMinutes) * 60 * 1000).toISOString();
    try {
      const raw = localStorage.getItem('innovista_notif_snoozed_v1');
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[itemId] = snoozedUntilIso;
      localStorage.setItem('innovista_notif_snoozed_v1', JSON.stringify(map));
    } catch {}
    return snoozedUntilIso;
  }

  public markItemDone(itemId: string): void {
    try {
      const raw = localStorage.getItem('innovista_notif_done_v1');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(itemId)) {
        list.push(itemId);
        localStorage.setItem('innovista_notif_done_v1', JSON.stringify(list));
      }
    } catch {}
  }

  public isItemHiddenBySnoozeOrDone(itemId: string): boolean {
    try {
      const rawDone = localStorage.getItem('innovista_notif_done_v1');
      if (rawDone) {
        const doneList: string[] = JSON.parse(rawDone);
        if (Array.isArray(doneList) && doneList.includes(itemId)) {
          return true;
        }
      }
      const rawSnooze = localStorage.getItem('innovista_notif_snoozed_v1');
      if (rawSnooze) {
        const snoozeMap: Record<string, string> = JSON.parse(rawSnooze);
        const untilIso = snoozeMap[itemId];
        if (untilIso) {
          if (Date.now() < new Date(untilIso).getTime()) {
            return true;
          }
          delete snoozeMap[itemId];
          localStorage.setItem('innovista_notif_snoozed_v1', JSON.stringify(snoozeMap));
        }
      }
    } catch {}
    return false;
  }
}

export const notificationNewsService = new NotificationNewsService();
