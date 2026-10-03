import React, { useState, useEffect } from 'react';
import { CompanySettings, BankDetail } from '../types';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Hash, 
  Plus, 
  Trash2,
  Save,
  ShieldCheck,
  Bell,
  Settings as SettingsIcon,
  Banknote,
  FileText,
  Palette,
  X,
  Download,
  Percent,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AccessControlCenter, SecurityTab } from './security/AccessControlCenter';
import { useSecurity } from '../context/SecurityContext';
import { MasterNumberingRegistry } from './settings/MasterNumberingRegistry';
import { LoginPageMediaManager } from './settings/LoginPageMediaManager';
import { GmailEmailAdminCenter } from './settings/GmailEmailAdminCenter';
import { numberingService } from '../services/numberingService';
import { loginMediaService, MAX_IMAGE_SIZE_BYTES } from '../services/loginMediaService';
import { toast } from 'sonner';

export type SettingsTab = 'profile' | 'branding' | 'email-templates' | 'financials' | 'system' | 'advanced' | 'access-control';

interface SettingsProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  onExportAll?: () => void;
  onImportAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportAllDocuments?: () => void;
  onResetSystem?: () => void;
  onGenerateAuditReport?: () => void;
  initialTab?: SettingsTab;
  initialSecurityTab?: SecurityTab;
}

export const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onSave, 
  onExportAll, 
  onImportAll,
  onExportAllDocuments,
  onResetSystem, 
  onGenerateAuditReport,
  initialTab = 'profile',
  initialSecurityTab
}) => {
  const { isAdminAuthority, effectiveUser, currentUser, hasPermission, canAccessPortal } = useSecurity();
  const isAdmin = isAdminAuthority || currentUser?.roleId === 'role-superadmin' || currentUser?.roleId === 'role-admin' || (currentUser as any)?.role === 'Admin';
  const [localSettings, setLocalSettings] = useState<CompanySettings>(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isResetting, setIsResetting] = useState(false);
  const [newDutyName, setNewDutyName] = useState('');
  const [newDutyRate, setNewDutyRate] = useState(5);
  const [newDutyCategory, setNewDutyCategory] = useState<'procurement' | 'import' | 'sales' | 'general'>('import');
  const [isAddingCurrency, setIsAddingCurrency] = useState(false);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSave = () => {
    if (!isAdmin) {
      toast.error('Permission Denied: Only Administrator accounts can configure corporate settings and tax parameters.');
      return;
    }
    const allSeqs = numberingService.getAllSequences();
    const quoteSeq = allSeqs.find(s => s.key === 'quotation');
    const invSeq = allSeqs.find(s => s.key === 'invoice');
    const merged: CompanySettings = {
      ...localSettings,
      quoteNumberPrefix: quoteSeq ? numberingService.getLegacyPrefixString('quotation') : localSettings.quoteNumberPrefix,
      nextQuoteNumber: quoteSeq ? quoteSeq.nextNumber : localSettings.nextQuoteNumber,
      invoiceNumberPrefix: invSeq ? numberingService.getLegacyPrefixString('invoice') : localSettings.invoiceNumberPrefix,
      nextInvoiceNumber: invSeq ? invSeq.nextNumber : localSettings.nextInvoiceNumber,
      numberingSequences: allSeqs
    };
    setLocalSettings(merged);
    onSave(merged);
    toast.success('Company & Financial Settings saved successfully');
  };

  const handleAddCustomDuty = () => {
    if (!isAdmin) {
      toast.error('Permission Denied: Only Admin can add custom duties/levies.');
      return;
    }
    if (!newDutyName.trim()) {
      toast.error('Please enter a duty or levy name.');
      return;
    }
    const existing = localSettings.customDutiesAndLevies || [];
    const updated = [
      ...existing,
      {
        id: `duty-${Date.now()}`,
        name: newDutyName.trim(),
        ratePercent: Number(newDutyRate) || 0,
        appliesTo: newDutyCategory,
        isActive: true
      }
    ];
    setLocalSettings({ ...localSettings, customDutiesAndLevies: updated });
    setNewDutyName('');
    toast.success(`Added duty: ${newDutyName}`);
  };

  const handleRemoveCustomDuty = (id: string) => {
    if (!isAdmin) {
      toast.error('Permission Denied: Only Admin can remove custom duties.');
      return;
    }
    const existing = localSettings.customDutiesAndLevies || [];
    setLocalSettings({
      ...localSettings,
      customDutiesAndLevies: existing.filter(d => d.id !== id)
    });
    toast.info('Custom duty removed');
  };

  const confirmAddCurrency = () => {
    const trimmed = newCurrencyCode.trim().toUpperCase();
    if (trimmed && !localSettings.currencies.includes(trimmed)) {
      setLocalSettings({
        ...localSettings,
        currencies: [...localSettings.currencies, trimmed]
      });
      toast.success(`Currency ${trimmed} added`);
    }
    setNewCurrencyCode('');
    setIsAddingCurrency(false);
  };

  const removeCurrency = (curr: string) => {
    if (localSettings.currencies.length <= 1) return;
    setLocalSettings({
      ...localSettings,
      currencies: localSettings.currencies.filter(c => c !== curr),
      defaultCurrency: localSettings.defaultCurrency === curr ? localSettings.currencies[0] : localSettings.defaultCurrency
    });
  };

  const addBankDetail = () => {
    const newBank: BankDetail = {
      id: crypto.randomUUID(),
      bankName: '',
      branchName: '',
      accountName: '',
      accountNumber: '',
      swiftCode: '',
      isDefault: localSettings.bankDetails.length === 0
    };
    setLocalSettings({
      ...localSettings,
      bankDetails: [...localSettings.bankDetails, newBank]
    });
  };

  const removeBankDetail = (id: string) => {
    if (localSettings.bankDetails.length <= 1) return;
    const filtered = localSettings.bankDetails.filter(b => b.id !== id);
    if (localSettings.bankDetails.find(b => b.id === id)?.isDefault) {
      filtered[0].isDefault = true;
    }
    setLocalSettings({
      ...localSettings,
      bankDetails: filtered
    });
  };

  const updateBankDetail = (id: string, field: keyof BankDetail, value: any) => {
    setLocalSettings({
      ...localSettings,
      bankDetails: localSettings.bankDetails.map(b => 
        b.id === id ? { ...b, [field]: value } : b
      )
    });
  };

  const setDefaultBank = (id: string) => {
    setLocalSettings({
      ...localSettings,
      bankDetails: localSettings.bankDetails.map(b => ({
        ...b,
        isDefault: b.id === id
      }))
    });
  };

  const activeUser = effectiveUser || currentUser;
  const isSuperAdmin =
    !activeUser ||
    activeUser.roleId === 'role-superadmin' ||
    activeUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR';

  const allTabs = [
    { id: 'profile', label: 'Company Profile', icon: Building2, description: 'Basic company information' },
    { id: 'email-templates', label: 'Gmail & Email Templates', icon: Mail, description: 'Gmail API, Email Template Manager, Event Engine, Traceability & Preferences' },
    { id: 'branding', label: 'Branding & Login Page', icon: Palette, description: 'Login page slideshow/video, logo, system name and PDF covers' },
    { id: 'system', label: 'Unique IDs & Auto-Numbering', icon: Hash, description: 'All document, task, invoice, quote & entity ID sequences' },
    { id: 'financials', label: 'Financials', icon: Banknote, description: 'Bank details and currency settings' },
    { id: 'access-control', label: 'Access Control & RBAC', icon: KeyRound, description: 'Users, roles, permissions and authorization center' },
    { id: 'advanced', label: 'Advanced', icon: ShieldCheck, description: 'Security, data management and experimental features' },
  ];

  const tabs = allTabs.filter(tab => {
    if (isSuperAdmin) return true;
    if (tab.id === 'profile' || tab.id === 'email-templates') return true;
    if (tab.id === 'access-control') {
      return canAccessPortal('system-administration') && (hasPermission('security.view') || hasPermission('security.admin') || hasPermission('security.configure'));
    }
    if (tab.id === 'financials') {
      return (canAccessPortal('system-administration') && hasPermission('settings.manage')) || (canAccessPortal('accounting-finance') && hasPermission('finance.approve'));
    }
    if (tab.id === 'branding' || tab.id === 'system' || tab.id === 'advanced') {
      return canAccessPortal('system-administration') && (hasPermission('settings.manage') || hasPermission('security.admin'));
    }
    return false;
  });

  useEffect(() => {
    if (!tabs.some(t => t.id === activeTab)) {
      setActiveTab('profile');
    }
  }, [tabs, activeTab]);

  return (
    <div className="w-full space-y-3 pb-8">
      {/* Simple One-Line Title & Sub-Portals Bar in White Background */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
            System & Organization Settings
          </h1>
          <span className="hidden lg:inline-block text-slate-300">|</span>

          {/* Sub-portal Selector / Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button 
            onClick={handleSave}
            className="btn-primary py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Save size={13} /> Save Changes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={activeTab === 'access-control' ? "w-full" : "card p-4 md:p-5"}
          >
            {activeTab === 'profile' && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900">Company Profile</h2>
                </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Company Name</label>
                        <input 
                          type="text"
                          value={localSettings.name ?? ''}
                          onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })}
                          className="input-field py-1 text-[11px]"
                          placeholder="Your Company Name"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Headquarters Address</label>
                        <div className="relative">
                          <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text"
                            value={localSettings.address ?? ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                            className="input-field pl-8 py-1 text-[11px]"
                            placeholder="Full business address"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Primary Phone</label>
                          <div className="relative">
                            <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              value={localSettings.phone ?? ''}
                              onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                              className="input-field pl-8 py-1 text-[11px]"
                              placeholder="+94 11 234 5678"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Business Email</label>
                          <div className="relative">
                            <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="email"
                              value={localSettings.email ?? ''}
                              onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })}
                              className="input-field pl-8 py-1 text-[11px]"
                              placeholder="hello@company.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Official Website</label>
                          <div className="relative">
                            <Globe size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              value={localSettings.website ?? ''}
                              onChange={(e) => setLocalSettings({ ...localSettings, website: e.target.value })}
                              className="input-field pl-8 py-1 text-[11px]"
                              placeholder="www.company.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">VAT / Tax Number</label>
                          <div className="relative">
                            <ShieldCheck size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              value={localSettings.vatNo ?? ''}
                              onChange={(e) => setLocalSettings({ ...localSettings, vatNo: e.target.value })}
                              className="input-field pl-8 py-1 text-[11px]"
                              placeholder="123456789-7000"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleSave}
                        className="btn-primary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest font-bold"
                      >
                        <Save size={14} /> Save Profile
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'branding' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-slate-900">
                        Login Page, Branding & PDF Customization
                      </h2>
                    </div>

                    <LoginPageMediaManager
                      localSettings={localSettings}
                      setLocalSettings={setLocalSettings}
                    />

                    <div className="h-px bg-slate-100" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Company Logo — Light Mode (Max 1 MB)</label>
                          <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all group">
                            {localSettings.logo ? (
                              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white">
                                <img src={localSettings.logo} alt="Light Mode Logo" className="w-full h-full object-contain" />
                                <button 
                                  onClick={() => {
                                    setLocalSettings({ ...localSettings, logo: undefined });
                                    loginMediaService.updateSettings({ companyLogoUrl: '' });
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-white/90 text-red-500 rounded-full shadow-sm hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 py-4">
                                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                  <Palette size={20} className="text-blue-600" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-500">Upload Light Mode Logo</p>
                                <p className="text-[8px] text-slate-400">PNG, JPG up to 1MB</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > MAX_IMAGE_SIZE_BYTES) {
                                    toast.error('Logo image exceeds 1 MB maximum size.');
                                    e.target.value = '';
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const dataUrl = reader.result as string;
                                    setLocalSettings({ ...localSettings, logo: dataUrl });
                                    loginMediaService.updateSettings({ companyLogoUrl: dataUrl });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                              id="logo-upload"
                            />
                            <label htmlFor="logo-upload" className="btn-secondary py-1.5 px-4 text-[9px] font-bold tracking-widest cursor-pointer">
                              Browse Files
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Company Logo — Dark Mode (Max 1 MB)</label>
                          <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all group">
                            {localSettings.logoDark ? (
                              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-700 bg-black">
                                <img src={localSettings.logoDark} alt="Dark Mode Logo" className="w-full h-full object-contain" />
                                <button 
                                  onClick={() => {
                                    setLocalSettings({ ...localSettings, logoDark: undefined });
                                    loginMediaService.updateSettings({ companyLogoDarkUrl: '' });
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-white/90 text-red-500 rounded-full shadow-sm hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 py-4">
                                <div className="p-3 bg-black border border-slate-700 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                  <Palette size={20} className="text-orange-500" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-500">Upload Dark Mode Logo</p>
                                <p className="text-[8px] text-slate-400">PNG, JPG up to 1MB</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > MAX_IMAGE_SIZE_BYTES) {
                                    toast.error('Dark Mode logo image exceeds 1 MB maximum size.');
                                    e.target.value = '';
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const dataUrl = reader.result as string;
                                    setLocalSettings({ ...localSettings, logoDark: dataUrl });
                                    loginMediaService.updateSettings({ companyLogoDarkUrl: dataUrl });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                              id="logo-dark-upload"
                            />
                            <label htmlFor="logo-dark-upload" className="btn-secondary py-1.5 px-4 text-[9px] font-bold tracking-widest cursor-pointer">
                              Browse Files
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Front Cover PDF</label>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText size={16} className={localSettings.frontCoverPdf ? "text-blue-600" : "text-slate-300"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate">
                                {localSettings.frontCoverPdf ? "Front Cover PDF Uploaded" : "No Front Cover PDF"}
                              </p>
                              <p className="text-[8px] text-slate-400 tracking-widest font-bold">PDF Format Only</p>
                            </div>
                            {localSettings.frontCoverPdf && (
                              <button 
                                onClick={() => setLocalSettings({ ...localSettings, frontCoverPdf: undefined })}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                            <input 
                              type="file" 
                              accept="application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setLocalSettings({ ...localSettings, frontCoverPdf: reader.result as string });
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                              id="front-cover-upload"
                            />
                            <label htmlFor="front-cover-upload" className="btn-secondary py-1 px-2 text-[8px] font-bold tracking-widest cursor-pointer">
                              {localSettings.frontCoverPdf ? "Change" : "Upload"}
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Back Cover PDF</label>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText size={16} className={localSettings.backCoverPdf ? "text-blue-600" : "text-slate-300"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate">
                                {localSettings.backCoverPdf ? "Back Cover PDF Uploaded" : "No Back Cover PDF"}
                              </p>
                              <p className="text-[8px] text-slate-400 tracking-widest font-bold">PDF Format Only</p>
                            </div>
                            {localSettings.backCoverPdf && (
                              <button 
                                onClick={() => setLocalSettings({ ...localSettings, backCoverPdf: undefined })}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                            <input 
                              type="file" 
                              accept="application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setLocalSettings({ ...localSettings, backCoverPdf: reader.result as string });
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                              id="back-cover-upload"
                            />
                            <label htmlFor="back-cover-upload" className="btn-secondary py-1 px-2 text-[8px] font-bold tracking-widest cursor-pointer">
                              {localSettings.backCoverPdf ? "Change" : "Upload"}
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Invoice Front Cover PDF</label>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText size={16} className={localSettings.invoiceFrontCoverPdf ? "text-blue-600" : "text-slate-300"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate">
                                {localSettings.invoiceFrontCoverPdf ? "Invoice Front Cover PDF Uploaded" : "No Invoice Front Cover PDF"}
                              </p>
                              <p className="text-[8px] text-slate-400 tracking-widest font-bold">PDF Format Only</p>
                            </div>
                            {localSettings.invoiceFrontCoverPdf && (
                              <button 
                                onClick={() => setLocalSettings({ ...localSettings, invoiceFrontCoverPdf: undefined })}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                            <input 
                              type="file" 
                              accept="application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setLocalSettings({ ...localSettings, invoiceFrontCoverPdf: reader.result as string });
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                              id="invoice-front-cover-upload"
                            />
                            <label htmlFor="invoice-front-cover-upload" className="btn-secondary py-1 px-2 text-[8px] font-bold tracking-widest cursor-pointer">
                              {localSettings.invoiceFrontCoverPdf ? "Change" : "Upload"}
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Invoice Back Cover PDF</label>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText size={16} className={localSettings.invoiceBackCoverPdf ? "text-blue-600" : "text-slate-300"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate">
                                {localSettings.invoiceBackCoverPdf ? "Invoice Back Cover PDF Uploaded" : "No Invoice Back Cover PDF"}
                              </p>
                              <p className="text-[8px] text-slate-400 tracking-widest font-bold">PDF Format Only</p>
                            </div>
                            {localSettings.invoiceBackCoverPdf && (
                              <button 
                                onClick={() => setLocalSettings({ ...localSettings, invoiceBackCoverPdf: undefined })}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                            <input 
                              type="file" 
                              accept="application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setLocalSettings({ ...localSettings, invoiceBackCoverPdf: reader.result as string });
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                              id="invoice-back-cover-upload"
                            />
                            <label htmlFor="invoice-back-cover-upload" className="btn-secondary py-1 px-2 text-[8px] font-bold tracking-widest cursor-pointer">
                              {localSettings.invoiceBackCoverPdf ? "Change" : "Upload"}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleSave}
                        className="btn-primary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest font-bold"
                      >
                        <Save size={14} /> Save Branding
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'financials' && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-sm font-bold tracking-tight text-slate-900">Bank Details</h2>
                        </div>
                        <button 
                          onClick={addBankDetail}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold tracking-widest text-[8px] hover:bg-blue-700 transition-all shadow-sm"
                        >
                          <Plus size={10} /> Add Bank Account
                        </button>
                      </div>

                      <div className="space-y-4">
                        {localSettings.bankDetails.map((bank, _) => (
                          <div key={bank.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              {bank.isDefault ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[7px] font-bold tracking-widest flex items-center gap-1">
                                  <ShieldCheck size={8} /> Default
                                </span>
                              ) : (
                                <button 
                                  onClick={() => setDefaultBank(bank.id)}
                                  className="px-2 py-0.5 bg-white border border-slate-200 text-slate-400 rounded-md text-[7px] font-bold tracking-widest hover:text-blue-600 hover:border-blue-600 transition-all"
                                >
                                  Set as Default
                                </button>
                              )}
                              {localSettings.bankDetails.length > 1 && (
                                <button 
                                  onClick={() => removeBankDetail(bank.id)}
                                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Bank Name</label>
                                <input 
                                  type="text"
                                  value={bank.bankName}
                                  onChange={(e) => updateBankDetail(bank.id, 'bankName', e.target.value)}
                                  className="input-field py-1 text-[11px]"
                                  placeholder="e.g. Commercial Bank"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Branch Name</label>
                                <input 
                                  type="text"
                                  value={bank.branchName}
                                  onChange={(e) => updateBankDetail(bank.id, 'branchName', e.target.value)}
                                  className="input-field py-1 text-[11px]"
                                  placeholder="e.g. Colombo 07"
                                />
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Account Name</label>
                                <input 
                                  type="text"
                                  value={bank.accountName}
                                  onChange={(e) => updateBankDetail(bank.id, 'accountName', e.target.value)}
                                  className="input-field py-1 text-[11px]"
                                  placeholder="e.g. Innovista Metal (Pvt) Ltd"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Account Number</label>
                                <input 
                                  type="text"
                                  value={bank.accountNumber}
                                  onChange={(e) => updateBankDetail(bank.id, 'accountNumber', e.target.value)}
                                  className="input-field py-1 text-[11px]"
                                  placeholder="e.g. 1234567890"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">SWIFT Code (Optional)</label>
                                <input 
                                  type="text"
                                  value={bank.swiftCode}
                                  onChange={(e) => updateBankDetail(bank.id, 'swiftCode', e.target.value)}
                                  className="input-field py-1 text-[11px]"
                                  placeholder="e.g. COMBPCE"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-900">Currency Management</h2>
                        <p className="text-slate-500 text-[9px] mt-0.5 font-bold tracking-wider">Define which currencies are available for your projects.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Default Currency</label>
                          <div className="relative">
                            <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select 
                              value={localSettings.defaultCurrency}
                              onChange={(e) => setLocalSettings({ ...localSettings, defaultCurrency: e.target.value })}
                              className="input-field pl-8 py-1 text-[11px] appearance-none bg-slate-50"
                            >
                              {localSettings.currencies.map(curr => (
                                <option key={curr} value={curr}>{curr}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Available Currencies</label>
                            {!isAddingCurrency ? (
                              <button 
                                type="button"
                                onClick={() => setIsAddingCurrency(true)}
                                className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-900 rounded-md font-bold tracking-widest text-[7px] hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                              >
                                <Plus size={7} /> Add New
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="e.g. USD, EUR, AUD"
                                  value={newCurrencyCode}
                                  onChange={e => setNewCurrencyCode(e.target.value)}
                                  className="w-20 px-1.5 py-0.5 text-[9px] font-bold border border-slate-300 rounded uppercase bg-white"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') confirmAddCurrency();
                                    if (e.key === 'Escape') setIsAddingCurrency(false);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={confirmAddCurrency}
                                  className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsAddingCurrency(false)}
                                  className="px-1 py-0.5 text-slate-400 hover:text-slate-600 text-[8px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {localSettings.currencies.map(curr => (
                              <div key={curr} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md group hover:border-blue-600 transition-all">
                                <span className="text-[9px] font-bold">{curr}</span>
                                <button 
                                  onClick={() => removeCurrency(curr)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={9} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-900">Retention Settings</h2>
                        <p className="text-slate-500 text-[9px] mt-0.5 font-bold tracking-wider">Configure default retention policies for projects.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Default Retention %</label>
                          <div className="relative">
                            <Percent size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="number"
                              value={localSettings.defaultRetentionPercent ?? 0}
                              onChange={(e) => setLocalSettings({ ...localSettings, defaultRetentionPercent: parseFloat(e.target.value) || 0 })}
                              className="input-field pl-8 py-1 text-[11px]"
                              placeholder="5"
                            />
                          </div>
                        </div>
                        <div className="space-y-1 md:col-span-3">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Retention Clauses</label>
                          <textarea 
                            value={localSettings.retentionClauses ?? ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, retentionClauses: e.target.value })}
                            className="input-field py-1 text-[11px] min-h-[60px]"
                            placeholder="Enter default retention clauses..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Statutory Taxation & Custom Duties Configuration */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            <span>Statutory Tax & Duties Configuration</span>
                          </h2>
                          <p className="text-slate-500 text-[9px] mt-0.5 font-bold tracking-wider">
                            Corporate tax parameters (VAT, Corporate Income Tax) & custom duties. Admin-only access.
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">
                          Admin Protected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-500 ml-1">
                            Standard Value Added Tax (VAT %)
                          </label>
                          <div className="relative">
                            <Percent size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="number"
                              value={localSettings.vatRatePercent ?? 18}
                              onChange={e =>
                                setLocalSettings({ ...localSettings, vatRatePercent: parseFloat(e.target.value) || 0 })
                              }
                              className="input-field pl-8 py-1 text-[11px] bg-white"
                              placeholder="18"
                              disabled={!isAdmin}
                            />
                          </div>
                          <p className="text-[8px] text-slate-400">Standard statutory rate (18% input/output VAT)</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-500 ml-1">
                            Corporate Income Tax Rate (%)
                          </label>
                          <div className="relative">
                            <Percent size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="number"
                              value={localSettings.corporateIncomeTaxRatePercent ?? 30}
                              onChange={e =>
                                setLocalSettings({
                                  ...localSettings,
                                  corporateIncomeTaxRatePercent: parseFloat(e.target.value) || 0
                                })
                              }
                              className="input-field pl-8 py-1 text-[11px] bg-white"
                              placeholder="30"
                              disabled={!isAdmin}
                            />
                          </div>
                          <p className="text-[8px] text-slate-400">Standard corporate tax rate on taxable profit (30%)</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-500 ml-1">
                            Tax Identification Number (TIN / VAT #)
                          </label>
                          <div className="relative">
                            <Hash size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={localSettings.taxIdentificationNumber ?? localSettings.vatNo ?? 'TIN-109283741-000'}
                              onChange={e =>
                                setLocalSettings({
                                  ...localSettings,
                                  taxIdentificationNumber: e.target.value,
                                  vatNo: e.target.value
                                })
                              }
                              className="input-field pl-8 py-1 text-[11px] bg-white"
                              placeholder="e.g. 109283741-000"
                              disabled={!isAdmin}
                            />
                          </div>
                          <p className="text-[8px] text-slate-400">Official Inland Revenue registration identifier</p>
                        </div>
                      </div>

                      {/* Custom Duties & Levies (Added by Admin) */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold tracking-wider text-slate-700">
                            Custom Duties & Levies (Configurable by Admin)
                          </label>
                          <span className="text-[9px] text-slate-400">Additional tariffs, customs & import levies</span>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                            <input
                              type="text"
                              placeholder="Duty/Levy Name (e.g. Customs Import Duty, Port Levy)"
                              value={newDutyName}
                              onChange={e => setNewDutyName(e.target.value)}
                              className="flex-1 input-field py-1 text-[11px]"
                            />
                            <div className="w-24 relative">
                              <input
                                type="number"
                                placeholder="Rate %"
                                value={newDutyRate}
                                onChange={e => setNewDutyRate(parseFloat(e.target.value) || 0)}
                                className="w-full input-field py-1 text-[11px]"
                              />
                            </div>
                            <select
                              value={newDutyCategory}
                              onChange={e => setNewDutyCategory(e.target.value as any)}
                              className="input-field py-1 text-[11px] bg-slate-50 w-32"
                            >
                              <option value="import">Import / Customs</option>
                              <option value="procurement">Procurement</option>
                              <option value="sales">Sales / Output</option>
                              <option value="general">General</option>
                            </select>
                            <button
                              type="button"
                              onClick={handleAddCustomDuty}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={11} />
                              <span>Add Levy</span>
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                          {((localSettings.customDutiesAndLevies && localSettings.customDutiesAndLevies.length > 0)
                            ? localSettings.customDutiesAndLevies
                            : [
                                { id: 'd-1', name: 'Customs General Duty', ratePercent: 15, appliesTo: 'import', isActive: true },
                                { id: 'd-2', name: 'Port & Airport Development Levy', ratePercent: 7.5, appliesTo: 'import', isActive: true },
                                { id: 'd-3', name: 'Environmental Levy', ratePercent: 1.0, appliesTo: 'procurement', isActive: true }
                              ]
                          ).map(duty => (
                            <div
                              key={duty.id}
                              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">{duty.name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {duty.ratePercent}% &bull; Category: {duty.appliesTo}
                                </p>
                              </div>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomDuty(duty.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Remove Duty"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleSave}
                        className="btn-primary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest font-bold"
                      >
                        <Save size={14} /> Save Financials
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'system' && (
                  <div className="space-y-6">
                    <MasterNumberingRegistry
                      localSettings={localSettings}
                      setLocalSettings={setLocalSettings}
                      onSaveSettings={onSave}
                    />

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-900">Default Commercial Terms</h2>
                        <p className="text-slate-500 text-[9px] mt-0.5 font-bold tracking-wider">Set default validity and delivery times for new quotations.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Default Validity (Days)</label>
                          <input 
                            type="number"
                            value={localSettings.defaultValidityDays ?? 15}
                            onChange={(e) => setLocalSettings({ ...localSettings, defaultValidityDays: parseInt(e.target.value) || 15 })}
                            className="input-field py-1 text-[11px]"
                            placeholder="15"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold tracking-widest text-slate-400 ml-1">Default Delivery (Days)</label>
                          <input 
                            type="number"
                            value={localSettings.defaultDeliveryDays ?? 21}
                            onChange={(e) => setLocalSettings({ ...localSettings, defaultDeliveryDays: parseInt(e.target.value) || 21 })}
                            className="input-field py-1 text-[11px]"
                            placeholder="21"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleSave}
                        className="btn-primary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest font-bold"
                      >
                        <Save size={14} /> Save All Numbering & System Defaults
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-900">Advanced Settings</h2>
                        <p className="text-slate-500 text-[9px] mt-0.5 font-bold tracking-wider">Experimental features and data management.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-blue-600 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <FileText size={12} className="text-slate-900" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-900">Export All Data</p>
                                <p className="text-[8px] font-medium text-slate-500">Download a backup of all your data.</p>
                            </div>
                          </div>
                          <button className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold tracking-widest text-[7px] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                            Export JSON
                          </button>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-blue-600 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <Bell size={12} className="text-slate-900" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">System Notifications</p>
                              <p className="text-[8px] font-medium text-slate-500">Manage how the system alerts you.</p>
                            </div>
                          </div>
                          <div 
                            onClick={() => setLocalSettings({ ...localSettings, enableNotifications: !localSettings.enableNotifications })}
                            className={`w-7 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${localSettings.enableNotifications ? 'bg-blue-600' : 'bg-slate-200'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${localSettings.enableNotifications ? 'translate-x-3' : 'translate-x-0'}`} />
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-blue-500 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <Download size={12} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">Export All Data (JSON)</p>
                              <p className="text-[8px] font-medium text-slate-500">Download a backup of all system data in JSON format.</p>
                            </div>
                          </div>
                          <button 
                            onClick={onExportAll}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold tracking-widest text-[7px] text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                          >
                            Export JSON
                          </button>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-blue-500 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <Plus size={12} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">Import System Data (JSON)</p>
                              <p className="text-[8px] font-medium text-slate-500">Restore your system data from a previously exported JSON backup.</p>
                            </div>
                          </div>
                          <label className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold tracking-widest text-[7px] text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer">
                            Import JSON
                            <input type="file" accept=".json" onChange={onImportAll} className="hidden" />
                          </label>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-blue-500 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <Download size={12} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">Download All Documents (ZIP)</p>
                              <p className="text-[8px] font-medium text-slate-500">Download all quotations, project reports, and variations in a single ZIP file.</p>
                            </div>
                          </div>
                          <button 
                            onClick={onExportAllDocuments}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold tracking-widest text-[7px] text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                          >
                            Download ZIP
                          </button>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-blue-500 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <FileText size={12} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">System Audit Report</p>
                              <p className="text-[8px] font-medium text-slate-500">Generate a comprehensive PDF report of all system activities.</p>
                            </div>
                          </div>
                          <button 
                            onClick={onGenerateAuditReport}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold tracking-widest text-[7px] text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                          >
                            Generate Report
                          </button>
                        </div>

                        <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between group hover:border-red-500 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <Trash2 size={12} className="text-red-500" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-red-600">Reset System</p>
                              <p className="text-[8px] font-medium text-red-400">Permanently delete all data.</p>
                            </div>
                          </div>
                          {isResetting ? (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setIsResetting(false)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold tracking-widest text-[7px] text-slate-600 hover:bg-slate-100 transition-all"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={onResetSystem}
                                className="px-2 py-1 bg-red-600 text-white rounded-lg font-bold tracking-widest text-[7px] hover:bg-red-700 transition-all"
                              >
                                Confirm Reset
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setIsResetting(true)}
                              className="px-2 py-1 bg-white border border-red-200 rounded-lg font-bold tracking-widest text-[7px] text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                            >
                              Reset All
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

            {activeTab === 'email-templates' && (
              <GmailEmailAdminCenter />
            )}

            {activeTab === 'access-control' && (
              <AccessControlCenter initialSecurityTab={initialSecurityTab} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
