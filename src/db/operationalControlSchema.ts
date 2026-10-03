// ============================================================================
// INNOVISTA CENTRAL POSTGRESQL RELATIONAL SCHEMA DEFINITION
// Unified Operational Control Platform, Multi-Department Portals & Procurement Bridge
// ============================================================================

/**
 * PostgreSQL Table Definitions Specification:
 * Designed for Drizzle ORM / pg node-postgres.
 * Frontend components NEVER write directly to this schema;
 * all queries and mutations are routed through the Central REST API Gateway & Business Logic Services.
 */

export interface PostgresTableColumnDefinition {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  references?: string;
  defaultVal?: string;
  description: string;
}

export interface PostgresTableDefinition {
  tableName: string;
  departmentScope: 'GLOBAL' | 'OPERATIONS' | 'QUALITY' | 'PRODUCT_RESOURCE' | 'COMMERCIAL_ADMIN' | 'PROCUREMENT_BRIDGE';
  description: string;
  columns: PostgresTableColumnDefinition[];
}

export const POSTGRES_OPERATIONAL_SCHEMA: Record<string, PostgresTableDefinition> = {
  // 1. Central Identity & Authorization
  users: {
    tableName: 'users',
    departmentScope: 'GLOBAL',
    description: 'Central authenticated user identities, credentials, department and position scopes',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Unique user UUID' },
      { name: 'employee_id', type: 'VARCHAR(32)', description: 'Corporate badge / employee ID' },
      { name: 'full_name', type: 'VARCHAR(255)', description: 'Legal employee name' },
      { name: 'username', type: 'VARCHAR(64)', description: 'Login username' },
      { name: 'email', type: 'VARCHAR(255)', description: 'Corporate email' },
      { name: 'department_code', type: 'VARCHAR(64)', references: 'departments.code', description: 'Primary department' },
      { name: 'position_title', type: 'VARCHAR(128)', description: 'Official designation' },
      { name: 'role_id', type: 'VARCHAR(64)', references: 'roles.id', description: 'Assigned RBAC role' },
      { name: 'branch', type: 'VARCHAR(64)', description: 'Primary assigned facility / branch' },
      { name: 'assigned_project_ids', type: 'JSONB', description: 'Array of project IDs for project scope control' },
      { name: 'account_status', type: 'VARCHAR(32)', defaultVal: "'Active'", description: 'Active, Suspended, Locked' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultVal: 'NOW()', description: 'Creation timestamp' }
    ]
  },

  roles: {
    tableName: 'roles',
    departmentScope: 'GLOBAL',
    description: 'RBAC Roles with scoped permissions and department alignment',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Role ID' },
      { name: 'code', type: 'VARCHAR(64)', description: 'Role identifier code' },
      { name: 'name', type: 'VARCHAR(128)', description: 'Display name' },
      { name: 'department_code', type: 'VARCHAR(64)', description: 'Restricted department or NULL for global' },
      { name: 'permission_codes', type: 'JSONB', description: 'Array of granular permission strings' },
      { name: 'is_system', type: 'BOOLEAN', defaultVal: 'false', description: 'Protected system role' }
    ]
  },

  // 2. Central Projects & Project Control Center
  projects: {
    tableName: 'projects',
    departmentScope: 'OPERATIONS',
    description: 'Central project control entity connecting contract, scope, budget, schedule, and quality',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Project UUID' },
      { name: 'project_code', type: 'VARCHAR(64)', description: 'Unique project code e.g. PRJ-2026-001' },
      { name: 'client_id', type: 'VARCHAR(64)', references: 'clients.id', description: 'Client reference' },
      { name: 'name', type: 'VARCHAR(255)', description: 'Project title' },
      { name: 'status', type: 'VARCHAR(64)', defaultVal: "'Fabrication'", description: 'Lifecycle status' },
      { name: 'health', type: 'VARCHAR(32)', defaultVal: "'Healthy'", description: 'Healthy, Caution, Critical' },
      { name: 'contract_value', type: 'NUMERIC(15, 2)', description: 'Total contracted revenue' },
      { name: 'budget_amount', type: 'NUMERIC(15, 2)', description: 'Approved internal budget' },
      { name: 'actual_cost', type: 'NUMERIC(15, 2)', defaultVal: '0.00', description: 'Actual recorded cost' },
      { name: 'progress_percent', type: 'INTEGER', defaultVal: '0', description: 'Weighted physical completion' },
      { name: 'start_date', type: 'DATE', description: 'Project start date' },
      { name: 'target_completion_date', type: 'DATE', description: 'Committed handover date' },
      { name: 'location_scope', type: 'VARCHAR(64)', description: 'Assigned yard / workshop branch' }
    ]
  },

  work_packages: {
    tableName: 'work_packages',
    departmentScope: 'OPERATIONS',
    description: 'WBS Work Packages dividing project scope into manageable shop-floor batches',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Work package UUID' },
      { name: 'project_id', type: 'VARCHAR(64)', references: 'projects.id', description: 'Parent project' },
      { name: 'code', type: 'VARCHAR(64)', description: 'WP Code e.g. WP-01-FAB' },
      { name: 'name', type: 'VARCHAR(255)', description: 'Work package title' },
      { name: 'status', type: 'VARCHAR(32)', description: 'Draft, In Progress, Completed' },
      { name: 'progress', type: 'INTEGER', defaultVal: '0', description: 'Percent complete' },
      { name: 'lead_engineer_id', type: 'VARCHAR(64)', references: 'users.id', description: 'Responsible lead' }
    ]
  },

  operational_tasks: {
    tableName: 'operational_tasks',
    departmentScope: 'OPERATIONS',
    description: 'Granular workshop and fabrication operations dispatched to machines and operators',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Task UUID' },
      { name: 'work_package_id', type: 'VARCHAR(64)', references: 'work_packages.id', description: 'Parent work package' },
      { name: 'project_id', type: 'VARCHAR(64)', references: 'projects.id', description: 'Project reference' },
      { name: 'task_number', type: 'VARCHAR(64)', description: 'Job card # e.g. TSK-082' },
      { name: 'title', type: 'VARCHAR(255)', description: 'Operation description' },
      { name: 'work_center_id', type: 'VARCHAR(64)', references: 'work_centers.id', description: 'Assigned station' },
      { name: 'assigned_operator_id', type: 'VARCHAR(64)', references: 'users.id', description: 'Shop floor operator' },
      { name: 'priority', type: 'VARCHAR(32)', defaultVal: "'Medium'", description: 'Task priority' },
      { name: 'status', type: 'VARCHAR(32)', defaultVal: "'Pending'", description: 'Ready, In Progress, Quality Hold, Done' },
      { name: 'planned_hours', type: 'NUMERIC(6, 2)', description: 'Estimated cycle hours' },
      { name: 'actual_hours', type: 'NUMERIC(6, 2)', defaultVal: '0.00', description: 'Logged labor hours' },
      { name: 'qty_planned', type: 'INTEGER', description: 'Target piece count' },
      { name: 'qty_completed', type: 'INTEGER', defaultVal: '0', description: 'Good parts verified' },
      { name: 'qty_scrapped', type: 'INTEGER', defaultVal: '0', description: 'Rejected pieces' }
    ]
  },

  // 3. Quality Department Tables
  quality_inspection_plans: {
    tableName: 'quality_inspection_plans',
    departmentScope: 'QUALITY',
    description: 'Inspection and Test Plans (ITP) defining mandatory hold points and criteria',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Inspection Plan UUID' },
      { name: 'plan_number', type: 'VARCHAR(64)', description: 'ITP identifier' },
      { name: 'project_id', type: 'VARCHAR(64)', references: 'projects.id', description: 'Associated project' },
      { name: 'title', type: 'VARCHAR(255)', description: 'Inspection plan title' },
      { name: 'inspection_type', type: 'VARCHAR(64)', description: 'In-process, NDT, Pre-shipment, etc.' },
      { name: 'standard_reference', type: 'VARCHAR(128)', description: 'ISO/AWS/DIN code' },
      { name: 'mandatory_hold_point', type: 'BOOLEAN', defaultVal: 'true', description: 'Prevents downstream progression until signed' }
    ]
  },

  quality_inspections: {
    tableName: 'quality_inspections',
    departmentScope: 'QUALITY',
    description: 'Executed digital quality inspections with measurements, checklists, and sign-offs',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Inspection report UUID' },
      { name: 'plan_id', type: 'VARCHAR(64)', references: 'quality_inspection_plans.id', description: 'Reference plan' },
      { name: 'project_id', type: 'VARCHAR(64)', references: 'projects.id', description: 'Project ID' },
      { name: 'inspector_id', type: 'VARCHAR(64)', references: 'users.id', description: 'Authorized inspector' },
      { name: 'batch_number', type: 'VARCHAR(64)', description: 'Tracked product/heat batch' },
      { name: 'overall_result', type: 'VARCHAR(32)', description: 'Passed, Rejected - NCR Initiated, Quarantined' },
      { name: 'check_results', type: 'JSONB', description: 'Individual checkpoint pass/fail records' },
      { name: 'inspection_date', type: 'TIMESTAMPTZ', defaultVal: 'NOW()', description: 'Execution timestamp' }
    ]
  },

  quality_ncrs: {
    tableName: 'quality_ncrs',
    departmentScope: 'QUALITY',
    description: 'Non-Conformance Reports with root cause, quarantine, and disposition workflow',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'NCR UUID' },
      { name: 'ncr_number', type: 'VARCHAR(64)', description: 'NCR unique sequence' },
      { name: 'project_id', type: 'VARCHAR(64)', references: 'projects.id', description: 'Project ID' },
      { name: 'title', type: 'VARCHAR(255)', description: 'NCR title' },
      { name: 'severity', type: 'VARCHAR(32)', description: 'Minor, Major, Critical' },
      { name: 'defect_category', type: 'VARCHAR(64)', description: 'Dimensional, Weld, Coating, etc.' },
      { name: 'suspect_quantity', type: 'INTEGER', description: 'Quarantined count' },
      { name: 'disposition', type: 'VARCHAR(64)', defaultVal: "'Pending'", description: 'Rework, Scrap, Concession' },
      { name: 'status', type: 'VARCHAR(32)', defaultVal: "'Logged'", description: 'Logged, Disposition Assigned, Closed' },
      { name: 'cost_of_poor_quality', type: 'NUMERIC(10, 2)', defaultVal: '0.00', description: 'Rework and scrap cost' }
    ]
  },

  quality_capas: {
    tableName: 'quality_capas',
    departmentScope: 'QUALITY',
    description: 'Corrective and Preventive Actions with 5-Why root cause and effectiveness reviews',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'CAPA UUID' },
      { name: 'capa_number', type: 'VARCHAR(64)', description: 'CAPA number' },
      { name: 'ncr_id', type: 'VARCHAR(64)', references: 'quality_ncrs.id', description: 'Originating NCR' },
      { name: 'lead_investigator_id', type: 'VARCHAR(64)', references: 'users.id', description: 'Responsible lead' },
      { name: 'status', type: 'VARCHAR(32)', description: 'Root Cause 5-Why, Action Plan, Verification, Closed' },
      { name: 'corrective_actions', type: 'JSONB', description: 'Corrective measures list' },
      { name: 'preventive_actions', type: 'JSONB', description: 'Preventive systemic measures' }
    ]
  },

  // 4. Product & Resource Management Tables
  product_masters: {
    tableName: 'product_masters',
    departmentScope: 'PRODUCT_RESOURCE',
    description: 'Standard product catalog, engineering specifications, and revision master',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Product UUID' },
      { name: 'product_code', type: 'VARCHAR(64)', description: 'Code e.g. PRD-MET-01' },
      { name: 'name', type: 'VARCHAR(255)', description: 'Product name' },
      { name: 'current_revision', type: 'VARCHAR(16)', defaultVal: "'Rev A'", description: 'Engineering drawing revision' },
      { name: 'standard_unit', type: 'VARCHAR(16)', description: 'PCS, LM, SQM, SET' },
      { name: 'drawing_number', type: 'VARCHAR(64)', description: 'Master CAD reference' },
      { name: 'standard_cost_est', type: 'NUMERIC(12, 2)', description: 'Standard expected build cost' }
    ]
  },

  bill_of_materials: {
    tableName: 'bill_of_materials',
    departmentScope: 'PRODUCT_RESOURCE',
    description: 'Multi-level Bill of Materials linking components, raw stock, and consumables',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'BOM Item UUID' },
      { name: 'product_id', type: 'VARCHAR(64)', references: 'product_masters.id', description: 'Parent product' },
      { name: 'material_code', type: 'VARCHAR(64)', description: 'Raw material or component SKU' },
      { name: 'description', type: 'VARCHAR(255)', description: 'Item description' },
      { name: 'quantity_per_unit', type: 'NUMERIC(10, 4)', description: 'Required gross quantity' },
      { name: 'scrap_allowance_percent', type: 'NUMERIC(5, 2)', defaultVal: '5.00', description: 'Cutting loss allowance' },
      { name: 'unit_cost_estimate', type: 'NUMERIC(10, 2)', description: 'Unit cost standard' }
    ]
  },

  operation_routings: {
    tableName: 'operation_routings',
    departmentScope: 'PRODUCT_RESOURCE',
    description: 'Sequential operations and standard cycle times for workshop fabrication',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Routing step UUID' },
      { name: 'product_id', type: 'VARCHAR(64)', references: 'product_masters.id', description: 'Parent product' },
      { name: 'step_sequence', type: 'INTEGER', description: 'Step order (10, 20, 30...)' },
      { name: 'operation_name', type: 'VARCHAR(128)', description: 'Cutting, Welding, Coating, etc.' },
      { name: 'work_center_id', type: 'VARCHAR(64)', references: 'work_centers.id', description: 'Target work center' },
      { name: 'standard_setup_minutes', type: 'INTEGER', defaultVal: '15', description: 'Setup time' },
      { name: 'standard_run_minutes', type: 'INTEGER', defaultVal: '30', description: 'Run time per piece' }
    ]
  },

  work_centers: {
    tableName: 'work_centers',
    departmentScope: 'PRODUCT_RESOURCE',
    description: 'Physical workshop bays and fabrication work centers',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Work center UUID' },
      { name: 'code', type: 'VARCHAR(32)', description: 'Station code e.g. WC-PLASMA-01' },
      { name: 'name', type: 'VARCHAR(128)', description: 'Station name' },
      { name: 'hourly_cost_rate', type: 'NUMERIC(8, 2)', description: 'Hourly machine/overhead absorption rate' },
      { name: 'daily_capacity_hours', type: 'NUMERIC(5, 2)', defaultVal: '16.00', description: 'Available hours per day' },
      { name: 'status', type: 'VARCHAR(32)', defaultVal: "'Operational'", description: 'Operational, Maintenance' }
    ]
  },

  machines: {
    tableName: 'machines',
    departmentScope: 'PRODUCT_RESOURCE',
    description: 'Industrial machines, CNC tables, welders, and equipment assets',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Machine UUID' },
      { name: 'machine_code', type: 'VARCHAR(64)', description: 'Code e.g. CNC-FIBER-01' },
      { name: 'name', type: 'VARCHAR(128)', description: 'Machine model and brand' },
      { name: 'work_center_id', type: 'VARCHAR(64)', references: 'work_centers.id', description: 'Assigned work center' },
      { name: 'status', type: 'VARCHAR(32)', defaultVal: "'Running'", description: 'Running, Idle, Breakdown' },
      { name: 'next_calibration_due', type: 'DATE', description: 'Quality calibration deadline' }
    ]
  },

  // 5. Object Storage Metadata (Drawings, Attachments, Photos)
  object_storage_attachments: {
    tableName: 'object_storage_attachments',
    departmentScope: 'GLOBAL',
    description: 'Immutable metadata and storage keys for files stored in S3/GCS object storage',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Attachment UUID' },
      { name: 'storage_key', type: 'VARCHAR(512)', description: 'Object storage URI/key' },
      { name: 'file_name', type: 'VARCHAR(255)', description: 'Original file name' },
      { name: 'mime_type', type: 'VARCHAR(64)', description: 'MIME type' },
      { name: 'file_size_kb', type: 'INTEGER', description: 'Size in kilobytes' },
      { name: 'category', type: 'VARCHAR(64)', description: 'CAD Drawing, Photo, Certificate, etc.' },
      { name: 'version', type: 'VARCHAR(16)', defaultVal: "'Rev 1'", description: 'Document version' },
      { name: 'checksum_sha256', type: 'VARCHAR(64)', description: 'Cryptographic hash' },
      { name: 'uploaded_by_id', type: 'VARCHAR(64)', references: 'users.id', description: 'Uploader identity' },
      { name: 'uploaded_at', type: 'TIMESTAMPTZ', defaultVal: 'NOW()', description: 'Upload timestamp' }
    ]
  },

  // 6. Central Approval Engine
  approval_requests: {
    tableName: 'approval_requests',
    departmentScope: 'GLOBAL',
    description: 'Unified multi-step approval workflow for projects, budgets, NCRs, and drawings',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Approval request UUID' },
      { name: 'entity_type', type: 'VARCHAR(64)', description: 'PROJECT, BUDGET, NCR, DRAWING, VARIATION' },
      { name: 'entity_id', type: 'VARCHAR(64)', description: 'Subject record ID' },
      { name: 'status', type: 'VARCHAR(32)', defaultVal: "'Pending'", description: 'Pending, Approved, Rejected' },
      { name: 'current_step', type: 'INTEGER', defaultVal: '1', description: 'Active step order' },
      { name: 'steps_json', type: 'JSONB', description: 'Array of sequential approver roles and decision states' },
      { name: 'requested_by_id', type: 'VARCHAR(64)', references: 'users.id', description: 'Submitter ID' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultVal: 'NOW()', description: 'Submission timestamp' }
    ]
  },

  // 7. Complete Audit Engine
  central_audit_logs: {
    tableName: 'central_audit_logs',
    departmentScope: 'GLOBAL',
    description: 'Immutable ledger recording user, action, module, record, before/after diffs, device and IP',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Audit log UUID' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', defaultVal: 'NOW()', description: 'Event timestamp' },
      { name: 'user_id', type: 'VARCHAR(64)', references: 'users.id', description: 'Actor user ID' },
      { name: 'username', type: 'VARCHAR(64)', description: 'Actor username' },
      { name: 'action', type: 'VARCHAR(32)', description: 'CREATE, UPDATE, DELETE, APPROVE, REJECT, STOP_LINE' },
      { name: 'module', type: 'VARCHAR(64)', description: 'System module' },
      { name: 'record_id', type: 'VARCHAR(64)', description: 'Affected record ID' },
      { name: 'old_value_json', type: 'TEXT', isNullable: true, description: 'Pre-mutation state' },
      { name: 'new_value_json', type: 'TEXT', isNullable: true, description: 'Post-mutation state' },
      { name: 'device', type: 'VARCHAR(128)', description: 'User agent / device identifier' },
      { name: 'ip_address', type: 'VARCHAR(64)', description: 'Client IP address' }
    ]
  },

  // 8. Future Procurement System API Bridge
  procurement_api_bridge: {
    tableName: 'procurement_api_bridge',
    departmentScope: 'PROCUREMENT_BRIDGE',
    description: 'Integration contracts and webhooks allowing the external procurement app to sync POs and GRNs securely without redesign',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Bridge event UUID' },
      { name: 'external_system_id', type: 'VARCHAR(64)', description: 'External procurement application ID' },
      { name: 'api_key_hash', type: 'VARCHAR(128)', description: 'Hashed API token for webhook verification' },
      { name: 'event_type', type: 'VARCHAR(64)', description: 'PURCHASE_ORDER_ISSUED, GRN_RECEIVED, MATERIAL_RELEASED' },
      { name: 'payload_json', type: 'JSONB', description: 'Material receipt or requisition payload' },
      { name: 'sync_status', type: 'VARCHAR(32)', defaultVal: "'Synced'", description: 'Synced, Failed, Pending' },
      { name: 'synced_at', type: 'TIMESTAMPTZ', defaultVal: 'NOW()', description: 'Sync timestamp' }
    ]
  },

  // 9. HR Database Domains: Organization, People, Employment, Recruitment, Attendance, Leave, Payroll, Performance, Learning, Relations, Assets, Documents, Exit, Analytics
  hr_companies: {
    tableName: 'hr_companies',
    departmentScope: 'COMMERCIAL_ADMIN',
    description: 'Corporate legal entities, registration, HQ locations and fiscal definitions',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Company UUID' },
      { name: 'code', type: 'VARCHAR(32)', description: 'Company corporate code' },
      { name: 'name', type: 'VARCHAR(255)', description: 'Legal company name' },
      { name: 'tax_registration_no', type: 'VARCHAR(64)', description: 'TRN / Tax ID' },
      { name: 'currency', type: 'VARCHAR(8)', defaultVal: "'AED'", description: 'Operating currency' }
    ]
  },

  hr_positions: {
    tableName: 'hr_positions',
    departmentScope: 'COMMERCIAL_ADMIN',
    description: 'Position Master with grade, approved headcount, job descriptions and competencies',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Position UUID' },
      { name: 'position_code', type: 'VARCHAR(32)', description: 'Position code' },
      { name: 'title', type: 'VARCHAR(128)', description: 'Job designation title' },
      { name: 'department_code', type: 'VARCHAR(64)', description: 'Assigned department' },
      { name: 'job_grade_id', type: 'VARCHAR(64)', description: 'Salary band grade' },
      { name: 'approved_headcount', type: 'INTEGER', defaultVal: '1', description: 'Budgeted seats' },
      { name: 'current_occupancy', type: 'INTEGER', defaultVal: '0', description: 'Occupied seats' }
    ]
  },

  hr_employees: {
    tableName: 'hr_employees',
    departmentScope: 'COMMERCIAL_ADMIN',
    description: 'Complete digital employee master record with identity, contacts, position, grade and status',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Employee UUID' },
      { name: 'employee_code', type: 'VARCHAR(32)', description: 'Badge / Employee ID e.g. INV-0104' },
      { name: 'full_name', type: 'VARCHAR(255)', description: 'Legal full name' },
      { name: 'national_id', type: 'VARCHAR(64)', description: 'Emirates ID / National ID' },
      { name: 'passport_no', type: 'VARCHAR(64)', description: 'Passport document number' },
      { name: 'work_email', type: 'VARCHAR(255)', description: 'Corporate email' },
      { name: 'department_code', type: 'VARCHAR(64)', description: 'Assigned department' },
      { name: 'position_id', type: 'VARCHAR(64)', references: 'hr_positions.id', description: 'Assigned position' },
      { name: 'employment_type', type: 'VARCHAR(64)', description: 'Permanent, Contract, Probationary, etc.' },
      { name: 'employment_status', type: 'VARCHAR(32)', defaultVal: "'Active'", description: 'Active, Leave, Terminated' },
      { name: 'date_of_joining', type: 'DATE', description: 'Start date' },
      { name: 'basic_salary', type: 'NUMERIC(12, 2)', description: 'Base salary (Encrypted/Restricted)' },
      { name: 'gross_salary', type: 'NUMERIC(12, 2)', description: 'Total monthly salary package' }
    ]
  },

  hr_attendance_punches: {
    tableName: 'hr_attendance_punches',
    departmentScope: 'COMMERCIAL_ADMIN',
    description: 'Biometric, mobile, QR and web clock-in/clock-out events with geolocation',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Punch UUID' },
      { name: 'employee_id', type: 'VARCHAR(64)', references: 'hr_employees.id', description: 'Employee reference' },
      { name: 'punch_date', type: 'DATE', description: 'Shift date' },
      { name: 'clock_in', type: 'TIMESTAMPTZ', description: 'Actual in time' },
      { name: 'clock_out', type: 'TIMESTAMPTZ', isNullable: true, description: 'Actual out time' },
      { name: 'worked_minutes', type: 'INTEGER', defaultVal: '0', description: 'Recorded work duration' },
      { name: 'source', type: 'VARCHAR(32)', description: 'BIOMETRIC, WEB, MOBILE, QR_CODE' }
    ]
  },

  hr_leave_records: {
    tableName: 'hr_leave_records',
    departmentScope: 'COMMERCIAL_ADMIN',
    description: 'Leave requests, approval workflows, carry forward and balances',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Leave request UUID' },
      { name: 'employee_id', type: 'VARCHAR(64)', references: 'hr_employees.id', description: 'Applicant' },
      { name: 'leave_type', type: 'VARCHAR(32)', description: 'Annual, Sick, Emergency, Unpaid' },
      { name: 'start_date', type: 'DATE', description: 'Leave start' },
      { name: 'end_date', type: 'DATE', description: 'Leave end' },
      { name: 'days_count', type: 'NUMERIC(4, 1)', description: 'Calculated work days' },
      { name: 'status', type: 'VARCHAR(32)', defaultVal: "'Pending'", description: 'Pending, Approved, Rejected' }
    ]
  },

  hr_cases_disciplinary_grievance: {
    tableName: 'hr_cases_disciplinary_grievance',
    departmentScope: 'COMMERCIAL_ADMIN',
    description: 'Secure, access-controlled HR cases, disciplinary hearings, and employee grievances',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', isPrimary: true, description: 'Case UUID' },
      { name: 'case_number', type: 'VARCHAR(32)', description: 'Case code e.g. CASE-2026-012' },
      { name: 'case_type', type: 'VARCHAR(32)', description: 'Grievance, Disciplinary, Policy Violation' },
      { name: 'employee_id', type: 'VARCHAR(64)', references: 'hr_employees.id', description: 'Involved employee' },
      { name: 'title', type: 'VARCHAR(255)', description: 'Case headline' },
      { name: 'status', type: 'VARCHAR(32)', defaultVal: "'Reported'", description: 'Reported, Investigating, Resolved' },
      { name: 'confidentiality_level', type: 'VARCHAR(32)', defaultVal: "'Highly Confidential'", description: 'Security access tier' }
    ]
  }
};
