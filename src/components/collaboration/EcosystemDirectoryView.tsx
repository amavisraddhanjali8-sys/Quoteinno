import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  FolderTree,
  Search,
  Plus,
  Shield,
  Edit2,
  Trash2,
  Phone,
  Mail,
  X
} from 'lucide-react';
import {
  AccountCategory,
  CollaboratorAccount,
  Person,
  Organization,
  ALL_INFORMATION_CATEGORIES
} from '../../types/collaboration';
import { collaborationService } from '../../services/collaborationService';
import { AccountCreationModal } from './AccountCreationModal';

export const EcosystemDirectoryView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'persons' | 'organizations'>('accounts');
  
  const [accounts, setAccounts] = useState<CollaboratorAccount[]>(() =>
    collaborationService.getCollaboratorAccounts()
  );
  const [persons, setPersons] = useState<Person[]>(() =>
    collaborationService.getPersons()
  );
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    collaborationService.getOrganizations()
  );

  const [categoryFilter, setCategoryFilter] = useState<AccountCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<CollaboratorAccount | null>(null);
  const [selectedAccountForPermissions, setSelectedAccountForPermissions] = useState<CollaboratorAccount | null>(null);

  const refreshData = () => {
    setAccounts(collaborationService.getCollaboratorAccounts());
    setPersons(collaborationService.getPersons());
    setOrganizations(collaborationService.getOrganizations());
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchCat = categoryFilter === 'ALL' || acc.accountCategory === categoryFilter;
      const matchSearch =
        acc.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.accountTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.subtypeName && acc.subtypeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (acc.organizationName && acc.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        acc.relationshipType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [accounts, categoryFilter, searchQuery]);

  const filteredPersons = useMemo(() => {
    return persons.filter(p => {
      return (
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.organizationName && p.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.skills && p.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    });
  }, [persons, searchQuery]);

  const filteredOrganizations = useMemo(() => {
    return organizations.filter(o => {
      const matchCat = categoryFilter === 'ALL' || o.category === categoryFilter;
      const matchSearch =
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.organizationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [organizations, categoryFilter, searchQuery]);

  const handleDeleteAccount = (id: string) => {
    if (confirm('Are you sure you want to deactivate and remove this account?')) {
      collaborationService.deleteCollaboratorAccount(id);
      refreshData();
    }
  };

  const getCategoryBadgeClass = (cat: AccountCategory) => {
    switch (cat) {
      case 'INTERNAL': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROFESSIONAL': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMMERCIAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CLIENT': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SPECIALIST': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              Innovista Collaboration & Ecosystem Accounts
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
              Person &bull; Organization &bull; Account
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Integrated construction directory separating Person (individual human), Organization (company entity), and Account (role, subtype, relationship, project & permissions).
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedAccountForEdit(null);
            setIsAccountModalOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Provision New Account</span>
        </button>
      </div>

      {/* Sub Tabs: Accounts | Persons | Organizations */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: 'accounts', label: `Accounts (${accounts.length})`, icon: FolderTree },
            { id: 'persons', label: `Persons (${persons.length})`, icon: Users },
            { id: 'organizations', label: `Organizations (${organizations.length})`, icon: Building2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="hidden md:flex items-center gap-1 text-xs">
          {(['ALL', 'INTERNAL', 'PROFESSIONAL', 'COMMERCIAL', 'CLIENT'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeSubTab}...`}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* TAB 1: ACCOUNTS LIST */}
      {activeSubTab === 'accounts' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">Person & Contact</th>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3">Category & Account Type</th>
                  <th className="py-2.5 px-3">Subtype / Discipline</th>
                  <th className="py-2.5 px-3">Relationship</th>
                  <th className="py-2.5 px-3">Assigned Projects</th>
                  <th className="py-2.5 px-3">Skills</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAccounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{acc.personName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{acc.email}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-700">
                        {acc.organizationName || 'Independent Consultant'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(acc.accountCategory)}`}>
                          {acc.accountCategory}
                        </span>
                        <span className="font-bold text-slate-800">{acc.accountTypeName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {acc.subtypeName ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {acc.subtypeName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">General</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 text-[11px] bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200/60">
                        {acc.relationshipType}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {(acc.assignedProjectNames || acc.assignedProjectIds || []).map((proj, idx) => (
                          <div key={idx} className="text-[11px] font-medium text-slate-600 truncate max-w-[140px]">
                            &bull; {proj}
                          </div>
                        ))}
                        {(!acc.assignedProjectNames || acc.assignedProjectNames.length === 0) && (
                          <span className="text-slate-400 text-[11px] italic">Global / None</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(acc.skills || []).slice(0, 2).map((sk, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {sk}
                          </span>
                        ))}
                        {(acc.skills || []).length > 2 && (
                          <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-500 font-mono">
                            +{acc.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAccountForPermissions(acc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                          title="View Information Category Permissions"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAccountForEdit(acc);
                            setIsAccountModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                      No collaborator accounts found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONS LIST */}
      {activeSubTab === 'persons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersons.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{p.fullName}</h4>
                  <div className="text-[11px] text-blue-600 font-semibold">{p.title || 'Professional'}</div>
                  {p.registrationNumber && (
                    <div className="text-[10px] text-slate-400 font-mono">Reg: {p.registrationNumber}</div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                  {p.fullName.slice(0, 2).toUpperCase()}
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="font-mono truncate">{p.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{p.mobile || 'No phone recorded'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-slate-700 truncate">{p.organizationName || 'Independent'}</span>
                </div>
              </div>

              {p.qualification && (
                <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                  <strong>Qual:</strong> {p.qualification}
                </div>
              )}

              {p.skills && p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {p.skills.map((s, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ORGANIZATIONS LIST */}
      {activeSubTab === 'organizations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrganizations.map(o => (
            <div key={o.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{o.name}</h4>
                  <div className="text-[11px] text-slate-500">{o.organizationType}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(o.category)}`}>
                  {o.category}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="font-mono truncate">{o.email || 'None'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{o.phone || 'None'}</span>
                </div>
                <div className="text-slate-500 text-[10px] line-clamp-1">
                  {o.address}, {o.city}
                </div>
              </div>

              {o.taxId && (
                <div className="text-[10px] font-mono text-slate-400">
                  TIN: {o.taxId}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: VIEW INFORMATION PERMISSIONS MATRIX                       */}
      {/* ========================================================================= */}
      {selectedAccountForPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Permissions Matrix: {selectedAccountForPermissions.personName}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedAccountForPermissions.accountTypeName} &bull; {selectedAccountForPermissions.subtypeName || 'Specialist'} ({selectedAccountForPermissions.relationshipType})
                </p>
              </div>
              <button
                onClick={() => setSelectedAccountForPermissions(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 text-[10px] uppercase font-bold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Information Category</th>
                    <th className="py-2 px-3">Allowed Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ALL_INFORMATION_CATEGORIES.map(cat => {
                    const actions = selectedAccountForPermissions.informationPermissions[cat] || [];
                    const hasAccess = actions.length > 0;

                    return (
                      <tr key={cat} className={hasAccess ? 'bg-blue-50/20' : 'bg-slate-50/30'}>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {cat}
                        </td>
                        <td className="py-2 px-3">
                          {hasAccess ? (
                            <div className="flex flex-wrap gap-1">
                              {actions.map(a => (
                                <span key={a} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No access</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedAccountForPermissions(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Creation / Edit Modal */}
      {isAccountModalOpen && (
        <AccountCreationModal
          isOpen={isAccountModalOpen}
          initialAccount={selectedAccountForEdit}
          onClose={() => {
            setIsAccountModalOpen(false);
            setSelectedAccountForEdit(null);
          }}
          onAccountCreated={() => {
            refreshData();
          }}
        />
      )}

    </div>
  );
};
