export type DocCategoryGroup = 'Setup' | 'Project' | 'Requirement' | 'Technical';

export interface ProcurementDocItemRecord {
  id: string;
  col1: string; // e.g. Item Code / WBS / Package / Spec
  col2: string; // Description / Scope / Component
  col3: string; // Qty / Budget / Weight / Grade
  col4: string; // Unit / Lead Time / Target / Standard
  col5: string; // Status / Rate / Responsibility / Result
}

export interface ProcurementDocumentDefinition {
  docNumber: number; // 1 to 89
  id: string;
  docCode: string;
  title: string;
  group: DocCategoryGroup;
  barcodeValue: string;
  defaultHeaders: [string, string, string, string, string];
  defaultRecords: ProcurementDocItemRecord[];
  standardClauses: string[];
}

export interface UniversalDocFormData {
  docNumber: number;
  docCode: string;
  docTitle: string;
  docRefNo: string;
  date: string;
  effectiveDate: string;
  revision: string;
  classification: string;
  projectId: string;
  projectName: string;
  projectLocation: string;
  clientName: string;
  vendorName: string;
  vendorCode: string;
  tableHeaders: [string, string, string, string, string];
  tableRows: ProcurementDocItemRecord[];
  notes: string;
  clauses: string[];
  preparedBy: string;
  preparedRole: string;
  reviewedBy: string;
  reviewedRole: string;
  approvedBy: string;
  approvedRole: string;
  authorizedBy: string;
  authorizedRole: string;
}
