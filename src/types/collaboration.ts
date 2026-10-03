// ============================================================================
// INNOVISTA CLOUD COLLABORATION SYSTEM - TYPE DEFINITIONS
// Hierarchy: Account Category -> Account Type -> Subtype -> Relationship -> Project -> Permission
// Entities: Person, Organization, Account
// ============================================================================

export type AccountCategory = 
  | 'INTERNAL'
  | 'PROFESSIONAL'
  | 'COMMERCIAL'
  | 'CLIENT'
  | 'SPECIALIST';

export type AccountStatus = 
  | 'Active'
  | 'Pending Activation'
  | 'Inactive'
  | 'Suspended';

export type PermissionActionType = 
  | 'VIEW'
  | 'UPDATE'
  | 'UPLOAD'
  | 'SHARE'
  | 'DOWNLOAD'
  | 'COMMENT'
  | 'MANAGE';

export type InformationCategory = 
  | 'General'
  | 'Sales'
  | 'Client'
  | 'Design'
  | 'Architecture'
  | 'Engineering'
  | 'QS/Commercial'
  | 'Site'
  | 'Fabrication'
  | 'Procurement'
  | 'Materials'
  | 'Workforce'
  | 'Quality'
  | 'Safety'
  | 'Contract'
  | 'Finance'
  | 'Invoice'
  | 'Progress'
  | 'Photos'
  | 'Drawings'
  | 'Communication'
  | 'Completion'
  | 'Warranty';

export const ALL_INFORMATION_CATEGORIES: InformationCategory[] = [
  'General',
  'Sales',
  'Client',
  'Design',
  'Architecture',
  'Engineering',
  'QS/Commercial',
  'Site',
  'Fabrication',
  'Procurement',
  'Materials',
  'Workforce',
  'Quality',
  'Safety',
  'Contract',
  'Finance',
  'Invoice',
  'Progress',
  'Photos',
  'Drawings',
  'Communication',
  'Completion',
  'Warranty'
];

export const ALL_PERMISSION_ACTIONS: PermissionActionType[] = [
  'VIEW',
  'UPDATE',
  'UPLOAD',
  'SHARE',
  'DOWNLOAD',
  'COMMENT',
  'MANAGE'
];

// Account Type Definition (Parent)
export interface AccountTypeDefinition {
  id: string;
  category: AccountCategory;
  name: string;
  code: string;
  description: string;
  isOptional?: boolean; // For optional internal accounts like Procurement, Finance, QC, Store, Doc Controller
  isActive: boolean;
  isSystem: boolean; // Cannot be hard-deleted if system core
  defaultPermissions?: Partial<Record<InformationCategory, PermissionActionType[]>>;
}

// Account Subtype Definition (Children of AccountType, dynamic, Admin-created)
export interface AccountSubtypeDefinition {
  id: string;
  parentTypeId: string; // References AccountTypeDefinition.id
  parentTypeName: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  isSystem: boolean; // Seeded vs custom Admin created
  availableFields?: string[];
  defaultPermissions?: Partial<Record<InformationCategory, PermissionActionType[]>>;
}

// 1. PERSON ENTITY (Individual human profile)
export interface Person {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  secondaryPhone?: string;
  title?: string;
  qualification?: string;
  experience?: string;
  registrationNumber?: string; // e.g. Engineering council reg, Architect reg, QS charter
  certifications: string[];
  skills: string[];
  organizationId?: string;
  organizationName?: string;
  avatarUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 2. ORGANIZATION ENTITY (Corporate / External company)
export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  registrationNumber?: string;
  category: AccountCategory;
  organizationType: string; // e.g. "Apparel Company", "Aluminium Supplier", "Structural Consultancy"
  email: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
  website?: string;
  taxId?: string;
  contactPersonName?: string;
  isPartner?: boolean;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

// 3. COLLABORATOR ACCOUNT ENTITY (Person + Role + Relationship + Project + Permissions)
export interface CollaboratorAccount {
  id: string;
  personId: string;
  personName: string;
  email: string;
  mobile: string;
  organizationId?: string;
  organizationName?: string;
  accountCategory: AccountCategory;
  accountTypeId: string;
  accountTypeName: string;
  subtypeId?: string;
  subtypeName?: string;
  relationshipType: string; // e.g. "Consultant QS", "Strategic Partner", "Referral Partner", "Direct Client"
  assignedProjectIds: string[];
  assignedProjectNames?: string[];
  skills: string[];
  informationPermissions: Record<InformationCategory, PermissionActionType[]>;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

// Project Team Member Assignment
export interface ProjectTeamMember {
  id: string;
  projectId: string;
  projectName: string;
  accountId: string;
  personId: string;
  personName: string;
  accountCategory: AccountCategory;
  accountTypeName: string;
  subtypeName?: string;
  relationshipType: string;
  organizationName?: string;
  permissions: Record<InformationCategory, PermissionActionType[]>;
  assignedAt: string;
  notes?: string;
}

// Predefined Skill
export interface SkillItem {
  id: string;
  name: string;
  category: 'Fabrication' | 'Engineering' | 'Design' | 'Commercial' | 'Management' | 'Safety' | 'General';
  description?: string;
}
