import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  UserCheck,
  Building2,
  FolderTree,
  Tag,
  Briefcase,
  Shield,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  AccountCategory,
  CollaboratorAccount,
  InformationCategory,
  PermissionActionType,
  ALL_INFORMATION_CATEGORIES,
  ALL_PERMISSION_ACTIONS
} from '../../types/collaboration';
import {
  collaborationService,
  getPresetPermissions
} from '../../services/collaborationService';

export interface AccountCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: (account: CollaboratorAccount) => void;
  initialAccount?: CollaboratorAccount | null;
  projects?: { id: string; projectName: string }[];
}

export const AccountCreationModal: React.FC<AccountCreationModalProps> = ({
  isOpen,
  onClose,
  onAccountCreated,
  initialAccount,
  projects = [
    { id: 'PRJ-2026-1001', projectName: 'ABC Commercial Factory Fitting' },
    { id: 'PRJ-2026-1002', projectName: 'Metropolitan Luxury Tower Façade' }
  ]
}) => {
  // Master lists from service
  const allTypes = useMemo(() => collaborationService.getAccountTypes(), []);
  const allSubtypes = useMemo(() => collaborationService.getSubtypes(), []);
  const allSkills = useMemo(() => collaborationService.getSkills(), []);
  const allOrganizations = useMemo(() => collaborationService.getOrganizations(), []);
  const allPersons = useMemo(() => collaborationService.getPersons(), []);

  // Form State
  const [category, setCategory] = useState<AccountCategory>(
    initialAccount?.accountCategory || 'PROFESSIONAL'
  );
  const [accountTypeId, setAccountTypeId] = useState<string>(
    initialAccount?.accountTypeId || 'type-engineer'
  );
  const [subtypeId, setSubtypeId] = useState<string>(
    initialAccount?.subtypeId || 'sub-eng-2'
  );

  // Person selection or creation
  const [personMode, setPersonMode] = useState<'existing' | 'new'>('existing');
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    initialAccount?.personId || allPersons[0]?.id || ''
  );
  const [personName, setPersonName] = useState(initialAccount?.personName || '');
  const [personEmail, setPersonEmail] = useState(initialAccount?.email || '');
  const [personMobile, setPersonMobile] = useState(initialAccount?.mobile || '');
  const [personTitle, setPersonTitle] = useState('Senior Consultant');
  const [personQualification, setPersonQualification] = useState('');
  const [personExperience, setPersonExperience] = useState('');
  const [personRegNumber, setPersonRegNumber] = useState('');

  // Organization
  const [orgMode, setOrgMode] = useState<'existing' | 'new' | 'none'>('existing');
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    initialAccount?.organizationId || allOrganizations[0]?.id || ''
  );
  const [newOrgName, setNewOrgName] = useState('');

  // Project & Relationship
  const [assignedProjectId, setAssignedProjectId] = useState<string>(
    initialAccount?.assignedProjectIds?.[0] || projects[0]?.id || ''
  );
  const [relationshipType, setRelationshipType] = useState<string>(
    initialAccount?.relationshipType || 'Consultant'
  );

  // Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialAccount?.skills || ['Structural Design', 'AutoCAD']
  );
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Permissions Matrix
  const [permissions, setPermissions] = useState<Record<InformationCategory, PermissionActionType[]>>(
    () => initialAccount?.informationPermissions || getPresetPermissions('engineer')
  );
  const [isMatrixExpanded, setIsMatrixExpanded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Engineer');

  // Filter types by selected Category
  const availableTypes = useMemo(() => {
    return allTypes.filter(t => t.category === category && t.isActive);
  }, [allTypes, category]);

  // When category changes, reset account type if not in category
  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.some(t => t.id === accountTypeId)) {
      setAccountTypeId(availableTypes[0].id);
    }
  }, [category, availableTypes, accountTypeId]);

  // Filter subtypes by selected Account Type
  const availableSubtypes = useMemo(() => {
    return allSubtypes.filter(s => s.parentTypeId === accountTypeId && s.isActive);
  }, [allSubtypes, accountTypeId]);

  // Auto-select first subtype if available
  useEffect(() => {
    if (availableSubtypes.length > 0) {
      if (!availableSubtypes.some(s => s.id === subtypeId)) {
        setSubtypeId(availableSubtypes[0].id);
      }
    } else {
      setSubtypeId('');
    }
  }, [accountTypeId, availableSubtypes, subtypeId]);

  // When existing person is selected, sync details
  useEffect(() => {
    if (personMode === 'existing' && selectedPersonId) {
      const p = allPersons.find(item => item.id === selectedPersonId);
      if (p) {
        setPersonName(p.fullName);
        setPersonEmail(p.email);
        setPersonMobile(p.mobile);
        setPersonTitle(p.title || '');
        setPersonQualification(p.qualification || '');
        setPersonExperience(p.experience || '');
        setPersonRegNumber(p.registrationNumber || '');
        if (p.skills && p.skills.length > 0) {
          setSelectedSkills(p.skills);
        }
        if (p.organizationId) {
          setSelectedOrgId(p.organizationId);
          setOrgMode('existing');
        }
      }
    }
  }, [selectedPersonId, personMode, allPersons]);

  // Handle preset application
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const newPerms = getPresetPermissions(presetName);
    setPermissions(newPerms);
  };

  const togglePermission = (cat: InformationCategory, action: PermissionActionType) => {
    const current = permissions[cat] || [];
    const exists = current.includes(action);
    const updated = exists ? current.filter(a => a !== action) : [...current, action];
    setPermissions({
      ...permissions,
      [cat]: updated
    });
  };

  const toggleAllActionsForCategory = (cat: InformationCategory) => {
    const current = permissions[cat] || [];
    if (current.length === ALL_PERMISSION_ACTIONS.length) {
      setPermissions({ ...permissions, [cat]: [] });
    } else {
      setPermissions({ ...permissions, [cat]: [...ALL_PERMISSION_ACTIONS] });
    }
  };

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
      collaborationService.saveSkill({ name: trimmed, category: 'General' });
      setCustomSkillInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedTypeObj = allTypes.find(t => t.id === accountTypeId);
    const selectedSubtypeObj = allSubtypes.find(s => s.id === subtypeId);
    const currentProject = projects.find(p => p.id === assignedProjectId);

    let finalPersonId = selectedPersonId;
    let finalPersonName = personName;
    let finalOrgId = orgMode === 'existing' ? selectedOrgId : undefined;
    let finalOrgName = '';

    if (orgMode === 'existing' && selectedOrgId) {
      const org = allOrganizations.find(o => o.id === selectedOrgId);
      finalOrgName = org?.name || '';
    } else if (orgMode === 'new' && newOrgName.trim()) {
      const createdOrg = collaborationService.saveOrganization({
        name: newOrgName.trim(),
        category,
        organizationType: selectedTypeObj?.name || 'Company'
      });
      finalOrgId = createdOrg.id;
      finalOrgName = createdOrg.name;
    }

    if (personMode === 'new') {
      const createdPerson = collaborationService.savePerson({
        fullName: personName.trim(),
        email: personEmail.trim(),
        mobile: personMobile.trim(),
        title: personTitle.trim(),
        qualification: personQualification.trim(),
        experience: personExperience.trim(),
        registrationNumber: personRegNumber.trim(),
        skills: selectedSkills,
        organizationId: finalOrgId,
        organizationName: finalOrgName
      });
      finalPersonId = createdPerson.id;
      finalPersonName = createdPerson.fullName;
    }

    const savedAccount = collaborationService.saveCollaboratorAccount({
      id: initialAccount?.id,
      personId: finalPersonId,
      personName: finalPersonName,
      email: personEmail,
      mobile: personMobile,
      organizationId: finalOrgId,
      organizationName: finalOrgName,
      accountCategory: category,
      accountTypeId,
      accountTypeName: selectedTypeObj?.name || 'Collaborator',
      subtypeId: selectedSubtypeObj?.id,
      subtypeName: selectedSubtypeObj?.name,
      relationshipType,
      assignedProjectIds: assignedProjectId ? [assignedProjectId] : [],
      assignedProjectNames: currentProject ? [currentProject.projectName] : [],
      skills: selectedSkills,
      informationPermissions: permissions,
      status: 'Active'
    });

    // Also assign to project team if project selected
    if (assignedProjectId && currentProject) {
      collaborationService.assignMemberToProject({
        projectId: assignedProjectId,
        projectName: currentProject.projectName,
        accountId: savedAccount.id,
        personId: finalPersonId,
        personName: finalPersonName,
        accountCategory: category,
        accountTypeName: selectedTypeObj?.name || 'Collaborator',
        subtypeName: selectedSubtypeObj?.name,
        relationshipType,
        organizationName: finalOrgName,
        permissions
      });
    }

    onAccountCreated(savedAccount);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              {initialAccount ? 'Edit Account & Permissions' : 'Create Account (Master Ecosystem)'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Account Category &rarr; Account Type &rarr; Subtype &rarr; Relationship &rarr; Project &rarr; Permissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* 1. Master Hierarchy Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <FolderTree className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Account Hierarchy & Specialization
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Account Category */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Account Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AccountCategory)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="INTERNAL">INTERNAL (Innovista In-House)</option>
                  <option value="PROFESSIONAL">PROFESSIONAL (Consultants/Engineers)</option>
                  <option value="COMMERCIAL">COMMERCIAL (Partners/Contractors/Suppliers)</option>
                  <option value="CLIENT">CLIENT (B2B/Resident/Developers)</option>
                  <option value="SPECIALIST">SPECIALIST (Testing/Certification/Insurance)</option>
                </select>
              </div>

              {/* Account Type */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Account Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={accountTypeId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setAccountTypeId(newId);
                    const t = allTypes.find(item => item.id === newId);
                    if (t) {
                      applyPreset(t.name);
                    }
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  {availableTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtype (Dynamic) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Specialist Subtype
                </label>
                {availableSubtypes.length > 0 ? (
                  <select
                    value={subtypeId}
                    onChange={(e) => setSubtypeId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    {availableSubtypes.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 italic">
                    No subtypes configured
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Person Entity */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Person Details
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPersonMode('existing')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    personMode === 'existing'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Select Existing Person
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPersonMode('new');
                    setPersonName('');
                    setPersonEmail('');
                    setPersonMobile('');
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    personMode === 'new'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Create New Person
                </button>
              </div>
            </div>

            {personMode === 'existing' ? (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Select Registered Person
                </label>
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  {allPersons.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} — {p.title || 'Professional'} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. John Perera"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={personEmail}
                    onChange={(e) => setPersonEmail(e.target.value)}
                    placeholder="john.perera@company.com"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={personMobile}
                    onChange={(e) => setPersonMobile(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Professional Profile Details (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Professional Qualification
                </label>
                <input
                  type="text"
                  value={personQualification}
                  onChange={(e) => setPersonQualification(e.target.value)}
                  placeholder="e.g. B.Sc. Eng, MRICS, AIA"
                  className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Experience
                </label>
                <input
                  type="text"
                  value={personExperience}
                  onChange={(e) => setPersonExperience(e.target.value)}
                  placeholder="e.g. 15 Years Façade Engineering"
                  className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Council / Charter Reg. No.
                </label>
                <input
                  type="text"
                  value={personRegNumber}
                  onChange={(e) => setPersonRegNumber(e.target.value)}
                  placeholder="e.g. IESL C-4912, SLIA A-1029"
                  className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. Organization / Company */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  3. Organization / Company
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setOrgMode('existing')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    orgMode === 'existing'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Existing Organization
                </button>
                <button
                  type="button"
                  onClick={() => setOrgMode('new')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    orgMode === 'new'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Add Organization
                </button>
                <button
                  type="button"
                  onClick={() => setOrgMode('none')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    orgMode === 'none'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Independent / Individual
                </button>
              </div>
            </div>

            {orgMode === 'existing' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Select Registered Company
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  {allOrganizations.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.organizationType} &bull; {o.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {orgMode === 'new' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  New Company Name
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Paramount Façades & Glazing Ltd"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {orgMode === 'none' && (
              <div className="text-xs text-slate-500 italic">
                Operating as an independent freelance consultant or private individual.
              </div>
            )}
          </div>

          {/* 4. Project & Relationship */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Briefcase className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Project Assignment & Relationship
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Assign Project
                </label>
                <select
                  value={assignedProjectId}
                  onChange={(e) => setAssignedProjectId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- No Direct Project Assignment --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Strategic / Project Relationship <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  placeholder="e.g. Strategic Partner, Consultant QS, Main Contractor, Referral Partner"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 5. Separate Skills Registry */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  5. Skills (Independent of Account Type)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                Multiple skills can be selected or created
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white border border-slate-200 rounded-lg custom-scrollbar">
              {allSkills.map(sk => {
                const isSelected = selectedSkills.includes(sk.name);
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => toggleSkill(sk.name)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                    <span>{sk.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom skill add */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder="Type custom skill tag and press Add..."
                className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* 6. Information Category & Permission Matrix */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  6. Information Categories & Permission Matrix
                </h3>
              </div>
              
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-semibold">Presets:</span>
                {['Engineer', 'QS', 'Architect', 'Designer', 'Client', 'Fabricator', 'Admin'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      selectedPreset.toLowerCase() === p.toLowerCase()
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Configure access across the 23 Information Categories: VIEW, UPDATE, UPLOAD, SHARE, DOWNLOAD, COMMENT, MANAGE.
            </p>

            <button
              type="button"
              onClick={() => setIsMatrixExpanded(!isMatrixExpanded)}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>{isMatrixExpanded ? 'Collapse Permission Grid' : 'Expand Full 23-Category Permission Grid'}</span>
              {isMatrixExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isMatrixExpanded && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto max-h-96 custom-scrollbar shadow-inner">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Information Category</th>
                      {ALL_PERMISSION_ACTIONS.map(action => (
                        <th key={action} className="py-2 px-2 text-center">
                          {action}
                        </th>
                      ))}
                      <th className="py-2 px-2 text-center">All</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {ALL_INFORMATION_CATEGORIES.map(cat => {
                      const currentActions = permissions[cat] || [];
                      const isAll = currentActions.length === ALL_PERMISSION_ACTIONS.length;

                      return (
                        <tr key={cat} className="hover:bg-blue-50/40">
                          <td className="py-1.5 px-3 font-sans font-semibold text-slate-900">
                            {cat}
                          </td>
                          {ALL_PERMISSION_ACTIONS.map(action => {
                            const isChecked = currentActions.includes(action);
                            return (
                              <td key={action} className="py-1.5 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(cat, action)}
                                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleAllActionsForCategory(cat)}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-sans cursor-pointer ${
                                isAll ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {isAll ? 'Clear' : 'Toggle'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialAccount ? 'Update Collaborator Account' : 'Provision Ecosystem Account'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
