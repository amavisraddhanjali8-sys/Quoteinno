import {
  AccountCategory,
  AccountTypeDefinition,
  AccountSubtypeDefinition,
  Person,
  Organization,
  CollaboratorAccount,
  ProjectTeamMember,
  SkillItem,
  InformationCategory,
  PermissionActionType,
  ALL_INFORMATION_CATEGORIES
} from '../types/collaboration';

// ============================================================================
// DEFAULT INFORMATION PERMISSION PRESETS
// ============================================================================

export const createEmptyPermissions = (): Record<InformationCategory, PermissionActionType[]> => {
  const perms: Record<InformationCategory, PermissionActionType[]> = {} as any;
  ALL_INFORMATION_CATEGORIES.forEach(cat => {
    perms[cat] = [];
  });
  return perms;
};

export const getPresetPermissions = (roleType: string): Record<InformationCategory, PermissionActionType[]> => {
  const p = createEmptyPermissions();

  switch (roleType.toLowerCase()) {
    case 'admin':
    case 'management':
      ALL_INFORMATION_CATEGORIES.forEach(cat => {
        p[cat] = ['VIEW', 'UPDATE', 'UPLOAD', 'SHARE', 'DOWNLOAD', 'COMMENT', 'MANAGE'];
      });
      break;

    case 'project manager':
      ALL_INFORMATION_CATEGORIES.forEach(cat => {
        if (cat === 'Finance') {
          p[cat] = ['VIEW', 'COMMENT'];
        } else {
          p[cat] = ['VIEW', 'UPDATE', 'UPLOAD', 'SHARE', 'DOWNLOAD', 'COMMENT', 'MANAGE'];
        }
      });
      break;

    case 'engineer':
      p['Engineering'] = ['VIEW', 'UPDATE', 'UPLOAD', 'DOWNLOAD', 'COMMENT'];
      p['Drawings'] = ['VIEW', 'UPDATE', 'UPLOAD', 'DOWNLOAD', 'COMMENT'];
      p['Site'] = ['VIEW', 'COMMENT'];
      p['Progress'] = ['VIEW', 'COMMENT'];
      p['Quality'] = ['VIEW', 'UPDATE', 'COMMENT'];
      p['Safety'] = ['VIEW', 'COMMENT'];
      p['Materials'] = ['VIEW', 'DOWNLOAD'];
      p['Photos'] = ['VIEW', 'UPLOAD'];
      p['General'] = ['VIEW'];
      break;

    case 'quantity surveyor':
    case 'qs':
      p['QS/Commercial'] = ['VIEW', 'UPDATE', 'UPLOAD', 'DOWNLOAD', 'COMMENT'];
      p['Materials'] = ['VIEW', 'UPDATE', 'DOWNLOAD'];
      p['Invoice'] = ['VIEW', 'DOWNLOAD', 'COMMENT'];
      p['Progress'] = ['VIEW', 'COMMENT'];
      p['Contract'] = ['VIEW', 'DOWNLOAD'];
      p['General'] = ['VIEW'];
      p['Finance'] = ['VIEW'];
      break;

    case 'architect':
      p['Architecture'] = ['VIEW', 'UPDATE', 'UPLOAD', 'DOWNLOAD', 'COMMENT'];
      p['Design'] = ['VIEW', 'UPDATE', 'UPLOAD', 'DOWNLOAD', 'COMMENT'];
      p['Drawings'] = ['VIEW', 'UPDATE', 'UPLOAD', 'DOWNLOAD'];
      p['Progress'] = ['VIEW', 'COMMENT'];
      p['Photos'] = ['VIEW', 'UPLOAD', 'DOWNLOAD'];
      p['General'] = ['VIEW'];
      break;

    case 'designer':
      p['Design'] = ['VIEW', 'UPDATE', 'UPLOAD', 'DOWNLOAD', 'COMMENT'];
      p['Drawings'] = ['VIEW', 'UPDATE', 'UPLOAD', 'DOWNLOAD'];
      p['Photos'] = ['VIEW', 'UPLOAD', 'DOWNLOAD'];
      p['Progress'] = ['VIEW'];
      p['Materials'] = ['VIEW', 'COMMENT'];
      p['General'] = ['VIEW'];
      break;

    case 'fabricator':
      p['Fabrication'] = ['VIEW', 'UPDATE', 'COMMENT'];
      p['Drawings'] = ['VIEW', 'DOWNLOAD'];
      p['Materials'] = ['VIEW', 'UPDATE'];
      p['Quality'] = ['VIEW'];
      p['Progress'] = ['VIEW', 'UPDATE'];
      break;

    case 'site supervisor':
      p['Site'] = ['VIEW', 'UPDATE', 'UPLOAD', 'COMMENT'];
      p['Progress'] = ['VIEW', 'UPDATE', 'UPLOAD'];
      p['Safety'] = ['VIEW', 'UPDATE', 'COMMENT'];
      p['Photos'] = ['VIEW', 'UPLOAD'];
      p['Workforce'] = ['VIEW', 'UPDATE'];
      p['Drawings'] = ['VIEW', 'DOWNLOAD'];
      break;

    case 'b2b client':
    case 'resident client':
    case 'client':
      p['Progress'] = ['VIEW'];
      p['Photos'] = ['VIEW', 'DOWNLOAD'];
      p['Invoice'] = ['VIEW', 'DOWNLOAD'];
      p['Completion'] = ['VIEW', 'DOWNLOAD'];
      p['Warranty'] = ['VIEW', 'DOWNLOAD'];
      p['Communication'] = ['VIEW', 'COMMENT'];
      p['General'] = ['VIEW'];
      break;

    case 'supplier':
      p['Procurement'] = ['VIEW', 'COMMENT'];
      p['Materials'] = ['VIEW', 'UPDATE', 'UPLOAD'];
      p['Invoice'] = ['VIEW', 'UPLOAD'];
      p['Communication'] = ['VIEW', 'COMMENT'];
      break;

    case 'contractor':
    case 'subcontractor':
      p['Site'] = ['VIEW', 'UPDATE', 'COMMENT'];
      p['Progress'] = ['VIEW', 'UPDATE'];
      p['Safety'] = ['VIEW', 'COMMENT'];
      p['Drawings'] = ['VIEW', 'DOWNLOAD'];
      p['Workforce'] = ['VIEW', 'UPDATE'];
      break;

    case 'strategic partner':
      p['General'] = ['VIEW'];
      p['Sales'] = ['VIEW', 'COMMENT'];
      p['Progress'] = ['VIEW'];
      p['Communication'] = ['VIEW', 'COMMENT'];
      break;

    default:
      p['General'] = ['VIEW'];
      p['Progress'] = ['VIEW'];
      p['Communication'] = ['VIEW', 'COMMENT'];
      break;
  }

  return p;
};

// ============================================================================
// SEED ACCOUNT TYPES (Admin Managed Hierarchy)
// ============================================================================

export const INITIAL_ACCOUNT_TYPES: AccountTypeDefinition[] = [
  // 1. Internal / Innovista Accounts
  { id: 'type-admin', category: 'INTERNAL', name: 'Admin', code: 'INT_ADMIN', description: 'Full administrative control over entire ecosystem and account hierarchy', isActive: true, isSystem: true },
  { id: 'type-management', category: 'INTERNAL', name: 'Management', code: 'INT_MGMT', description: 'Executive level management & operational governance', isActive: true, isSystem: true },
  { id: 'type-pm', category: 'INTERNAL', name: 'Project Manager', code: 'INT_PM', description: 'Project lead responsible for timeline, coordination and delivery', isActive: true, isSystem: true },
  { id: 'type-sales', category: 'INTERNAL', name: 'Sales Agent', code: 'INT_SALES', description: 'Client acquisition, quotations, and commercial proposals', isActive: true, isSystem: true },
  { id: 'type-hr', category: 'INTERNAL', name: 'HR', code: 'INT_HR', description: 'Human resources and workforce compliance management', isActive: true, isSystem: true },
  { id: 'type-supervisor', category: 'INTERNAL', name: 'Site Supervisor', code: 'INT_SITE_SUP', description: 'On-site execution, safety supervision, and contractor coordination', isActive: true, isSystem: true },
  { id: 'type-fabricator', category: 'INTERNAL', name: 'Fabricator', code: 'INT_FAB', description: 'Workshop fabrication, CNC cutting, welding and assembly', isActive: true, isSystem: true },
  { id: 'type-procurement', category: 'INTERNAL', name: 'Procurement / Purchasing Officer', code: 'INT_PROC', description: 'Material sourcing, purchase orders, and supplier negotiations', isOptional: true, isActive: true, isSystem: true },
  { id: 'type-finance', category: 'INTERNAL', name: 'Finance / Accounts Officer', code: 'INT_FIN', description: 'Invoicing, payment reconciliations, and financial oversight', isOptional: true, isActive: true, isSystem: true },
  { id: 'type-qc', category: 'INTERNAL', name: 'Quality / QC Officer', code: 'INT_QC', description: 'Quality assurance, tolerance inspections, and NCR management', isOptional: true, isActive: true, isSystem: true },
  { id: 'type-store', category: 'INTERNAL', name: 'Store / Inventory Officer', code: 'INT_STORE', description: 'Inventory management, warehouse logistics, and dispatch', isOptional: true, isActive: true, isSystem: true },
  { id: 'type-doc-ctrl', category: 'INTERNAL', name: 'Document Controller', code: 'INT_DOC_CTRL', description: 'Drawing revisions, submittals, transmittals, and archive control', isOptional: true, isActive: true, isSystem: true },

  // 2. Professional / Project Consultants
  { id: 'type-engineer', category: 'PROFESSIONAL', name: 'Engineer', code: 'PROF_ENG', description: 'Engineering design, structural analysis, MEP, and technical reviews', isActive: true, isSystem: true },
  { id: 'type-qs', category: 'PROFESSIONAL', name: 'Quantity Surveyor (QS)', code: 'PROF_QS', description: 'BOQ, measurements, cost management, valuations and variations', isActive: true, isSystem: true },
  { id: 'type-architect', category: 'PROFESSIONAL', name: 'Architect', code: 'PROF_ARCH', description: 'Architectural designs, material aesthetic approvals, and site aesthetics', isActive: true, isSystem: true },
  { id: 'type-designer', category: 'PROFESSIONAL', name: 'Designer', code: 'PROF_DES', description: 'Interior, architectural, lighting, and specialized spatial design', isActive: true, isSystem: true },
  { id: 'type-consultant', category: 'PROFESSIONAL', name: 'Consultant', code: 'PROF_CONS', description: 'General or specialized advisory consultant', isActive: true, isSystem: true },
  { id: 'type-surveyor', category: 'PROFESSIONAL', name: 'Surveyor', code: 'PROF_SURV', description: 'Land, site, and building measurement surveying', isActive: true, isSystem: true },
  { id: 'type-safety', category: 'PROFESSIONAL', name: 'Safety Professional', code: 'PROF_SAFE', description: 'HSE compliance, hazard assessments, and safety auditing', isActive: true, isSystem: true },

  // 3. Commercial Accounts
  { id: 'type-partner', category: 'COMMERCIAL', name: 'Strategic Partner', code: 'COMM_PARTNER', description: 'Strategic alliances, referral partners, and joint venture entities', isActive: true, isSystem: true },
  { id: 'type-supplier', category: 'COMMERCIAL', name: 'Supplier', code: 'COMM_SUPP', description: 'Material, hardware, machinery, and raw profile suppliers', isActive: true, isSystem: true },
  { id: 'type-contractor', category: 'COMMERCIAL', name: 'Contractor', code: 'COMM_CONT', description: 'Main and general building construction contractors', isActive: true, isSystem: true },
  { id: 'type-subcontractor', category: 'COMMERCIAL', name: 'Subcontractor', code: 'COMM_SUBCONT', description: 'Specialized trade subcontractors (glass, electrical, plumbing, etc.)', isActive: true, isSystem: true },
  { id: 'type-logistics', category: 'COMMERCIAL', name: 'Logistics Provider', code: 'COMM_LOG', description: 'Freight, delivery, heavy transport and crane operators', isActive: true, isSystem: true },
  { id: 'type-service-provider', category: 'COMMERCIAL', name: 'Service Provider', code: 'COMM_SERV', description: 'Specialized services, equipment maintenance, and IT', isActive: true, isSystem: true },

  // 4. Client Accounts
  { id: 'type-b2b-client', category: 'CLIENT', name: 'B2B Client', code: 'CLI_B2B', description: 'Commercial organizations, factories, hotels, corporate clients', isActive: true, isSystem: true },
  { id: 'type-resident-client', category: 'CLIENT', name: 'Resident Client', code: 'CLI_RES', description: 'Home owners, private residential clients, landlords', isActive: true, isSystem: true },
  { id: 'type-developer', category: 'CLIENT', name: 'Property Developer', code: 'CLI_DEV', description: 'Real estate developers, property owners, and investment groups', isActive: true, isSystem: true },
  { id: 'type-prop-manager', category: 'CLIENT', name: 'Property Manager', code: 'CLI_PROP_MGR', description: 'Commercial or residential property management agencies', isActive: true, isSystem: true },
  { id: 'type-fac-manager', category: 'CLIENT', name: 'Facility Manager', code: 'CLI_FAC_MGR', description: 'Building and facility management officers requesting maintenance', isActive: true, isSystem: true },

  // 5. Specialist Accounts
  { id: 'type-testing', category: 'SPECIALIST', name: 'Testing / Inspection', code: 'SPEC_TEST', description: 'Laboratory material testing, glass impact testing, QA inspection', isActive: true, isSystem: true },
  { id: 'type-cert-body', category: 'SPECIALIST', name: 'Certification Body', code: 'SPEC_CERT', description: 'Quality, safety, fire, and structural certification institutions', isActive: true, isSystem: true },
  { id: 'type-fin-inst', category: 'SPECIALIST', name: 'Financial Institution', code: 'SPEC_BANK', description: 'Commercial banks, lenders, and escrow financing entities', isActive: true, isSystem: true },
  { id: 'type-insurance', category: 'SPECIALIST', name: 'Insurance Provider', code: 'SPEC_INS', description: 'Contractors All-Risk, liability, and surety guarantee providers', isActive: true, isSystem: true },
  { id: 'type-other-spec', category: 'SPECIALIST', name: 'Other Specialist', code: 'SPEC_OTHER', description: 'Other independent technical or legal specialists', isActive: true, isSystem: true }
];

// ============================================================================
// SEED SUBTYPES (Dynamic - Admin Can Add/Edit from UI)
// ============================================================================

export const INITIAL_SUBTYPES: AccountSubtypeDefinition[] = [
  // DESIGNER SUBTYPES
  { id: 'sub-des-1', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Interior Designer', code: 'DES_INT', description: 'Commercial and residential interior aesthetics', isActive: true, isSystem: true },
  { id: 'sub-des-2', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Architectural Designer', code: 'DES_ARCH', description: 'Façade and structural aesthetics', isActive: true, isSystem: true },
  { id: 'sub-des-3', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Furniture Designer', code: 'DES_FURN', description: 'Custom joinery and commercial casework', isActive: true, isSystem: true },
  { id: 'sub-des-4', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Kitchen Designer', code: 'DES_KITCH', description: 'Modular kitchen and stainless cabinetry design', isActive: true, isSystem: true },
  { id: 'sub-des-5', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Landscape Designer', code: 'DES_LAND', description: 'Exterior and landscape spatial design', isActive: true, isSystem: true },
  { id: 'sub-des-6', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Lighting Designer', code: 'DES_LIGHT', description: 'Architectural and functional illumination', isActive: true, isSystem: true },
  { id: 'sub-des-7', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: '3D Visualizer', code: 'DES_3D', description: '3D rendering, animation, and CGI walkthroughs', isActive: true, isSystem: true },
  { id: 'sub-des-8', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'CAD Designer', code: 'DES_CAD', description: 'Shop drawings, BIM modeling, and fabrication drafting', isActive: true, isSystem: true },
  { id: 'sub-des-9', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Product Designer', code: 'DES_PROD', description: 'Extrusions and proprietary hardware design', isActive: true, isSystem: true },
  { id: 'sub-des-10', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Graphic / Branding Designer', code: 'DES_GRAPH', description: 'Signage, wayfinding, and spatial branding', isActive: true, isSystem: true },
  { id: 'sub-des-11', parentTypeId: 'type-designer', parentTypeName: 'Designer', name: 'Other Designer', code: 'DES_OTHER', description: 'Specialized design discipline', isActive: true, isSystem: true },

  // ENGINEER SUBTYPES
  { id: 'sub-eng-1', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Civil Engineer', code: 'ENG_CIVIL', description: 'Infrastructure, foundations, and earthworks', isActive: true, isSystem: true },
  { id: 'sub-eng-2', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Structural Engineer', code: 'ENG_STRUCT', description: 'Load calculation, steel structures, aluminium framing', isActive: true, isSystem: true },
  { id: 'sub-eng-3', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Mechanical Engineer', code: 'ENG_MECH', description: 'HVAC, lifts, and mechanical apparatus', isActive: true, isSystem: true },
  { id: 'sub-eng-4', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Electrical Engineer', code: 'ENG_ELEC', description: 'Power distribution, lighting circuits, and panels', isActive: true, isSystem: true },
  { id: 'sub-eng-5', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'MEP Engineer', code: 'ENG_MEP', description: 'Integrated mechanical, electrical, and plumbing systems', isActive: true, isSystem: true },
  { id: 'sub-eng-6', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'HVAC Engineer', code: 'ENG_HVAC', description: 'Ventilation and climate conditioning systems', isActive: true, isSystem: true },
  { id: 'sub-eng-7', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Fire Protection Engineer', code: 'ENG_FIRE', description: 'Sprinkler, smoke management, and fire safety systems', isActive: true, isSystem: true },
  { id: 'sub-eng-8', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Plumbing Engineer', code: 'ENG_PLUMB', description: 'Potable water, drainage, and waste plumbing', isActive: true, isSystem: true },
  { id: 'sub-eng-9', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Environmental Engineer', code: 'ENG_ENV', description: 'Sustainability, LEED certification, acoustics', isActive: true, isSystem: true },
  { id: 'sub-eng-10', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Geotechnical Engineer', code: 'ENG_GEOTECH', description: 'Soil investigations and piling', isActive: true, isSystem: true },
  { id: 'sub-eng-11', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Quantity / Cost Engineer', code: 'ENG_COST', description: 'Engineering cost calculations and variations', isActive: true, isSystem: true },
  { id: 'sub-eng-12', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Project Engineer', code: 'ENG_PROJ', description: 'General engineering site supervision', isActive: true, isSystem: true },
  { id: 'sub-eng-13', parentTypeId: 'type-engineer', parentTypeName: 'Engineer', name: 'Other Engineer', code: 'ENG_OTHER', description: 'Specialized engineering field', isActive: true, isSystem: true },

  // QS SUBTYPES
  { id: 'sub-qs-1', parentTypeId: 'type-qs', parentTypeName: 'Quantity Surveyor (QS)', name: 'Main Contractor QS', code: 'QS_MAIN_CONT', description: 'Commercial operations for the general contractor', isActive: true, isSystem: true },
  { id: 'sub-qs-2', parentTypeId: 'type-qs', parentTypeName: 'Quantity Surveyor (QS)', name: 'Consultant QS', code: 'QS_CONS', description: 'Independent consulting QS acting on project specifications', isActive: true, isSystem: true },
  { id: 'sub-qs-3', parentTypeId: 'type-qs', parentTypeName: 'Quantity Surveyor (QS)', name: 'Client-side QS', code: 'QS_CLIENT', description: 'Cost oversight for the property developer/owner', isActive: true, isSystem: true },
  { id: 'sub-qs-4', parentTypeId: 'type-qs', parentTypeName: 'Quantity Surveyor (QS)', name: 'Cost Consultant', code: 'QS_COST_CONS', description: 'Feasibility studies and cost benchmarking', isActive: true, isSystem: true },
  { id: 'sub-qs-5', parentTypeId: 'type-qs', parentTypeName: 'Quantity Surveyor (QS)', name: 'Estimator', code: 'QS_EST', description: 'Tender estimates, take-offs, and pricing', isActive: true, isSystem: true },
  { id: 'sub-qs-6', parentTypeId: 'type-qs', parentTypeName: 'Quantity Surveyor (QS)', name: 'Contract Administrator', code: 'QS_CONT_ADMIN', description: 'Contract management, notices, and payment certificates', isActive: true, isSystem: true },
  { id: 'sub-qs-7', parentTypeId: 'type-qs', parentTypeName: 'Quantity Surveyor (QS)', name: 'Other QS', code: 'QS_OTHER', description: 'Specialized quantity surveying role', isActive: true, isSystem: true },

  // ARCHITECT SUBTYPES
  { id: 'sub-arch-1', parentTypeId: 'type-architect', parentTypeName: 'Architect', name: 'Principal Architect', code: 'ARCH_PRINC', description: 'Lead architectural firm partner / chief designer', isActive: true, isSystem: true },
  { id: 'sub-arch-2', parentTypeId: 'type-architect', parentTypeName: 'Architect', name: 'Project Architect', code: 'ARCH_PROJ', description: 'Dedicated architectural project manager', isActive: true, isSystem: true },
  { id: 'sub-arch-3', parentTypeId: 'type-architect', parentTypeName: 'Architect', name: 'Design Architect', code: 'ARCH_DES', description: 'Concept development and schematic designs', isActive: true, isSystem: true },
  { id: 'sub-arch-4', parentTypeId: 'type-architect', parentTypeName: 'Architect', name: 'Site Architect', code: 'ARCH_SITE', description: 'On-site compliance and architectural inspections', isActive: true, isSystem: true },
  { id: 'sub-arch-5', parentTypeId: 'type-architect', parentTypeName: 'Architect', name: 'Landscape Architect', code: 'ARCH_LAND', description: 'External terrain and flora architecture', isActive: true, isSystem: true },
  { id: 'sub-arch-6', parentTypeId: 'type-architect', parentTypeName: 'Architect', name: 'Conservation Architect', code: 'ARCH_CONS', description: 'Heritage and restoration architecture', isActive: true, isSystem: true },
  { id: 'sub-arch-7', parentTypeId: 'type-architect', parentTypeName: 'Architect', name: 'Other Architect', code: 'ARCH_OTHER', description: 'Specialized architectural practice', isActive: true, isSystem: true },

  // CONSULTANT SUBTYPES
  { id: 'sub-cons-1', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Project Consultant', code: 'CONS_PROJ', description: 'Comprehensive project management advisory', isActive: true, isSystem: true },
  { id: 'sub-cons-2', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Management Consultant', code: 'CONS_MGMT', description: 'Strategic corporate advisory', isActive: true, isSystem: true },
  { id: 'sub-cons-3', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Construction Consultant', code: 'CONS_CONST', description: 'Construction methodology and buildability advisory', isActive: true, isSystem: true },
  { id: 'sub-cons-4', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'MEP Consultant', code: 'CONS_MEP', description: 'Electromechanical advisory services', isActive: true, isSystem: true },
  { id: 'sub-cons-5', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Fire Consultant', code: 'CONS_FIRE', description: 'Fire engineering and code compliance', isActive: true, isSystem: true },
  { id: 'sub-cons-6', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Environmental Consultant', code: 'CONS_ENV', description: 'EIA assessments and carbon footprint analysis', isActive: true, isSystem: true },
  { id: 'sub-cons-7', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Safety Consultant', code: 'CONS_SAFE', description: 'Independent HSE audits and site risk reviews', isActive: true, isSystem: true },
  { id: 'sub-cons-8', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Legal Consultant', code: 'CONS_LEGAL', description: 'Construction contract law, dispute resolution and FIDIC', isActive: true, isSystem: true },
  { id: 'sub-cons-9', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Financial Consultant', code: 'CONS_FIN', description: 'Project finance, escrow, and tax structuring', isActive: true, isSystem: true },
  { id: 'sub-cons-10', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Technical Consultant', code: 'CONS_TECH', description: 'Façade testing, metallurgy and coating consultant', isActive: true, isSystem: true },
  { id: 'sub-cons-11', parentTypeId: 'type-consultant', parentTypeName: 'Consultant', name: 'Other Consultant', code: 'CONS_OTHER', description: 'Independent specialist consultancy', isActive: true, isSystem: true },

  // STRATEGIC PARTNER SUBTYPES
  { id: 'sub-sp-1', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Referral Partner', code: 'SP_REF', description: 'Lead generation and client referrals', isActive: true, isSystem: true },
  { id: 'sub-sp-2', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Architect Partner', code: 'SP_ARCH', description: 'Collaborative architectural alliance', isActive: true, isSystem: true },
  { id: 'sub-sp-3', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Engineer Partner', code: 'SP_ENG', description: 'Engineering consortium partner', isActive: true, isSystem: true },
  { id: 'sub-sp-4', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'QS Partner', code: 'SP_QS', description: 'Commercial advisory partner', isActive: true, isSystem: true },
  { id: 'sub-sp-5', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Construction Partner', code: 'SP_CONST', description: 'Joint-venture general contractor', isActive: true, isSystem: true },
  { id: 'sub-sp-6', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Design Partner', code: 'SP_DES', description: 'Bespoke design studio partnership', isActive: true, isSystem: true },
  { id: 'sub-sp-7', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Procurement Partner', code: 'SP_PROC', description: 'Global sourcing and bulk procurement partner', isActive: true, isSystem: true },
  { id: 'sub-sp-8', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Technology Partner', code: 'SP_TECH', description: 'Software, automation, and hardware tech partner', isActive: true, isSystem: true },
  { id: 'sub-sp-9', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Supplier Partner', code: 'SP_SUPP', description: 'Tier-1 preferred material supply partner', isActive: true, isSystem: true },
  { id: 'sub-sp-10', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Investment Partner', code: 'SP_INVEST', description: 'Equity or mezzanine project financing partner', isActive: true, isSystem: true },
  { id: 'sub-sp-11', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Business Development Partner', code: 'SP_BIZDEV', description: 'Market expansion and commercial growth', isActive: true, isSystem: true },
  { id: 'sub-sp-12', parentTypeId: 'type-partner', parentTypeName: 'Strategic Partner', name: 'Other Partner', code: 'SP_OTHER', description: 'Custom strategic affiliation', isActive: true, isSystem: true },

  // SUPPLIER SUBTYPES
  { id: 'sub-supp-1', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Aluminium Supplier', code: 'SUPP_ALU', description: 'Extrusion profiles, billets, and standard sections', isActive: true, isSystem: true },
  { id: 'sub-supp-2', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Glass Supplier', code: 'SUPP_GLASS', description: 'Tempered, laminated, DGU, and low-e glass sheets', isActive: true, isSystem: true },
  { id: 'sub-supp-3', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Steel Supplier', code: 'SUPP_STEEL', description: 'Mild steel, stainless steel, tubes, and hardware', isActive: true, isSystem: true },
  { id: 'sub-supp-4', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Hardware Supplier', code: 'SUPP_HARD', description: 'Locks, hinges, handles, friction stays, anchors', isActive: true, isSystem: true },
  { id: 'sub-supp-5', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Paint Supplier', code: 'SUPP_PAINT', description: 'Powder coating powders, PVDF, and industrial primers', isActive: true, isSystem: true },
  { id: 'sub-supp-6', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Electrical Supplier', code: 'SUPP_ELEC', description: 'Conduits, lighting, cables, and switchgear', isActive: true, isSystem: true },
  { id: 'sub-supp-7', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Plumbing Supplier', code: 'SUPP_PLUMB', description: 'Pipes, fittings, valves, and sanitary fixtures', isActive: true, isSystem: true },
  { id: 'sub-supp-8', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Cement / Concrete Supplier', code: 'SUPP_CONC', description: 'Ready-mix concrete, aggregates, and mortar', isActive: true, isSystem: true },
  { id: 'sub-supp-9', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Timber Supplier', code: 'SUPP_TIMB', description: 'Hardwood, plywood, veneer, and composite boards', isActive: true, isSystem: true },
  { id: 'sub-supp-10', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Furniture Supplier', code: 'SUPP_FURN', description: 'Loose commercial and office furniture', isActive: true, isSystem: true },
  { id: 'sub-supp-11', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Machinery Supplier', code: 'SUPP_MACH', description: 'CNC routers, double-mitre saws, and welders', isActive: true, isSystem: true },
  { id: 'sub-supp-12', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Tool Supplier', code: 'SUPP_TOOL', description: 'Hand tools, cordless drills, and consumables', isActive: true, isSystem: true },
  { id: 'sub-supp-13', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Safety Equipment Supplier', code: 'SUPP_SAFE', description: 'PPE, harnesses, helmets, and scaffolding', isActive: true, isSystem: true },
  { id: 'sub-supp-14', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Transport Supplier', code: 'SUPP_TRANS', description: 'Logistics, delivery, and trailer services', isActive: true, isSystem: true },
  { id: 'sub-supp-15', parentTypeId: 'type-supplier', parentTypeName: 'Supplier', name: 'Other Supplier', code: 'SUPP_OTHER', description: 'General specialized construction supply', isActive: true, isSystem: true },

  // CONTRACTOR SUBTYPES
  { id: 'sub-cont-1', parentTypeId: 'type-contractor', parentTypeName: 'Contractor', name: 'Main Contractor', code: 'CONT_MAIN', description: 'Head contractor with site-wide jurisdiction', isActive: true, isSystem: true },
  { id: 'sub-cont-2', parentTypeId: 'type-contractor', parentTypeName: 'Contractor', name: 'General Contractor', code: 'CONT_GEN', description: 'Civil and structural general contractor', isActive: true, isSystem: true },
  { id: 'sub-cont-3', parentTypeId: 'type-contractor', parentTypeName: 'Contractor', name: 'Specialist Contractor', code: 'CONT_SPEC', description: 'Façade and structural glazing contractor', isActive: true, isSystem: true },
  { id: 'sub-cont-4', parentTypeId: 'type-contractor', parentTypeName: 'Contractor', name: 'Installation Contractor', code: 'CONT_INST', description: 'On-site installation and fitting crew lead', isActive: true, isSystem: true },
  { id: 'sub-cont-5', parentTypeId: 'type-contractor', parentTypeName: 'Contractor', name: 'Construction Contractor', code: 'CONT_CONST', description: 'Building shell and envelope contractor', isActive: true, isSystem: true },
  { id: 'sub-cont-6', parentTypeId: 'type-contractor', parentTypeName: 'Contractor', name: 'Other Contractor', code: 'CONT_OTHER', description: 'General contracting entity', isActive: true, isSystem: true },

  // SUBCONTRACTOR SUBTYPES
  { id: 'sub-subcont-1', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Aluminium', code: 'SUBC_ALU', description: 'Aluminium fabrication and window framing installation', isActive: true, isSystem: true },
  { id: 'sub-subcont-2', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Glass', code: 'SUBC_GLASS', description: 'Glazing, spider fittings, and glass balustrades', isActive: true, isSystem: true },
  { id: 'sub-subcont-3', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Steel', code: 'SUBC_STEEL', description: 'Structural steel erection and miscellaneous metals', isActive: true, isSystem: true },
  { id: 'sub-subcont-4', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Electrical', code: 'SUBC_ELEC', description: 'Wiring, fixtures, and low-voltage systems', isActive: true, isSystem: true },
  { id: 'sub-subcont-5', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Plumbing', code: 'SUBC_PLUMB', description: 'Sanitary plumbing, rainwater downpipes, and drainage', isActive: true, isSystem: true },
  { id: 'sub-subcont-6', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'HVAC', code: 'SUBC_HVAC', description: 'Ductwork, VRF units, and diffusers', isActive: true, isSystem: true },
  { id: 'sub-subcont-7', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Painting', code: 'SUBC_PAINT', description: 'Internal/external coatings and specialty finishes', isActive: true, isSystem: true },
  { id: 'sub-subcont-8', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Ceiling', code: 'SUBC_CEIL', description: 'Suspended grid, gypsum, and acoustic ceilings', isActive: true, isSystem: true },
  { id: 'sub-subcont-9', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Partition', code: 'SUBC_PART', description: 'Drywall, acoustic partition, and demountable screens', isActive: true, isSystem: true },
  { id: 'sub-subcont-10', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Flooring', code: 'SUBC_FLOOR', description: 'Tiling, raised access floors, and epoxy coatings', isActive: true, isSystem: true },
  { id: 'sub-subcont-11', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Roofing', code: 'SUBC_ROOF', description: 'Metal decking, standing seam, and skylights', isActive: true, isSystem: true },
  { id: 'sub-subcont-12', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Waterproofing', code: 'SUBC_WATER', description: 'Membranes, sealants, and façade silicone jointing', isActive: true, isSystem: true },
  { id: 'sub-subcont-13', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Masonry', code: 'SUBC_MASON', description: 'Brickwork, blockwork, and rendering', isActive: true, isSystem: true },
  { id: 'sub-subcont-14', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Carpentry', code: 'SUBC_CARP', description: 'Doors, paneling, and bespoke millwork', isActive: true, isSystem: true },
  { id: 'sub-subcont-15', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Landscaping', code: 'SUBC_LAND', description: 'Hardscaping, planters, and external drainage', isActive: true, isSystem: true },
  { id: 'sub-subcont-16', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Fabrication', code: 'SUBC_FAB', description: 'Off-site workshop metal fabrication subcontracting', isActive: true, isSystem: true },
  { id: 'sub-subcont-17', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Installation', code: 'SUBC_INST', description: 'Skilled glass and frame installation gangs', isActive: true, isSystem: true },
  { id: 'sub-subcont-18', parentTypeId: 'type-subcontractor', parentTypeName: 'Subcontractor', name: 'Other Subcontractor', code: 'SUBC_OTHER', description: 'Specialist trade subcontractor', isActive: true, isSystem: true },

  // B2B CLIENT SUBTYPES
  { id: 'sub-b2b-1', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Factory', code: 'CLI_FACT', description: 'Manufacturing and industrial production facilities', isActive: true, isSystem: true },
  { id: 'sub-b2b-2', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Apparel Company', code: 'CLI_APP', description: 'Garment manufacturing plants and fashion retail', isActive: true, isSystem: true },
  { id: 'sub-b2b-3', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Hotel', code: 'CLI_HOTEL', description: 'Hospitality, resorts, and boutique accommodation', isActive: true, isSystem: true },
  { id: 'sub-b2b-4', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Restaurant', code: 'CLI_REST', description: 'Food & beverage establishments and dining spaces', isActive: true, isSystem: true },
  { id: 'sub-b2b-5', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Office', code: 'CLI_OFF', description: 'Corporate commercial office interiors and headquarters', isActive: true, isSystem: true },
  { id: 'sub-b2b-6', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Retail', code: 'CLI_RET', description: 'Shopping centers, showrooms, and retail stores', isActive: true, isSystem: true },
  { id: 'sub-b2b-7', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Developer', code: 'CLI_DEV_CLI', description: 'Property developer client commissioning projects', isActive: true, isSystem: true },
  { id: 'sub-b2b-8', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Construction Company', code: 'CLI_CONST', description: 'General building contractor outsourcing fabrication', isActive: true, isSystem: true },
  { id: 'sub-b2b-9', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'School', code: 'CLI_SCH', description: 'Educational campuses and vocational institutes', isActive: true, isSystem: true },
  { id: 'sub-b2b-10', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Hospital', code: 'CLI_HOSP', description: 'Healthcare, clinics, and sterile partition units', isActive: true, isSystem: true },
  { id: 'sub-b2b-11', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Government Organization', code: 'CLI_GOV', description: 'Municipal and state government ministries', isActive: true, isSystem: true },
  { id: 'sub-b2b-12', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'NGO', code: 'CLI_NGO', description: 'Non-governmental development foundations', isActive: true, isSystem: true },
  { id: 'sub-b2b-13', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Industrial Company', code: 'CLI_IND', description: 'Warehousing, logistics parks, and heavy plants', isActive: true, isSystem: true },
  { id: 'sub-b2b-14', parentTypeId: 'type-b2b-client', parentTypeName: 'B2B Client', name: 'Other B2B Client', code: 'CLI_OTHER_B2B', description: 'General commercial client organization', isActive: true, isSystem: true },

  // RESIDENT CLIENT SUBTYPES
  { id: 'sub-res-1', parentTypeId: 'type-resident-client', parentTypeName: 'Resident Client', name: 'Home Owner', code: 'CLI_HOME', description: 'Private villa or residence owner', isActive: true, isSystem: true },
  { id: 'sub-res-2', parentTypeId: 'type-resident-client', parentTypeName: 'Resident Client', name: 'Apartment Owner', code: 'CLI_APT', description: 'Condominium or luxury apartment owner', isActive: true, isSystem: true },
  { id: 'sub-res-3', parentTypeId: 'type-resident-client', parentTypeName: 'Resident Client', name: 'Landlord', code: 'CLI_LL', description: 'Rental property investor', isActive: true, isSystem: true },
  { id: 'sub-res-4', parentTypeId: 'type-resident-client', parentTypeName: 'Resident Client', name: 'Property Manager', code: 'CLI_PROP_MGR_RES', description: 'Residential estate or strata manager', isActive: true, isSystem: true },
  { id: 'sub-res-5', parentTypeId: 'type-resident-client', parentTypeName: 'Resident Client', name: 'Other Resident', code: 'CLI_OTHER_RES', description: 'Private residential client', isActive: true, isSystem: true }
];

// ============================================================================
// SEED SKILLS
// ============================================================================

export const INITIAL_SKILLS: SkillItem[] = [
  // Fabrication
  { id: 'sk-1', name: 'Aluminium Fabrication', category: 'Fabrication', description: 'Curtain wall, casement, and sliding window frame fabrication' },
  { id: 'sk-2', name: 'MIG Welding', category: 'Fabrication', description: 'Metal Inert Gas welding on structural and architectural frames' },
  { id: 'sk-3', name: 'TIG Welding', category: 'Fabrication', description: 'Tungsten Inert Gas welding for precision stainless and aluminium joints' },
  { id: 'sk-4', name: 'CNC Operations', category: 'Fabrication', description: 'CNC 4-axis profile machining center operation and G-code setup' },
  { id: 'sk-5', name: 'Glass Installation', category: 'Fabrication', description: 'Heavy structural glazed units, spider glass, and tempered glass fitting' },
  { id: 'sk-6', name: 'Powder Coating Inspection', category: 'Fabrication', description: 'Dry film thickness (DFT), cross-hatch adhesion, and gloss measurement' },

  // Engineering
  { id: 'sk-7', name: 'Structural Design', category: 'Engineering', description: 'Finite element wind load, dead load, and thermal movement calculations' },
  { id: 'sk-8', name: 'Steel Structures', category: 'Engineering', description: 'Hot-rolled and cold-formed structural steel frame design' },
  { id: 'sk-9', name: 'Aluminium Structures', category: 'Engineering', description: 'Extrusion moment of inertia, deflection, and stress verification' },
  { id: 'sk-10', name: 'AutoCAD', category: 'Engineering', description: '2D precision architectural shop drawings and detail drafting' },
  { id: 'sk-11', name: 'Revit / BIM', category: 'Engineering', description: 'Building Information Modeling (BIM) LOD 300-400 modeling' },
  { id: 'sk-12', name: 'MEP Coordination', category: 'Engineering', description: 'Clash detection between façade brackets, ducts, and cable trays' },

  // Commercial / QS
  { id: 'sk-13', name: 'BOQ Preparation', category: 'Commercial', description: 'Bill of Quantities preparation under CESMM4 / SMM7 standards' },
  { id: 'sk-14', name: 'Cost Estimation', category: 'Commercial', description: 'Unit rate benchmarking, scrap factor analysis, and margin simulation' },
  { id: 'sk-15', name: 'Contract Administration', category: 'Commercial', description: 'FIDIC, variation claim substantiation, and interim payment valuations' },

  // Design
  { id: 'sk-16', name: '3D Max & V-Ray', category: 'Design', description: 'Photorealistic architectural visualization and walkthrough animation' },
  { id: 'sk-17', name: 'Interior Spatial Planning', category: 'Design', description: 'Acoustic partitioning, ergonomic workstations, and circulation layouts' },
  { id: 'sk-18', name: 'Lighting Simulation', category: 'Design', description: 'Dialux lux level calculation and architectural accent lighting design' },

  // Safety
  { id: 'sk-19', name: 'Working at Heights & Scaffold Inspection', category: 'Safety', description: 'Cradle safety, harness anchor points, and mast climbing work platform safety' },
  { id: 'sk-20', name: 'HSE Risk Assessment', category: 'Safety', description: 'Job Safety Analysis (JSA) and site method statements for hazardous lifts' }
];

// ============================================================================
// SEED ORGANIZATIONS
// ============================================================================

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-innovista',
    name: 'Innovista Metal Engineering (Pvt) Ltd',
    legalName: 'Innovista Metal Engineering (Private) Limited',
    registrationNumber: 'PV-84920',
    category: 'INTERNAL',
    organizationType: 'Headquarters & Fabrication Works',
    email: 'info@innovistametal.com',
    phone: '+94 11 234 5678',
    address: 'No. 45 Industrial Zone, Biyagama, Kelaniya',
    city: 'Kelaniya',
    country: 'Sri Lanka',
    website: 'https://innovistametal.com',
    taxId: 'TIN-984019284',
    status: 'Active',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'org-abc-eng',
    name: 'ABC Engineering & Consultants (Pvt) Ltd',
    legalName: 'ABC Engineering Consultants Private Limited',
    registrationNumber: 'PV-11928',
    category: 'PROFESSIONAL',
    organizationType: 'Structural & Façade Consultancy',
    email: 'contact@abcengineering.lk',
    phone: '+94 11 498 7654',
    address: 'Level 14, World Trade Centre, Echelon Square',
    city: 'Colombo 01',
    country: 'Sri Lanka',
    website: 'https://abcengineering.lk',
    isPartner: true,
    status: 'Active',
    createdAt: '2026-01-12T09:30:00Z',
    updatedAt: '2026-01-12T09:30:00Z'
  },
  {
    id: 'org-arch-studio',
    name: 'Design Consortium International',
    legalName: 'Design Consortium Architects & Planners',
    registrationNumber: 'PV-65432',
    category: 'PROFESSIONAL',
    organizationType: 'Architectural Practice',
    email: 'projects@designconsortium.org',
    phone: '+94 11 765 4321',
    address: '88 Ward Place, Cinnamon Gardens',
    city: 'Colombo 07',
    country: 'Sri Lanka',
    website: 'https://designconsortium.org',
    isPartner: true,
    status: 'Active',
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-01-15T11:00:00Z'
  },
  {
    id: 'org-alumi-supplies',
    name: 'Alumex Extrusions PLC',
    legalName: 'Alumex PLC',
    registrationNumber: 'PQ-239',
    category: 'COMMERCIAL',
    organizationType: 'Aluminium Supplier',
    email: 'sales@alumexgroup.com',
    phone: '+94 11 240 8000',
    address: 'Pattiwila Road, Sapugaskanda, Makola',
    city: 'Sapugaskanda',
    country: 'Sri Lanka',
    website: 'https://alumexgroup.com',
    status: 'Active',
    createdAt: '2026-01-15T12:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z'
  },
  {
    id: 'org-metro-client',
    name: 'Metropolitan Real Estate Developers',
    legalName: 'Metropolitan Real Estate Development Holdings Ltd',
    registrationNumber: 'PV-99120',
    category: 'CLIENT',
    organizationType: 'Developer',
    email: 'procurement@metropolitanre.com',
    phone: '+94 11 555 9999',
    address: 'Level 22, One Galle Face Tower',
    city: 'Colombo 02',
    country: 'Sri Lanka',
    website: 'https://metropolitanre.com',
    status: 'Active',
    createdAt: '2026-01-20T14:00:00Z',
    updatedAt: '2026-01-20T14:00:00Z'
  }
];

// ============================================================================
// SEED PERSONS
// ============================================================================

export const INITIAL_PERSONS: Person[] = [
  {
    id: 'per-john-perera',
    fullName: 'John Perera',
    email: 'john.perera@abcengineering.lk',
    mobile: '+94 77 123 4567',
    title: 'Lead Structural Consultant',
    qualification: 'B.Sc. Eng (Hons) Civil, M.Sc. Structural',
    experience: '16+ Years in Façade & High-Rise Steel Engineering',
    registrationNumber: 'IESL C-4912',
    certifications: ['Chartered Structural Engineer', 'IESL Member', 'Façade Specialist Cert'],
    skills: ['Structural Design', 'Steel Structures', 'Aluminium Structures', 'AutoCAD', 'Revit / BIM'],
    organizationId: 'org-abc-eng',
    organizationName: 'ABC Engineering & Consultants (Pvt) Ltd',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z'
  },
  {
    id: 'per-kavinda-qs',
    fullName: 'Kavinda Jayasinghe',
    email: 'kavinda.qs@abcengineering.lk',
    mobile: '+94 71 987 6543',
    title: 'Senior Consultant QS',
    qualification: 'B.Sc. (Hons) Quantity Surveying, MRICS',
    experience: '12 Years Commercial Estimating and Contract Administration',
    registrationNumber: 'IQSSL / MRICS-8849',
    certifications: ['MRICS Chartered Quantity Surveyor', 'FIDIC Contract Administrator'],
    skills: ['BOQ Preparation', 'Cost Estimation', 'Contract Administration'],
    organizationId: 'org-abc-eng',
    organizationName: 'ABC Engineering & Consultants (Pvt) Ltd',
    createdAt: '2026-01-14T09:00:00Z',
    updatedAt: '2026-01-14T09:00:00Z'
  },
  {
    id: 'per-ananya-arch',
    fullName: 'Archt. Ananya Senanayake',
    email: 'ananya.s@designconsortium.org',
    mobile: '+94 76 543 2109',
    title: 'Principal Design Architect',
    qualification: 'B.Arch (Hons), M.Arch Architectural Design, AIA Intl Assoc.',
    experience: '14 Years Commercial Architecture & Interior Design',
    registrationNumber: 'SLIA Reg A-1029',
    certifications: ['Chartered Architect (SLIA)', 'AIA International', 'LEED AP BD+C'],
    skills: ['AutoCAD', '3D Max & V-Ray', 'Interior Spatial Planning', 'Lighting Simulation'],
    organizationId: 'org-arch-studio',
    organizationName: 'Design Consortium International',
    createdAt: '2026-01-16T11:30:00Z',
    updatedAt: '2026-01-16T11:30:00Z'
  },
  {
    id: 'per-kasun-fab',
    fullName: 'Kasun Bandara',
    email: 'kasun.fab@innovistametal.com',
    mobile: '+94 72 345 6789',
    title: 'Master Aluminium Fabricator & Welder',
    qualification: 'NVQ Level 5 Metal Fabrication & Precision CNC Cutting',
    experience: '9 Years Workshop Fabrication & Quality Execution',
    certifications: ['AWS Certified Welder (MIG/TIG)', 'CNC Master Operator Cert'],
    skills: ['Aluminium Fabrication', 'MIG Welding', 'TIG Welding', 'CNC Operations', 'Glass Installation'],
    organizationId: 'org-innovista',
    organizationName: 'Innovista Metal Engineering (Pvt) Ltd',
    createdAt: '2026-01-10T08:30:00Z',
    updatedAt: '2026-01-10T08:30:00Z'
  },
  {
    id: 'per-malik-client',
    fullName: 'Malik Fernando',
    email: 'malik@metropolitanre.com',
    mobile: '+94 77 888 1234',
    title: 'Director - Project Development',
    qualification: 'B.Sc. Construction Management, MBA',
    experience: '20 Years Real Estate & High-Rise Commercial Developments',
    certifications: ['PMP', 'Chartered Builder CIOB'],
    skills: ['Contract Administration', 'Interior Spatial Planning'],
    organizationId: 'org-metro-client',
    organizationName: 'Metropolitan Real Estate Developers',
    createdAt: '2026-01-20T14:30:00Z',
    updatedAt: '2026-01-20T14:30:00Z'
  }
];

// ============================================================================
// SEED COLLABORATOR ACCOUNTS
// ============================================================================

export const INITIAL_COLLABORATOR_ACCOUNTS: CollaboratorAccount[] = [
  {
    id: 'acc-john-eng',
    personId: 'per-john-perera',
    personName: 'John Perera',
    email: 'john.perera@abcengineering.lk',
    mobile: '+94 77 123 4567',
    organizationId: 'org-abc-eng',
    organizationName: 'ABC Engineering & Consultants (Pvt) Ltd',
    accountCategory: 'PROFESSIONAL',
    accountTypeId: 'type-engineer',
    accountTypeName: 'Engineer',
    subtypeId: 'sub-eng-2',
    subtypeName: 'Structural Engineer',
    relationshipType: 'Strategic Partner',
    assignedProjectIds: ['PRJ-2026-1001', 'PRJ-2026-1002'],
    assignedProjectNames: ['ABC Commercial Factory Fitting', 'Metropolitan Luxury Tower Façade'],
    skills: ['Structural Design', 'Steel Structures', 'Aluminium Structures', 'AutoCAD', 'Revit / BIM'],
    informationPermissions: getPresetPermissions('engineer'),
    status: 'Active',
    createdAt: '2026-01-12T10:15:00Z',
    updatedAt: '2026-01-12T10:15:00Z'
  },
  {
    id: 'acc-kavinda-qs',
    personId: 'per-kavinda-qs',
    personName: 'Kavinda Jayasinghe',
    email: 'kavinda.qs@abcengineering.lk',
    mobile: '+94 71 987 6543',
    organizationId: 'org-abc-eng',
    organizationName: 'ABC Engineering & Consultants (Pvt) Ltd',
    accountCategory: 'PROFESSIONAL',
    accountTypeId: 'type-qs',
    accountTypeName: 'Quantity Surveyor (QS)',
    subtypeId: 'sub-qs-2',
    subtypeName: 'Consultant QS',
    relationshipType: 'Consultant QS',
    assignedProjectIds: ['PRJ-2026-1001'],
    assignedProjectNames: ['ABC Commercial Factory Fitting'],
    skills: ['BOQ Preparation', 'Cost Estimation', 'Contract Administration'],
    informationPermissions: getPresetPermissions('qs'),
    status: 'Active',
    createdAt: '2026-01-14T09:15:00Z',
    updatedAt: '2026-01-14T09:15:00Z'
  },
  {
    id: 'acc-ananya-arch',
    personId: 'per-ananya-arch',
    personName: 'Archt. Ananya Senanayake',
    email: 'ananya.s@designconsortium.org',
    mobile: '+94 76 543 2109',
    organizationId: 'org-arch-studio',
    organizationName: 'Design Consortium International',
    accountCategory: 'PROFESSIONAL',
    accountTypeId: 'type-architect',
    accountTypeName: 'Architect',
    subtypeId: 'sub-arch-1',
    subtypeName: 'Principal Architect',
    relationshipType: 'Architect Partner',
    assignedProjectIds: ['PRJ-2026-1001', 'PRJ-2026-1002'],
    assignedProjectNames: ['ABC Commercial Factory Fitting', 'Metropolitan Luxury Tower Façade'],
    skills: ['AutoCAD', '3D Max & V-Ray', 'Interior Spatial Planning', 'Lighting Simulation'],
    informationPermissions: getPresetPermissions('architect'),
    status: 'Active',
    createdAt: '2026-01-16T11:45:00Z',
    updatedAt: '2026-01-16T11:45:00Z'
  },
  {
    id: 'acc-kasun-fab',
    personId: 'per-kasun-fab',
    personName: 'Kasun Bandara',
    email: 'kasun.fab@innovistametal.com',
    mobile: '+94 72 345 6789',
    organizationId: 'org-innovista',
    organizationName: 'Innovista Metal Engineering (Pvt) Ltd',
    accountCategory: 'INTERNAL',
    accountTypeId: 'type-fabricator',
    accountTypeName: 'Fabricator',
    relationshipType: 'Workshop Team Member',
    assignedProjectIds: ['PRJ-2026-1001'],
    assignedProjectNames: ['ABC Commercial Factory Fitting'],
    skills: ['Aluminium Fabrication', 'MIG Welding', 'TIG Welding', 'CNC Operations', 'Glass Installation'],
    informationPermissions: getPresetPermissions('fabricator'),
    status: 'Active',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-10T09:00:00Z'
  },
  {
    id: 'acc-malik-client',
    personId: 'per-malik-client',
    personName: 'Malik Fernando',
    email: 'malik@metropolitanre.com',
    mobile: '+94 77 888 1234',
    organizationId: 'org-metro-client',
    organizationName: 'Metropolitan Real Estate Developers',
    accountCategory: 'CLIENT',
    accountTypeId: 'type-b2b-client',
    accountTypeName: 'B2B Client',
    subtypeId: 'sub-b2b-7',
    subtypeName: 'Developer',
    relationshipType: 'Client & Developer',
    assignedProjectIds: ['PRJ-2026-1001'],
    assignedProjectNames: ['ABC Commercial Factory Fitting'],
    skills: ['Contract Administration', 'Interior Spatial Planning'],
    informationPermissions: getPresetPermissions('client'),
    status: 'Active',
    createdAt: '2026-01-20T15:00:00Z',
    updatedAt: '2026-01-20T15:00:00Z'
  }
];

// ============================================================================
// COLLABORATION SERVICE CLASS (LocalStorage backed, fully reactive)
// ============================================================================

class CollaborationService {
  private readonly STORAGE_KEYS = {
    ACCOUNT_TYPES: 'innovista_account_types_v1',
    SUBTYPES: 'innovista_subtypes_v1',
    SKILLS: 'innovista_skills_v1',
    ORGANIZATIONS: 'innovista_organizations_v1',
    PERSONS: 'innovista_persons_v1',
    ACCOUNTS: 'innovista_collaborator_accounts_v1',
    PROJECT_TEAMS: 'innovista_project_teams_v1'
  };

  // State caches
  private accountTypes: AccountTypeDefinition[] = [];
  private subtypes: AccountSubtypeDefinition[] = [];
  private skills: SkillItem[] = [];
  private organizations: Organization[] = [];
  private persons: Person[] = [];
  private accounts: CollaboratorAccount[] = [];
  private projectTeamMembers: ProjectTeamMember[] = [];

  constructor() {
    this.init();
  }

  private init() {
    this.accountTypes = this.loadOrSeed(this.STORAGE_KEYS.ACCOUNT_TYPES, INITIAL_ACCOUNT_TYPES);
    this.subtypes = this.loadOrSeed(this.STORAGE_KEYS.SUBTYPES, INITIAL_SUBTYPES);
    this.skills = this.loadOrSeed(this.STORAGE_KEYS.SKILLS, INITIAL_SKILLS);
    this.organizations = this.loadOrSeed(this.STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGANIZATIONS);
    this.persons = this.loadOrSeed(this.STORAGE_KEYS.PERSONS, INITIAL_PERSONS);
    this.accounts = this.loadOrSeed(this.STORAGE_KEYS.ACCOUNTS, INITIAL_COLLABORATOR_ACCOUNTS);
    this.projectTeamMembers = this.loadOrSeed(this.STORAGE_KEYS.PROJECT_TEAMS, this.generateSeedProjectTeam());
  }

  private loadOrSeed<T>(key: string, seed: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Error reading ${key} from storage:`, e);
    }
    // Seed and persist
    try {
      localStorage.setItem(key, JSON.stringify(seed));
    } catch (e) {
      // storage unavailable or full
    }
    return seed;
  }

  private save<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  private generateSeedProjectTeam(): ProjectTeamMember[] {
    return [
      {
        id: 'pt-1',
        projectId: 'PRJ-2026-1001',
        projectName: 'ABC Commercial Factory Fitting',
        accountId: 'acc-john-eng',
        personId: 'per-john-perera',
        personName: 'John Perera',
        accountCategory: 'PROFESSIONAL',
        accountTypeName: 'Engineer',
        subtypeName: 'Structural Engineer',
        relationshipType: 'Strategic Partner',
        organizationName: 'ABC Engineering & Consultants (Pvt) Ltd',
        permissions: getPresetPermissions('engineer'),
        assignedAt: '2026-01-12T10:30:00Z',
        notes: 'Responsible for structural wind-load approvals and façade engineering.'
      },
      {
        id: 'pt-2',
        projectId: 'PRJ-2026-1001',
        projectName: 'ABC Commercial Factory Fitting',
        accountId: 'acc-kavinda-qs',
        personId: 'per-kavinda-qs',
        personName: 'Kavinda Jayasinghe',
        accountCategory: 'PROFESSIONAL',
        accountTypeName: 'Quantity Surveyor (QS)',
        subtypeName: 'Consultant QS',
        relationshipType: 'Consultant QS',
        organizationName: 'ABC Engineering & Consultants (Pvt) Ltd',
        permissions: getPresetPermissions('qs'),
        assignedAt: '2026-01-14T09:30:00Z',
        notes: 'BOQ measurement validation, variations verification, and monthly valuation claims.'
      },
      {
        id: 'pt-3',
        projectId: 'PRJ-2026-1001',
        projectName: 'ABC Commercial Factory Fitting',
        accountId: 'acc-ananya-arch',
        personId: 'per-ananya-arch',
        personName: 'Archt. Ananya Senanayake',
        accountCategory: 'PROFESSIONAL',
        accountTypeName: 'Architect',
        subtypeName: 'Principal Architect',
        relationshipType: 'Architect Partner',
        organizationName: 'Design Consortium International',
        permissions: getPresetPermissions('architect'),
        assignedAt: '2026-01-16T12:00:00Z',
        notes: 'Lead architectural aesthetic approval and finishes certification.'
      },
      {
        id: 'pt-4',
        projectId: 'PRJ-2026-1001',
        projectName: 'ABC Commercial Factory Fitting',
        accountId: 'acc-kasun-fab',
        personId: 'per-kasun-fab',
        personName: 'Kasun Bandara',
        accountCategory: 'INTERNAL',
        accountTypeName: 'Fabricator',
        relationshipType: 'Workshop Team Member',
        organizationName: 'Innovista Metal Engineering (Pvt) Ltd',
        permissions: getPresetPermissions('fabricator'),
        assignedAt: '2026-01-10T10:00:00Z',
        notes: 'Fabrication cutting list execution and workshop assembly.'
      },
      {
        id: 'pt-5',
        projectId: 'PRJ-2026-1001',
        projectName: 'ABC Commercial Factory Fitting',
        accountId: 'acc-malik-client',
        personId: 'per-malik-client',
        personName: 'Malik Fernando',
        accountCategory: 'CLIENT',
        accountTypeName: 'B2B Client',
        subtypeName: 'Developer',
        relationshipType: 'Client & Developer',
        organizationName: 'Metropolitan Real Estate Developers',
        permissions: getPresetPermissions('client'),
        assignedAt: '2026-01-20T15:30:00Z',
        notes: 'Client representative, progress overview and milestone sign-offs.'
      }
    ];
  }

  // ==========================================================================
  // ACCOUNT TYPES & SUBTYPES CRUD (Admin Dynamic Management)
  // ==========================================================================

  getAccountTypes(): AccountTypeDefinition[] {
    return [...this.accountTypes];
  }

  getAccountTypeById(id: string): AccountTypeDefinition | undefined {
    return this.accountTypes.find(t => t.id === id);
  }

  saveAccountType(typeDef: Partial<AccountTypeDefinition> & { name: string; category: AccountCategory }): AccountTypeDefinition {
    const existingIndex = this.accountTypes.findIndex(t => t.id === typeDef.id);
    if (existingIndex >= 0) {
      const updated: AccountTypeDefinition = {
        ...this.accountTypes[existingIndex],
        ...typeDef,
        updatedAt: new Date().toISOString()
      } as any;
      this.accountTypes[existingIndex] = updated;
      this.save(this.STORAGE_KEYS.ACCOUNT_TYPES, this.accountTypes);
      return updated;
    } else {
      const newType: AccountTypeDefinition = {
        id: typeDef.id || `type-custom-${Date.now()}`,
        category: typeDef.category,
        name: typeDef.name,
        code: typeDef.code || typeDef.name.toUpperCase().replace(/\s+/g, '_'),
        description: typeDef.description || `Custom ${typeDef.name} account type`,
        isActive: typeDef.isActive !== undefined ? typeDef.isActive : true,
        isSystem: false,
        defaultPermissions: typeDef.defaultPermissions || createEmptyPermissions()
      };
      this.accountTypes.push(newType);
      this.save(this.STORAGE_KEYS.ACCOUNT_TYPES, this.accountTypes);
      return newType;
    }
  }

  toggleAccountTypeStatus(id: string): AccountTypeDefinition | undefined {
    const item = this.accountTypes.find(t => t.id === id);
    if (item) {
      item.isActive = !item.isActive;
      this.save(this.STORAGE_KEYS.ACCOUNT_TYPES, this.accountTypes);
      return item;
    }
    return undefined;
  }

  deleteAccountType(id: string): boolean {
    const item = this.accountTypes.find(t => t.id === id);
    if (!item || item.isSystem) return false;
    this.accountTypes = this.accountTypes.filter(t => t.id !== id);
    this.save(this.STORAGE_KEYS.ACCOUNT_TYPES, this.accountTypes);
    // Also remove associated subtypes
    this.subtypes = this.subtypes.filter(s => s.parentTypeId !== id);
    this.save(this.STORAGE_KEYS.SUBTYPES, this.subtypes);
    return true;
  }

  // Subtypes
  getSubtypes(parentTypeId?: string): AccountSubtypeDefinition[] {
    if (parentTypeId) {
      return this.subtypes.filter(s => s.parentTypeId === parentTypeId);
    }
    return [...this.subtypes];
  }

  saveSubtype(subDef: Partial<AccountSubtypeDefinition> & { parentTypeId: string; name: string }): AccountSubtypeDefinition {
    const parent = this.getAccountTypeById(subDef.parentTypeId);
    const parentName = parent?.name || 'Unknown Type';

    const existingIndex = this.subtypes.findIndex(s => s.id === subDef.id);
    if (existingIndex >= 0) {
      const updated: AccountSubtypeDefinition = {
        ...this.subtypes[existingIndex],
        ...subDef,
        parentTypeName: parentName
      };
      this.subtypes[existingIndex] = updated;
      this.save(this.STORAGE_KEYS.SUBTYPES, this.subtypes);
      return updated;
    } else {
      const newSub: AccountSubtypeDefinition = {
        id: subDef.id || `sub-custom-${Date.now()}`,
        parentTypeId: subDef.parentTypeId,
        parentTypeName: parentName,
        name: subDef.name,
        code: subDef.code || subDef.name.toUpperCase().replace(/\s+/g, '_'),
        description: subDef.description || `Specialization for ${parentName}: ${subDef.name}`,
        isActive: subDef.isActive !== undefined ? subDef.isActive : true,
        isSystem: false,
        availableFields: subDef.availableFields || [],
        defaultPermissions: subDef.defaultPermissions
      };
      this.subtypes.push(newSub);
      this.save(this.STORAGE_KEYS.SUBTYPES, this.subtypes);
      return newSub;
    }
  }

  toggleSubtypeStatus(id: string): AccountSubtypeDefinition | undefined {
    const item = this.subtypes.find(s => s.id === id);
    if (item) {
      item.isActive = !item.isActive;
      this.save(this.STORAGE_KEYS.SUBTYPES, this.subtypes);
      return item;
    }
    return undefined;
  }

  deleteSubtype(id: string): boolean {
    const item = this.subtypes.find(s => s.id === id);
    if (!item || item.isSystem) return false;
    this.subtypes = this.subtypes.filter(s => s.id !== id);
    this.save(this.STORAGE_KEYS.SUBTYPES, this.subtypes);
    return true;
  }

  // ==========================================================================
  // SKILLS REGISTRY
  // ==========================================================================

  getSkills(): SkillItem[] {
    return [...this.skills];
  }

  saveSkill(skill: Partial<SkillItem> & { name: string; category: any }): SkillItem {
    const existingIndex = this.skills.findIndex(s => s.id === skill.id || s.name.toLowerCase() === skill.name.toLowerCase());
    if (existingIndex >= 0) {
      const updated = { ...this.skills[existingIndex], ...skill };
      this.skills[existingIndex] = updated;
      this.save(this.STORAGE_KEYS.SKILLS, this.skills);
      return updated;
    } else {
      const newSkill: SkillItem = {
        id: skill.id || `sk-${Date.now()}`,
        name: skill.name,
        category: skill.category,
        description: skill.description || ''
      };
      this.skills.push(newSkill);
      this.save(this.STORAGE_KEYS.SKILLS, this.skills);
      return newSkill;
    }
  }

  // ==========================================================================
  // ORGANIZATIONS
  // ==========================================================================

  getOrganizations(): Organization[] {
    return [...this.organizations];
  }

  getOrganizationById(id: string): Organization | undefined {
    return this.organizations.find(o => o.id === id);
  }

  saveOrganization(org: Partial<Organization> & { name: string; category: AccountCategory }): Organization {
    const existingIndex = this.organizations.findIndex(o => o.id === org.id);
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: Organization = {
        ...this.organizations[existingIndex],
        ...org,
        updatedAt: now
      };
      this.organizations[existingIndex] = updated;
      this.save(this.STORAGE_KEYS.ORGANIZATIONS, this.organizations);
      return updated;
    } else {
      const newOrg: Organization = {
        id: org.id || `org-${Date.now()}`,
        name: org.name,
        legalName: org.legalName || org.name,
        registrationNumber: org.registrationNumber || '',
        category: org.category,
        organizationType: org.organizationType || 'Company',
        email: org.email || '',
        phone: org.phone || '',
        address: org.address || '',
        city: org.city || 'Colombo',
        country: org.country || 'Sri Lanka',
        website: org.website || '',
        taxId: org.taxId || '',
        contactPersonName: org.contactPersonName || '',
        isPartner: org.isPartner || false,
        status: org.status || 'Active',
        createdAt: now,
        updatedAt: now
      };
      this.organizations.push(newOrg);
      this.save(this.STORAGE_KEYS.ORGANIZATIONS, this.organizations);
      return newOrg;
    }
  }

  deleteOrganization(id: string): boolean {
    this.organizations = this.organizations.filter(o => o.id !== id);
    this.save(this.STORAGE_KEYS.ORGANIZATIONS, this.organizations);
    return true;
  }

  // ==========================================================================
  // PERSONS
  // ==========================================================================

  getPersons(): Person[] {
    return [...this.persons];
  }

  getPersonById(id: string): Person | undefined {
    return this.persons.find(p => p.id === id);
  }

  savePerson(person: Partial<Person> & { fullName: string; email: string }): Person {
    const existingIndex = this.persons.findIndex(p => p.id === person.id);
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: Person = {
        ...this.persons[existingIndex],
        ...person,
        updatedAt: now
      };
      this.persons[existingIndex] = updated;
      this.save(this.STORAGE_KEYS.PERSONS, this.persons);
      return updated;
    } else {
      const newPerson: Person = {
        id: person.id || `per-${Date.now()}`,
        fullName: person.fullName,
        email: person.email,
        mobile: person.mobile || '',
        secondaryPhone: person.secondaryPhone || '',
        title: person.title || 'Professional',
        qualification: person.qualification || '',
        experience: person.experience || '',
        registrationNumber: person.registrationNumber || '',
        certifications: person.certifications || [],
        skills: person.skills || [],
        organizationId: person.organizationId,
        organizationName: person.organizationName,
        notes: person.notes || '',
        createdAt: now,
        updatedAt: now
      };
      this.persons.push(newPerson);
      this.save(this.STORAGE_KEYS.PERSONS, this.persons);
      return newPerson;
    }
  }

  deletePerson(id: string): boolean {
    this.persons = this.persons.filter(p => p.id !== id);
    this.save(this.STORAGE_KEYS.PERSONS, this.persons);
    return true;
  }

  // ==========================================================================
  // COLLABORATOR ACCOUNTS
  // ==========================================================================

  getCollaboratorAccounts(): CollaboratorAccount[] {
    return [...this.accounts];
  }

  getCollaboratorAccountById(id: string): CollaboratorAccount | undefined {
    return this.accounts.find(a => a.id === id);
  }

  saveCollaboratorAccount(acc: Partial<CollaboratorAccount> & {
    personName: string;
    email: string;
    accountCategory: AccountCategory;
    accountTypeId: string;
    accountTypeName: string;
  }): CollaboratorAccount {
    const existingIndex = this.accounts.findIndex(a => a.id === acc.id);
    const now = new Date().toISOString();

    // Default permissions if not provided
    const permissions = acc.informationPermissions || getPresetPermissions(acc.accountTypeName);

    if (existingIndex >= 0) {
      const updated: CollaboratorAccount = {
        ...this.accounts[existingIndex],
        ...acc,
        informationPermissions: permissions,
        updatedAt: now
      };
      this.accounts[existingIndex] = updated;
      this.save(this.STORAGE_KEYS.ACCOUNTS, this.accounts);
      return updated;
    } else {
      const newAcc: CollaboratorAccount = {
        id: acc.id || `acc-${Date.now()}`,
        personId: acc.personId || `per-${Date.now()}`,
        personName: acc.personName,
        email: acc.email,
        mobile: acc.mobile || '',
        organizationId: acc.organizationId,
        organizationName: acc.organizationName,
        accountCategory: acc.accountCategory,
        accountTypeId: acc.accountTypeId,
        accountTypeName: acc.accountTypeName,
        subtypeId: acc.subtypeId,
        subtypeName: acc.subtypeName,
        relationshipType: acc.relationshipType || 'Direct Participant',
        assignedProjectIds: acc.assignedProjectIds || [],
        assignedProjectNames: acc.assignedProjectNames || [],
        skills: acc.skills || [],
        informationPermissions: permissions,
        status: acc.status || 'Active',
        createdAt: now,
        updatedAt: now
      };
      this.accounts.push(newAcc);
      this.save(this.STORAGE_KEYS.ACCOUNTS, this.accounts);
      return newAcc;
    }
  }

  deleteCollaboratorAccount(id: string): boolean {
    this.accounts = this.accounts.filter(a => a.id !== id);
    this.save(this.STORAGE_KEYS.ACCOUNTS, this.accounts);
    this.projectTeamMembers = this.projectTeamMembers.filter(m => m.accountId !== id);
    this.save(this.STORAGE_KEYS.PROJECT_TEAMS, this.projectTeamMembers);
    return true;
  }

  // ==========================================================================
  // PROJECT PROFESSIONAL TEAM ASSIGNMENTS
  // ==========================================================================

  getProjectTeamMembers(projectId?: string): ProjectTeamMember[] {
    if (projectId) {
      return this.projectTeamMembers.filter(m => m.projectId === projectId);
    }
    return [...this.projectTeamMembers];
  }

  assignMemberToProject(member: Partial<ProjectTeamMember> & {
    projectId: string;
    projectName: string;
    accountId: string;
    personName: string;
    accountCategory: AccountCategory;
    accountTypeName: string;
    relationshipType: string;
  }): ProjectTeamMember {
    const existingIndex = this.projectTeamMembers.findIndex(
      m => m.projectId === member.projectId && m.accountId === member.accountId
    );

    const now = new Date().toISOString();
    const permissions = member.permissions || getPresetPermissions(member.accountTypeName);

    if (existingIndex >= 0) {
      const updated: ProjectTeamMember = {
        ...this.projectTeamMembers[existingIndex],
        ...member,
        permissions
      };
      this.projectTeamMembers[existingIndex] = updated;
      this.save(this.STORAGE_KEYS.PROJECT_TEAMS, this.projectTeamMembers);
      return updated;
    } else {
      const newMember: ProjectTeamMember = {
        id: member.id || `pt-${Date.now()}`,
        projectId: member.projectId,
        projectName: member.projectName,
        accountId: member.accountId,
        personId: member.personId || '',
        personName: member.personName,
        accountCategory: member.accountCategory,
        accountTypeName: member.accountTypeName,
        subtypeName: member.subtypeName,
        relationshipType: member.relationshipType,
        organizationName: member.organizationName,
        permissions,
        assignedAt: now,
        notes: member.notes || ''
      };
      this.projectTeamMembers.push(newMember);
      this.save(this.STORAGE_KEYS.PROJECT_TEAMS, this.projectTeamMembers);

      // Also ensure project ID is on account
      const acc = this.accounts.find(a => a.id === member.accountId);
      if (acc && !acc.assignedProjectIds.includes(member.projectId)) {
        acc.assignedProjectIds.push(member.projectId);
        if (!acc.assignedProjectNames) acc.assignedProjectNames = [];
        if (!acc.assignedProjectNames.includes(member.projectName)) {
          acc.assignedProjectNames.push(member.projectName);
        }
        this.save(this.STORAGE_KEYS.ACCOUNTS, this.accounts);
      }

      return newMember;
    }
  }

  removeMemberFromProject(id: string): boolean {
    this.projectTeamMembers = this.projectTeamMembers.filter(m => m.id !== id);
    this.save(this.STORAGE_KEYS.PROJECT_TEAMS, this.projectTeamMembers);
    return true;
  }

  updateProjectMemberPermissions(
    id: string,
    permissions: Record<InformationCategory, PermissionActionType[]>
  ): boolean {
    const member = this.projectTeamMembers.find(m => m.id === id);
    if (member) {
      member.permissions = permissions;
      this.save(this.STORAGE_KEYS.PROJECT_TEAMS, this.projectTeamMembers);
      return true;
    }
    return false;
  }
}

export const collaborationService = new CollaborationService();
