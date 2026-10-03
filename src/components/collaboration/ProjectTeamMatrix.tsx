import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Sliders
} from 'lucide-react';
import {
  ProjectTeamMember,
  InformationCategory,
  PermissionActionType,
  ALL_INFORMATION_CATEGORIES,
  ALL_PERMISSION_ACTIONS,
  AccountCategory
} from '../../types/collaboration';
import {
  collaborationService
} from '../../services/collaborationService';

export interface ProjectTeamMatrixProps {
  initialProjectId?: string;
  projects?: { id: string; projectName: string }[];
}

export const ProjectTeamMatrix: React.FC<ProjectTeamMatrixProps> = ({
  initialProjectId = 'PRJ-2026-1001',
  projects = [
    { id: 'PRJ-2026-1001', projectName: 'ABC Commercial Factory Fitting' },
    { id: 'PRJ-2026-1002', projectName: 'Metropolitan Luxury Tower Façade' }
  ]
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>(() =>
    collaborationService.getProjectTeamMembers()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectTeamMember | null>(null);

  // Quick flash message
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const showFlash = (msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(null), 3000);
  };

  const refreshMembers = () => {
    setTeamMembers(collaborationService.getProjectTeamMembers());
  };

  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [selectedProjectId, projects]);

  const projectMembers = useMemo(() => {
    return teamMembers.filter(m => {
      const matchProj = m.projectId === selectedProjectId;
      const matchSearch =
        m.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.accountTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.subtypeName && m.subtypeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.relationshipType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.organizationName && m.organizationName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchProj && matchSearch;
    });
  }, [teamMembers, selectedProjectId, searchQuery]);

  const accounts = useMemo(() => collaborationService.getCollaboratorAccounts(), []);

  // Form states for adding member to project
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [customRelationship, setCustomRelationship] = useState('');
  const [memberNotes, setMemberNotes] = useState('');

  const handleTogglePermission = (
    member: ProjectTeamMember,
    cat: InformationCategory,
    action: PermissionActionType
  ) => {
    const currentActions = member.permissions[cat] || [];
    const exists = currentActions.includes(action);
    const updatedActions = exists
      ? currentActions.filter(a => a !== action)
      : [...currentActions, action];

    const updatedPermissions = {
      ...member.permissions,
      [cat]: updatedActions
    };

    collaborationService.updateProjectMemberPermissions(member.id, updatedPermissions);
    refreshMembers();
    showFlash(`Updated ${cat} permission for ${member.personName}`);
  };

  const handleRemoveMember = (id: string, name: string) => {
    if (confirm(`Remove ${name} from this project team?`)) {
      collaborationService.removeMemberFromProject(id);
      refreshMembers();
      showFlash(`Removed ${name} from project team.`);
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find(a => a.id === selectedAccountId);
    if (!acc || !currentProject) return;

    collaborationService.assignMemberToProject({
      projectId: currentProject.id,
      projectName: currentProject.projectName,
      accountId: acc.id,
      personId: acc.personId,
      personName: acc.personName,
      accountCategory: acc.accountCategory,
      accountTypeName: acc.accountTypeName,
      subtypeName: acc.subtypeName,
      relationshipType: customRelationship.trim() || acc.relationshipType,
      organizationName: acc.organizationName,
      permissions: acc.informationPermissions,
      notes: memberNotes.trim()
    });

    refreshMembers();
    setIsAddMemberModalOpen(false);
    setMemberNotes('');
    setCustomRelationship('');
    showFlash(`Assigned ${acc.personName} to ${currentProject.projectName}`);
  };

  const getCategoryColor = (cat: AccountCategory) => {
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
      
      {/* Flash Message */}
      {flashMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{flashMsg}</span>
          </div>
          <button onClick={() => setFlashMsg(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              Project Professional Team & Information Matrix
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Project Scoped RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign consultants, architects, engineers, QSs, fabricators, contractors, and clients to specific projects and regulate exact category visibility.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.projectName} ({p.id})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSelectedAccountId(accounts[0]?.id || '');
              setCustomRelationship('');
              setMemberNotes('');
              setIsAddMemberModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member to Project</span>
          </button>
        </div>
      </div>

      {/* Team Members List for this Project */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {currentProject?.projectName} &mdash; Team ({projectMembers.length} Members)
            </h3>
            <span className="text-[11px] text-slate-500">
              Each professional sees only the information categories permitted below
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team member..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Member Cards with Inline Information Permission Strip */}
        <div className="space-y-3">
          {projectMembers.map(m => {
            const isEditing = editingMember?.id === m.id;

            return (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs">
                      {m.personName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{m.personName}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getCategoryColor(m.accountCategory)}`}>
                          {m.accountTypeName}
                        </span>
                        {m.subtypeName && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {m.subtypeName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {m.relationshipType} &bull; <strong className="text-slate-700">{m.organizationName || 'Independent'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setEditingMember(isEditing ? null : m)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                        isEditing
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{isEditing ? 'Done Editing' : 'Edit Matrix'}</span>
                    </button>

                    <button
                      onClick={() => handleRemoveMember(m.id, m.personName)}
                      className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Information Category Strip (Interactive) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                    Permitted Information Categories:
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {ALL_INFORMATION_CATEGORIES.map(cat => {
                      const actions = m.permissions[cat] || [];
                      const hasAccess = actions.length > 0;

                      if (!hasAccess && !isEditing) return null;

                      return (
                        <div
                          key={cat}
                          className={`px-2 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                            hasAccess
                              ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="font-semibold">{cat}</span>

                          {hasAccess ? (
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-200/60 rounded text-blue-800">
                              {actions.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[9px] italic">None</span>
                          )}

                          {isEditing && (
                            <div className="flex items-center gap-0.5 ml-1 border-l border-slate-200 pl-1">
                              {ALL_PERMISSION_ACTIONS.map(action => {
                                const isChecked = actions.includes(action);
                                return (
                                  <button
                                    key={action}
                                    type="button"
                                    onClick={() => handleTogglePermission(m, cat, action)}
                                    className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold cursor-pointer ${
                                      isChecked
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-400 hover:text-slate-800 border border-slate-200'
                                    }`}
                                    title={`Toggle ${action} for ${cat}`}
                                  >
                                    {action[0]}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {Object.values(m.permissions).every(arr => arr.length === 0) && !isEditing && (
                      <span className="text-slate-400 text-xs italic">
                        No category permissions granted yet.
                      </span>
                    )}
                  </div>
                </div>

                {m.notes && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    <strong>Project Scope Note:</strong> {m.notes}
                  </div>
                )}
              </div>
            );
          })}

          {projectMembers.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No team members assigned to {currentProject?.projectName} yet. Click "Add Member to Project" to begin building the professional team.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD MEMBER TO PROJECT                                              */}
      {/* ========================================================================= */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Team Member to Project
                </h3>
                <p className="text-[11px] text-slate-500">
                  {currentProject?.projectName}
                </p>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Collaborator Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.personName} &mdash; {acc.accountTypeName} {acc.subtypeName ? `(${acc.subtypeName})` : ''} [{acc.organizationName || 'Independent'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Project Relationship (Optional override)
                </label>
                <input
                  type="text"
                  value={customRelationship}
                  onChange={(e) => setCustomRelationship(e.target.value)}
                  placeholder="e.g. Lead Façade Structural Consultant, Client QS"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Project Responsibility / Scope Notes
                </label>
                <textarea
                  rows={2}
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  placeholder="e.g. Responsible for wind calculations, checking shop drawings, interim payment approvals..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign to Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
