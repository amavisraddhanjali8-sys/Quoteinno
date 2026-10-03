import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Megaphone,
  Paperclip,
  Link2,
  Plus,
  Trash2,
  Send,
  FileText,
  Upload,
  Check,
  Pin,
  Sparkles,
  ListChecks
} from 'lucide-react';
import { SecurityUser } from '../../types/security';
import {
  LinkedPortalObject,
  SYSTEM_PORTAL_DIRECTORY
} from '../../services/centralMessagingService';
import {
  NewsSpecialAttachment,
  NewsSpecialLink,
  PublishedNewsBulletin
} from '../../services/notificationNewsService';

interface PublishNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: SecurityUser[];
  initialBulletin?: PublishedNewsBulletin | null;
  onPublish: (params: {
    id?: string;
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
    isPinnedGlobal: boolean;
  }) => void;
}

const QUICK_NEWS_TEMPLATES: {
  label: string;
  type: PublishedNewsBulletin['bulletinType'];
  priority: 'low' | 'medium' | 'high';
  title: string;
  subtitle: string;
  content: string;
  keyPoints: string[];
}[] = [
  {
    label: 'Company Update',
    type: 'Executive News',
    priority: 'medium',
    title: 'Monthly Company & Project Update',
    subtitle: 'For all staff',
    content: 'Please review the updated project schedule and monthly targets for all active sites and workshops.',
    keyPoints: ['Check updated project timelines', 'Submit weekly progress by Friday']
  },
  {
    label: 'Price & BOQ',
    type: 'Commercial Update',
    priority: 'high',
    title: 'New Aluminium & Glass Price List',
    subtitle: 'For Sales, BOQ & Procurement',
    content: 'New material rates for aluminium profiles and glass units are now active in the BOQ Catalog.',
    keyPoints: ['Use new rates for all new quotes', 'Review updated supplier price sheet']
  },
  {
    label: 'Safety Alert',
    type: 'Safety & HSE Alert',
    priority: 'high',
    title: 'Site Crane & Glazing Safety Rule',
    subtitle: 'Mandatory for Site & Factory Teams',
    content: 'Check wind speed and safety harnesses before lifting any glass or curtain wall panels.',
    keyPoints: ['Stop crane lifts in high wind', 'Complete daily safety check']
  },
  {
    label: 'Factory Notice',
    type: 'Operations Directive',
    priority: 'medium',
    title: 'Factory Shift & Machine Schedule',
    subtitle: 'For Workshop & Production',
    content: 'Updated cutting and assembly schedule for this week. Scan all completed panels before dispatch.',
    keyPoints: ['Update digital job cards', 'Scan QR tags before loading']
  },
  {
    label: 'HR Notice',
    type: 'Policy & HR Circular',
    priority: 'low',
    title: 'Holiday & Attendance Notice',
    subtitle: 'For all employees',
    content: 'Please submit leave requests and overtime sheets before the 25th of this month.',
    keyPoints: ['Submit timesheets by the 25th', 'Contact HR for any questions']
  }
];

const SIMPLE_TYPE_LABELS: {
  value: PublishedNewsBulletin['bulletinType'];
  label: string;
}[] = [
  { value: 'Executive News', label: 'General News' },
  { value: 'Commercial Update', label: 'Price & Sales' },
  { value: 'Operations Directive', label: 'Factory & Work' },
  { value: 'Safety & HSE Alert', label: 'Safety Alert' },
  { value: 'Policy & HR Circular', label: 'HR & Staff' },
  { value: 'System Release', label: 'System Update' }
];

export const PublishNewsModal: React.FC<PublishNewsModalProps> = ({
  isOpen,
  onClose,
  users,
  initialBulletin,
  onPublish
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [newKeyPoint, setNewKeyPoint] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bulletinType, setBulletinType] =
    useState<PublishedNewsBulletin['bulletinType']>('Executive News');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [targetRoleIds, setTargetRoleIds] = useState<string[]>(['ALL']);
  const [selectedPortalId, setSelectedPortalId] = useState<string>('');
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(true);
  const [isPinnedGlobal, setIsPinnedGlobal] = useState(true);

  // Attachments
  const [attachments, setAttachments] = useState<NewsSpecialAttachment[]>([]);
  const [newAttName, setNewAttName] = useState('');

  // Links
  const [specialLinks, setSpecialLinks] = useState<NewsSpecialLink[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  useEffect(() => {
    if (initialBulletin) {
      setTitle(initialBulletin.title);
      setSubtitle(initialBulletin.subtitle);
      setContent(initialBulletin.content);
      setKeyPoints(initialBulletin.keyPoints || []);
      setEffectiveDate(
        initialBulletin.effectiveDate || initialBulletin.publishedAtIso.slice(0, 10)
      );
      setBulletinType(initialBulletin.bulletinType);
      setPriority(initialBulletin.priority);
      setTargetRoleIds(initialBulletin.targetRoleIds || ['ALL']);
      setSelectedPortalId(initialBulletin.linkedPortal?.id || '');
      setRequiresAcknowledgement(initialBulletin.requiresAcknowledgement);
      setIsPinnedGlobal(initialBulletin.isPinnedGlobal ?? true);
      setAttachments(initialBulletin.attachments || []);
      setSpecialLinks(
        (initialBulletin.specialLinks || []).filter(l => l.linkType !== 'portal')
      );
    } else {
      setTitle('');
      setSubtitle('');
      setContent('');
      setKeyPoints([]);
      setEffectiveDate(new Date().toISOString().slice(0, 10));
      setBulletinType('Executive News');
      setPriority('high');
      setTargetRoleIds(['ALL']);
      setSelectedPortalId('');
      setRequiresAcknowledgement(true);
      setIsPinnedGlobal(true);
      setAttachments([]);
      setSpecialLinks([]);
    }
  }, [initialBulletin, isOpen]);

  if (!isOpen) return null;

  const uniqueRoles = Array.from(new Set(users.map(u => `${u.roleId}:::${u.roleName}`))).map(s => {
    const [id, name] = s.split(':::');
    return { id, name };
  });

  const toggleTargetRole = (roleId: string) => {
    if (roleId === 'ALL') {
      setTargetRoleIds(['ALL']);
      return;
    }
    setTargetRoleIds(prev => {
      const withoutAll = prev.filter(r => r !== 'ALL');
      if (withoutAll.includes(roleId)) {
        const next = withoutAll.filter(r => r !== roleId);
        return next.length === 0 ? ['ALL'] : next;
      }
      return [...withoutAll, roleId];
    });
  };

  const applyTemplate = (tpl: (typeof QUICK_NEWS_TEMPLATES)[number]) => {
    setTitle(tpl.title);
    setSubtitle(tpl.subtitle);
    setContent(tpl.content);
    setKeyPoints([...tpl.keyPoints]);
    setBulletinType(tpl.type);
    setPriority(tpl.priority);
  };

  const handleAddKeyPoint = () => {
    if (!newKeyPoint.trim()) return;
    setKeyPoints(prev => [...prev, newKeyPoint.trim()]);
    setNewKeyPoint('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType: NewsSpecialAttachment['fileType'] =
        ext === 'dwg'
          ? 'dwg'
          : ext === 'xlsx' || ext === 'xls' || ext === 'csv'
          ? 'xlsx'
          : ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp'
          ? 'image'
          : 'pdf';
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      const sizeLabel = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      setAttachments(prev => [
        ...prev,
        {
          id: `natt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          fileType,
          sizeLabel,
          description: 'Uploaded file'
        }
      ]);
    });
    if (e.target) e.target.value = '';
  };

  const handleQuickAddAttachment = () => {
    if (!newAttName.trim()) return;
    const formattedName = newAttName.includes('.') ? newAttName.trim() : `${newAttName.trim()}.pdf`;
    setAttachments(prev => [
      ...prev,
      {
        id: `natt-${Date.now()}`,
        name: formattedName,
        fileType: 'pdf',
        sizeLabel: '1.2 MB',
        description: 'Document'
      }
    ]);
    setNewAttName('');
  };

  const handleAddWebLink = () => {
    if (!newLinkLabel.trim()) return;
    setSpecialLinks(prev => [
      ...prev,
      {
        id: `nlnk-${Date.now()}`,
        label: newLinkLabel.trim(),
        url: newLinkUrl.trim() || 'https://innovista.lk',
        linkType: 'external_url'
      }
    ]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const primaryPortal = SYSTEM_PORTAL_DIRECTORY.find(p => p.id === selectedPortalId);

    onPublish({
      id: initialBulletin?.id,
      title: title.trim(),
      subtitle:
        subtitle.trim() ||
        (targetRoleIds.includes('ALL') ? 'All Staff' : 'Selected Teams'),
      content: content.trim(),
      keyPoints,
      effectiveDate,
      bulletinType,
      priority,
      targetRoleIds,
      targetDepartments: ['ALL'],
      attachments,
      specialLinks,
      linkedPortal: primaryPortal,
      requiresAcknowledgement,
      isPinnedGlobal
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[220] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Simple Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {initialBulletin ? 'Edit News' : 'Publish News'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Quick Templates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Quick Templates</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NEWS_TEMPLATES.map(tpl => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Category, Priority & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Topic</label>
              <select
                value={bulletinType}
                onChange={e => setBulletinType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              >
                {SIMPLE_TYPE_LABELS.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {[
                  { id: 'low', label: 'Normal' },
                  { id: 'medium', label: 'Important' },
                  { id: 'high', label: 'Urgent' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as any)}
                    className={`py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      priority === p.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* 3. Title & Short Summary */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Write a clear headline..."
                className="w-full px-3 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Short Summary</label>
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="e.g., For Factory & Site Teams"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Message *</label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your news message in simple words..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>
          </div>

          {/* 4. Key Action Points (Optional) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-slate-500" />
              <span>Key Points</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyPoint}
                onChange={e => setNewKeyPoint(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyPoint();
                  }
                }}
                placeholder="Add a short bullet point..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddKeyPoint}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
              >
                Add
              </button>
            </div>
            {keyPoints.length > 0 && (
              <div className="space-y-1">
                {keyPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 text-xs text-slate-800"
                  >
                    <span className="truncate">• {pt}</span>
                    <button
                      type="button"
                      onClick={() => setKeyPoints(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Audience Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Send To</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => toggleTargetRole('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  targetRoleIds.includes('ALL')
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Everyone
              </button>
              {uniqueRoles.map(r => {
                const active = !targetRoleIds.includes('ALL') && targetRoleIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleTargetRole(r.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Portal Link & Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Portal Link */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Portal Link</span>
              </label>
              <select
                value={selectedPortalId}
                onChange={e => setSelectedPortalId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="">None</option>
                {SYSTEM_PORTAL_DIRECTORY.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newLinkLabel}
                  onChange={e => setNewLinkLabel(e.target.value)}
                  placeholder="Web link title..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddWebLink}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {specialLinks.map(lnk => (
                <div
                  key={lnk.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs"
                >
                  <span className="truncate font-medium text-slate-700">{lnk.label}</span>
                  <button
                    type="button"
                    onClick={() => setSpecialLinks(prev => prev.filter(l => l.id !== lnk.id))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Files */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span>Files ({attachments.length})</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newAttName}
                  onChange={e => setNewAttName(e.target.value)}
                  placeholder="Or type file name (e.g. PriceList.pdf)"
                  className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleQuickAddAttachment}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {attachments.map(att => (
                <div
                  key={att.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium text-slate-700">{att.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="text-slate-400 hover:text-rose-600 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Simple Options */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinnedGlobal}
                onChange={e => setIsPinnedGlobal(e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
              <Pin className="w-3.5 h-3.5 text-slate-500" />
              <span>Pin to top</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAcknowledgement}
                onChange={e => setRequiresAcknowledgement(e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
              <Check className="w-3.5 h-3.5 text-slate-500" />
              <span>Ask staff to confirm reading</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{initialBulletin ? 'Save Changes' : 'Publish News'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
