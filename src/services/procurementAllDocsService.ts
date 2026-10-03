import { ProcurementDocumentDefinition, UniversalDocFormData, DocCategoryGroup } from './procurementDocTypes';
import { DOCS_1_TO_22 } from './docsData/docs1to22_setup';
import { DOCS_23_TO_40 } from './docsData/docs23to40_project';
import { DOCS_41_TO_60 } from './docsData/docs41to60_requirement';
import { DOCS_61_TO_89 } from './docsData/docs61to89_technical';

export const ALL_89_PROCUREMENT_DOCUMENTS: ProcurementDocumentDefinition[] = [
  ...DOCS_1_TO_22,
  ...DOCS_23_TO_40,
  ...DOCS_41_TO_60,
  ...DOCS_61_TO_89
];

export class ProcurementAllDocsService {
  public getAllDocuments(): ProcurementDocumentDefinition[] {
    return ALL_89_PROCUREMENT_DOCUMENTS;
  }

  public getDocumentsByGroup(group: DocCategoryGroup | 'All'): ProcurementDocumentDefinition[] {
    if (group === 'All') return ALL_89_PROCUREMENT_DOCUMENTS;
    return ALL_89_PROCUREMENT_DOCUMENTS.filter(d => d.group === group);
  }

  public getDocumentByNumber(num: number): ProcurementDocumentDefinition | undefined {
    return ALL_89_PROCUREMENT_DOCUMENTS.find(d => d.docNumber === num);
  }

  public getDocumentById(id: string): ProcurementDocumentDefinition | undefined {
    return ALL_89_PROCUREMENT_DOCUMENTS.find(d => d.id === id || d.docCode === id);
  }

  public generateDefaultFormData(
    doc: ProcurementDocumentDefinition,
    project?: any,
    supplier?: any
  ): UniversalDocFormData {
    const today = new Date().toISOString().split('T')[0];
    const projName = project?.name || 'Grand Hyatt Façade Expansion & Marina Towers';
    const projCode = project?.id || 'PRJ-2026-DXB-01';
    const projLoc = project?.location || 'Downtown Financial District, Dubai, UAE';
    const clientName = project?.clientName || 'Emaar Properties PJSC';
    const vendorName = supplier?.name || 'Alumex Architectural Extrusions PLC';
    const vendorCode = supplier?.vendorCode || supplier?.id || 'VND-ALU-001';

    return {
      docNumber: doc.docNumber,
      docCode: doc.docCode,
      docTitle: doc.title,
      docRefNo: `${doc.docCode}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: today,
      effectiveDate: today,
      revision: 'REV-01 (Approved)',
      classification: 'OFFICIAL PROCUREMENT',
      projectId: projCode,
      projectName: projName,
      projectLocation: projLoc,
      clientName: clientName,
      vendorName: vendorName,
      vendorCode: vendorCode,
      tableHeaders: [...doc.defaultHeaders],
      tableRows: doc.defaultRecords.map(r => ({ ...r })),
      notes: `Official procurement record for ${doc.title}. Certified in compliance with ISO 9001 and CWCT architectural façade standards.`,
      clauses: [...doc.standardClauses],
      preparedBy: 'Alexander Vance',
      preparedRole: 'Senior Strategic Procurement Lead',
      reviewedBy: 'Elena Rostova',
      reviewedRole: 'Director of Façade Engineering & QA',
      approvedBy: 'Marcus Sterling',
      approvedRole: 'Chief Operating Officer & Project Commercial Director',
      authorizedBy: 'Eng. Priyantha Jayasuriya',
      authorizedRole: 'Authorized Corporate Signatory'
    };
  }
}

export const procurementAllDocsService = new ProcurementAllDocsService();
