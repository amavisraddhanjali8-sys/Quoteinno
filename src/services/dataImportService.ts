import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  ItemTemplate, Client, Project, 
  Invoice, Personnel, Equipment, BOQItem, MeasurementUnit,
  InvoiceType, InvoiceStatus
} from '../types';

export type ImportEntityType = 
  | 'boq_items' 
  | 'variants' 
  | 'clients' 
  | 'projects' 
  | 'invoices' 
  | 'personnel' 
  | 'equipment' 
  | 'boq_lines';

export interface EntityFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'select' | 'email' | 'phone';
  options?: string[];
  defaultValue?: any;
  description: string;
  synonyms: string[];
}

export interface StagingRow {
  _rowId: string;
  _status: 'valid' | 'warning' | 'error';
  _errors: Record<string, string>;
  _warnings: Record<string, string>;
  _isDuplicateInFile?: boolean;
  _isExistingInSystem?: boolean;
  _existingRecordId?: string;
  data: Record<string, any>;
}

export interface ColumnMapping {
  fileHeader: string;
  targetFieldKey: string; // empty if ignored
  confidence: number;
}

export interface ValidationSummary {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  existingMatchCount: number;
  veracityScore: number; // 0 - 100
}

export type ConflictResolutionMode = 'UPSERT' | 'INSERT_ONLY' | 'RENAME_NEW';

// ==========================================
// SCHEMA DEFINITIONS FOR ALL DATA TYPES
// ==========================================

export const ENTITY_SCHEMAS: Record<ImportEntityType, {
  label: string;
  description: string;
  primaryKey: string;
  fields: EntityFieldDefinition[];
}> = {
  boq_items: {
    label: 'BOQ Master Items & Templates',
    description: 'Master architectural items, fabrication rates, unit measurements, and specifications',
    primaryKey: 'productCode',
    fields: [
      {
        key: 'productCode',
        label: 'Item Code',
        required: true,
        type: 'string',
        description: 'Unique primary key (e.g. AL-WIN-01, GL-PART-10MM)',
        synonyms: ['item code', 'product code', 'code', 'item id', 'id', 'sku', 'part number', 'item_code']
      },
      {
        key: 'name',
        label: 'Item Name / Description',
        required: true,
        type: 'string',
        description: 'Commercial and technical item title',
        synonyms: ['item name', 'name', 'title', 'description', 'item description', 'product name']
      },
      {
        key: 'category',
        label: 'Category',
        required: true,
        type: 'string',
        defaultValue: 'Aluminium Works',
        description: 'Primary trade classification',
        synonyms: ['category', 'main category', 'trade', 'group', 'item category', 'type']
      },
      {
        key: 'subCategory',
        label: 'Sub-Category',
        required: false,
        type: 'string',
        description: 'Sub-classification (e.g. Sliding Windows, Partitions)',
        synonyms: ['sub category', 'sub-category', 'subcategory', 'sub group', 'section']
      },
      {
        key: 'unit',
        label: 'Unit of Measure',
        required: true,
        type: 'string',
        defaultValue: 'm²',
        description: 'Bill of quantities measurement unit (m², L.M., Nos, Item, etc.)',
        synonyms: ['unit', 'uom', 'measurement unit', 'unit of measure', 'qty unit']
      },
      {
        key: 'rate',
        label: 'Selling Rate (LKR)',
        required: true,
        type: 'number',
        defaultValue: 0,
        description: 'Commercial client selling price per unit',
        synonyms: ['rate', 'selling rate', 'unit rate', 'price', 'unit price', 'selling price', 'amount', 'rate (lkr)']
      },
      {
        key: 'lastSupplierPrice',
        label: 'Supplier / Direct Cost (LKR)',
        required: false,
        type: 'number',
        defaultValue: 0,
        description: 'Direct procurement cost per unit',
        synonyms: ['cost', 'supplier cost', 'direct cost', 'buying price', 'cost price', 'last supplier price', 'purchase rate']
      },
      {
        key: 'description',
        label: 'Detailed Specification Clause',
        required: false,
        type: 'string',
        description: 'Full tender or engineering specification wording',
        synonyms: ['spec', 'specification', 'full description', 'clause', 'scope', 'notes', 'technical spec']
      },
      {
        key: 'status',
        label: 'Status',
        required: false,
        type: 'select',
        options: ['Active', 'Draft', 'Archived', 'Pending Review'],
        defaultValue: 'Active',
        description: 'Lifecycle state of the master item',
        synonyms: ['status', 'item status', 'active', 'state']
      }
    ]
  },

  variants: {
    label: 'Product Variants & Pricing Matrices',
    description: 'Specific system configurations with direct BOM rollups, profiles, finishes, and selling prices',
    primaryKey: 'variantCode',
    fields: [
      {
        key: 'variantCode',
        label: 'Variant Code',
        required: true,
        type: 'string',
        description: 'Unique variant identifier (e.g. VAR-AL-SLD-001)',
        synonyms: ['variant code', 'code', 'sku', 'variant id', 'variant_code', 'model']
      },
      {
        key: 'variantName',
        label: 'Variant Name',
        required: true,
        type: 'string',
        description: 'Descriptive title of variant configuration',
        synonyms: ['variant name', 'name', 'title', 'configuration', 'model name']
      },
      {
        key: 'parentItemCode',
        label: 'Parent Item Code / Name',
        required: false,
        type: 'string',
        description: 'Associated parent product catalog code',
        synonyms: ['parent item', 'parent', 'product code', 'parent product', 'base product']
      },
      {
        key: 'categoryName',
        label: 'Category',
        required: false,
        type: 'string',
        defaultValue: 'Aluminium Works',
        description: 'Category name',
        synonyms: ['category', 'category name', 'trade']
      },
      {
        key: 'unit',
        label: 'Unit',
        required: true,
        type: 'string',
        defaultValue: 'sq.ft',
        description: 'Pricing unit (sq.ft, m², Nos)',
        synonyms: ['unit', 'uom', 'measurement unit']
      },
      {
        key: 'sellingPrice',
        label: 'Selling Price (LKR)',
        required: true,
        type: 'number',
        description: 'Commercial selling price per unit',
        synonyms: ['selling price', 'price', 'selling rate', 'rate', 'unit price', 'selling price (lkr)']
      },
      {
        key: 'materialCost',
        label: 'Material Cost (LKR)',
        required: false,
        type: 'number',
        defaultValue: 0,
        description: 'Direct materials subtotal',
        synonyms: ['material cost', 'direct material', 'materials', 'profile cost', 'glass cost']
      },
      {
        key: 'labourCost',
        label: 'Labour Cost (LKR)',
        required: false,
        type: 'number',
        defaultValue: 0,
        description: 'Direct fabrication and site labour',
        synonyms: ['labour cost', 'labor cost', 'direct labour', 'fabrication cost', 'installation cost']
      },
      {
        key: 'totalCost',
        label: 'Total Rolled-Up Cost (LKR)',
        required: false,
        type: 'number',
        defaultValue: 0,
        description: 'Total unit cost including overheads',
        synonyms: ['total cost', 'cost', 'base cost', 'cost price', 'bom total', 'total unit cost']
      },
      {
        key: 'status',
        label: 'Status',
        required: false,
        type: 'select',
        options: ['ACTIVE', 'DRAFT', 'DEPRECATED', 'ENGINEERING_REVIEW'],
        defaultValue: 'ACTIVE',
        description: 'Status of variant in commercial pricebook',
        synonyms: ['status', 'commercial status', 'state']
      }
    ]
  },

  clients: {
    label: 'Clients & Commercial Directory',
    description: 'Corporate clients, contractors, developers, credit limits, and commercial terms',
    primaryKey: 'name',
    fields: [
      {
        key: 'name',
        label: 'Company / Client Name',
        required: true,
        type: 'string',
        description: 'Full corporate or individual customer name',
        synonyms: ['client name', 'company name', 'name', 'customer', 'customer name', 'client', 'company']
      },
      {
        key: 'cvcCode',
        label: 'Client / Account Code',
        required: false,
        type: 'string',
        description: 'Unique account reference (e.g. CVC-2026-001)',
        synonyms: ['client code', 'account code', 'code', 'client id', 'id', 'cvc code', 'account no']
      },
      {
        key: 'phone',
        label: 'Phone / Contact Number',
        required: true,
        type: 'phone',
        description: 'Primary telephone or mobile number',
        synonyms: ['phone', 'contact number', 'mobile', 'telephone', 'tel', 'phone number', 'contact']
      },
      {
        key: 'email',
        label: 'Email Address',
        required: false,
        type: 'email',
        description: 'Official corporate billing/inquiry email',
        synonyms: ['email', 'email address', 'mail', 'contact email']
      },
      {
        key: 'address',
        label: 'Billing / Physical Address',
        required: true,
        type: 'string',
        defaultValue: 'Colombo, Sri Lanka',
        description: 'Official registered or billing address',
        synonyms: ['address', 'billing address', 'location', 'street', 'city', 'office address']
      },
      {
        key: 'category',
        label: 'Client Category',
        required: false,
        type: 'select',
        options: ['Developer', 'Main Contractor', 'Architectural Consultant', 'Direct Owner', 'Corporate', 'Government', 'General'],
        defaultValue: 'Main Contractor',
        description: 'Customer sector type',
        synonyms: ['category', 'client category', 'tier', 'type', 'client type']
      },
      {
        key: 'creditLimit',
        label: 'Credit Limit (LKR)',
        required: false,
        type: 'number',
        defaultValue: 0,
        description: 'Approved commercial credit facility',
        synonyms: ['credit limit', 'credit', 'credit facility', 'limit', 'credit limit (lkr)']
      },
      {
        key: 'paymentTerms',
        label: 'Payment Terms',
        required: false,
        type: 'string',
        defaultValue: '30 Days Net',
        description: 'Agreed commercial payment duration',
        synonyms: ['payment terms', 'terms', 'credit terms', 'terms of payment']
      },
      {
        key: 'status',
        label: 'Account Status',
        required: false,
        type: 'select',
        options: ['Active', 'On Hold', 'Inactive', 'Blacklisted'],
        defaultValue: 'Active',
        description: 'Commercial relationship standing',
        synonyms: ['status', 'account status', 'standing']
      }
    ]
  },

  projects: {
    label: 'Projects & Contracts Master',
    description: 'Contractual projects, contract sums, client relationships, and start dates',
    primaryKey: 'projectName',
    fields: [
      {
        key: 'projectName',
        label: 'Project Name',
        required: true,
        type: 'string',
        description: 'Official project or site location name',
        synonyms: ['project name', 'project', 'title', 'site name', 'contract name', 'name']
      },
      {
        key: 'clientName',
        label: 'Client / Customer Name',
        required: true,
        type: 'string',
        description: 'Awarding client or developer name',
        synonyms: ['client', 'client name', 'customer', 'customer name', 'awarded by', 'employer']
      },
      {
        key: 'totalValue',
        label: 'Contract Value (LKR)',
        required: true,
        type: 'number',
        defaultValue: 0,
        description: 'Total contract or project value',
        synonyms: ['total value', 'contract value', 'value', 'contract sum', 'amount', 'project value', 'total sum']
      },
      {
        key: 'status',
        label: 'Project Status',
        required: true,
        type: 'select',
        options: ['In Progress', 'Completed', 'On Hold', 'Cancelled'],
        defaultValue: 'In Progress',
        description: 'Operational stage',
        synonyms: ['status', 'project status', 'stage', 'state']
      },
      {
        key: 'startDate',
        label: 'Start Date',
        required: false,
        type: 'date',
        description: 'Site possession or commencement date (YYYY-MM-DD)',
        synonyms: ['start date', 'commencement date', 'date', 'possession date', 'commenced']
      },
      {
        key: 'classification',
        label: 'Classification / Sector',
        required: false,
        type: 'string',
        defaultValue: 'Commercial',
        description: 'Architectural sector (Commercial, Residential, Industrial, Hospitality)',
        synonyms: ['classification', 'sector', 'type', 'building type']
      },
      {
        key: 'notes',
        label: 'Project Notes & Scope Summary',
        required: false,
        type: 'string',
        description: 'Special conditions, retention terms, or consultant details',
        synonyms: ['notes', 'scope', 'remarks', 'description', 'comments']
      }
    ]
  },

  invoices: {
    label: 'Invoices & Billing Master',
    description: 'Progress claims, tax invoices, billing amounts, and collection statuses',
    primaryKey: 'invoiceNumber',
    fields: [
      {
        key: 'invoiceNumber',
        label: 'Invoice Number',
        required: true,
        type: 'string',
        description: 'Formal invoice number (e.g. INV-2026-0042)',
        synonyms: ['invoice number', 'invoice no', 'invoice #', 'inv no', 'bill no', 'id', 'invoice_number']
      },
      {
        key: 'clientName',
        label: 'Client Name',
        required: true,
        type: 'string',
        description: 'Invoiced customer name',
        synonyms: ['client', 'client name', 'customer', 'customer name', 'billed to']
      },
      {
        key: 'total',
        label: 'Invoice Amount (LKR)',
        required: true,
        type: 'number',
        description: 'Gross invoice payable sum',
        synonyms: ['total', 'amount', 'invoice amount', 'total amount', 'sum', 'grand total', 'net total']
      },
      {
        key: 'issueDate',
        label: 'Issue Date',
        required: true,
        type: 'date',
        description: 'Invoice creation date (YYYY-MM-DD)',
        synonyms: ['issue date', 'date', 'invoice date', 'billing date', 'created at']
      },
      {
        key: 'dueDate',
        label: 'Due Date',
        required: false,
        type: 'date',
        description: 'Payment maturity deadline (YYYY-MM-DD)',
        synonyms: ['due date', 'payment due', 'maturity date']
      },
      {
        key: 'status',
        label: 'Payment Status',
        required: true,
        type: 'select',
        options: ['Pending', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'],
        defaultValue: 'Pending',
        description: 'Settlement state',
        synonyms: ['status', 'payment status', 'invoice status', 'state']
      },
      {
        key: 'projectName',
        label: 'Related Project Name',
        required: false,
        type: 'string',
        description: 'Associated project or contract site',
        synonyms: ['project', 'project name', 'site', 'contract']
      }
    ]
  },

  personnel: {
    label: 'Site Resources & Personnel',
    description: 'Engineers, fabricators, installers, safety officers, and labor hourly rates',
    primaryKey: 'name',
    fields: [
      {
        key: 'name',
        label: 'Staff / Operative Name',
        required: true,
        type: 'string',
        description: 'Full employee or contractor name',
        synonyms: ['name', 'full name', 'personnel name', 'employee', 'worker name', 'staff name']
      },
      {
        key: 'role',
        label: 'Role / Designation',
        required: true,
        type: 'string',
        defaultValue: 'Fabricator',
        description: 'Job function (e.g. Lead Glazier, QA Engineer, Project Manager)',
        synonyms: ['role', 'designation', 'job title', 'trade', 'position', 'skill']
      },
      {
        key: 'phone',
        label: 'Phone Number',
        required: false,
        type: 'phone',
        description: 'Direct contact phone',
        synonyms: ['phone', 'contact', 'mobile', 'tel']
      },
      {
        key: 'hourlyRate',
        label: 'Standard Hourly Rate (LKR)',
        required: false,
        type: 'number',
        defaultValue: 1200,
        description: 'Costing labor rate per hour',
        synonyms: ['hourly rate', 'rate', 'labor rate', 'unit rate', 'cost per hour', 'wage']
      },
      {
        key: 'status',
        label: 'Status',
        required: false,
        type: 'select',
        options: ['Active', 'On Leave', 'Allocated', 'Inactive'],
        defaultValue: 'Active',
        description: 'Current availability status',
        synonyms: ['status', 'availability', 'state']
      }
    ]
  },

  equipment: {
    label: 'Machinery & Equipment Assets',
    description: 'Heavy machinery, CNC cutting lines, hoisting equipment, and safety scaffolding',
    primaryKey: 'name',
    fields: [
      {
        key: 'name',
        label: 'Equipment Asset Name',
        required: true,
        type: 'string',
        description: 'Equipment machine name (e.g. Double Head Mitre Saw, Spider Glass Hoist)',
        synonyms: ['name', 'equipment name', 'asset name', 'machine', 'title']
      },
      {
        key: 'assetTag',
        label: 'Asset Tag / Serial Number',
        required: false,
        type: 'string',
        description: 'Barcode or asset reference tag (e.g. EQ-MTR-01)',
        synonyms: ['asset tag', 'tag', 'serial number', 'serial', 'code', 'asset id']
      },
      {
        key: 'type',
        label: 'Equipment Category',
        required: true,
        type: 'string',
        defaultValue: 'Fabrication Machine',
        description: 'Machine category (Cutting, Hoisting, Measuring, Hand Tool)',
        synonyms: ['type', 'category', 'asset type', 'classification']
      },
      {
        key: 'dailyRate',
        label: 'Internal Day Rate (LKR)',
        required: false,
        type: 'number',
        defaultValue: 5000,
        description: 'Plant chargeout rate per day',
        synonyms: ['daily rate', 'day rate', 'rate', 'hire rate', 'cost per day']
      },
      {
        key: 'status',
        label: 'Equipment Status',
        required: false,
        type: 'select',
        options: ['Available', 'In Use', 'Under Maintenance', 'Decommissioned'],
        defaultValue: 'Available',
        description: 'Operational readiness',
        synonyms: ['status', 'operational status', 'condition']
      }
    ]
  },

  boq_lines: {
    label: 'Estimate / Quote BOQ Items',
    description: 'Active Bill of Quantities line items with quantities, units, and rates',
    primaryKey: 'name',
    fields: [
      {
        key: 'name',
        label: 'Description / Item Name',
        required: true,
        type: 'string',
        description: 'BOQ item scope description',
        synonyms: ['name', 'description', 'item', 'scope', 'item description']
      },
      {
        key: 'itemCode',
        label: 'Catalog Item Code',
        required: false,
        type: 'string',
        description: 'Associated master item code (e.g. AL-WIN-01)',
        synonyms: ['item code', 'code', 'sku', 'id']
      },
      {
        key: 'category',
        label: 'Category',
        required: false,
        type: 'string',
        defaultValue: 'Aluminium Works',
        description: 'Work classification',
        synonyms: ['category', 'trade', 'section']
      },
      {
        key: 'quantity',
        label: 'Quantity',
        required: true,
        type: 'number',
        defaultValue: 1,
        description: 'Bill quantity required',
        synonyms: ['quantity', 'qty', 'units', 'amount of units', 'count']
      },
      {
        key: 'unit',
        label: 'Unit',
        required: true,
        type: 'string',
        defaultValue: 'm²',
        description: 'Measurement unit (m², L.M., Nos)',
        synonyms: ['unit', 'uom', 'measurement unit']
      },
      {
        key: 'rate',
        label: 'Unit Rate (LKR)',
        required: true,
        type: 'number',
        defaultValue: 0,
        description: 'Contract line unit rate',
        synonyms: ['rate', 'unit rate', 'price', 'unit price']
      }
    ]
  }
};

// ==========================================
// SAMPLE DATA FOR DOWNLOADABLE TEMPLATES
// ==========================================

export const SAMPLE_DATA_FOR_TEMPLATES: Record<ImportEntityType, Record<string, any>[]> = {
  boq_items: [
    {
      productCode: 'AL-WIN-SLD-01',
      name: 'Heavy Duty 2-Track Sliding Window (Bronze Powder Coated)',
      category: 'Aluminium Works',
      subCategory: 'Sliding Windows (2-Track / 3-Track)',
      unit: 'm²',
      rate: 34500,
      lastSupplierPrice: 24800,
      description: 'Supply and precision installation of 2-track heavy-duty sliding window assembly fabricated from 1.5mm architectural aluminium extrusion SLS 1410.',
      status: 'Active'
    },
    {
      productCode: 'GL-PART-12MM-TMP',
      name: '12mm Clear Tempered Frameless Glass Partition Assembly',
      category: 'Glass & Glazing',
      subCategory: 'Frameless Glass Partitions',
      unit: 'm²',
      rate: 28500,
      lastSupplierPrice: 19800,
      description: 'Supply and fix 12mm clear monolithic toughened safety glass with polished flat arrissed edges and clear structural silicone butt joints.',
      status: 'Active'
    },
    {
      productCode: 'ST-RAIL-SS304',
      name: 'Grade 304 Brushed Stainless Steel Balustrade & Handrail',
      category: 'Steel & Metal Works',
      subCategory: 'Stainless Steel Handrails',
      unit: 'L.M.',
      rate: 22000,
      lastSupplierPrice: 15400,
      description: '50mm diameter brushed stainless steel Grade 304 handrail with 38mm vertical balusters and anchor plate base details.',
      status: 'Active'
    }
  ],

  variants: [
    {
      variantCode: 'VAR-AL-SLD-80MM-BRZ',
      variantName: '80mm 2-Track Sliding Window (AkzoNobel Dark Bronze)',
      parentItemCode: 'AL-WIN-SLD-01',
      categoryName: 'Aluminium Works',
      unit: 'sq.ft',
      sellingPrice: 3850,
      materialCost: 2250,
      labourCost: 450,
      totalCost: 2980,
      status: 'ACTIVE'
    },
    {
      variantCode: 'VAR-GL-PART-12MM-FRM',
      variantName: '12mm Frameless Glass Partition with Hydraulic Floor Spring Door',
      parentItemCode: 'GL-PART-12MM-TMP',
      categoryName: 'Glass & Glazing',
      unit: 'sq.ft',
      sellingPrice: 3200,
      materialCost: 1850,
      labourCost: 380,
      totalCost: 2460,
      status: 'ACTIVE'
    }
  ],

  clients: [
    {
      name: 'Maga Engineering (Pvt) Ltd',
      cvcCode: 'CVC-2026-001',
      phone: '+94 11 280 8835',
      email: 'procurement@maga.lk',
      address: 'No. 200, Nawala Road, Narahenpita, Colombo 05',
      category: 'Main Contractor',
      creditLimit: 50000000,
      paymentTerms: '45 Days Net',
      status: 'Active'
    },
    {
      name: 'Access Projects (Pvt) Ltd',
      cvcCode: 'CVC-2026-002',
      phone: '+94 11 760 6600',
      email: 'facades@access.lk',
      address: 'Access Towers, No. 278, Union Place, Colombo 02',
      category: 'Main Contractor',
      creditLimit: 75000000,
      paymentTerms: '30 Days Net',
      status: 'Active'
    }
  ],

  projects: [
    {
      projectName: 'Cinnamon Life Waterfront - Tower B Facades',
      clientName: 'Maga Engineering (Pvt) Ltd',
      totalValue: 84500000,
      status: 'In Progress',
      startDate: '2026-02-01',
      classification: 'Commercial',
      notes: 'Curtain walling and unitized acoustic glazing across levels 12-24.'
    },
    {
      projectName: 'Havelock City Phase 4 Clubhouse Glazing',
      clientName: 'Access Projects (Pvt) Ltd',
      totalValue: 26800000,
      status: 'In Progress',
      startDate: '2026-03-15',
      classification: 'Residential',
      notes: 'Double-glazed thermal break sliding doors with acoustic laminate.'
    }
  ],

  invoices: [
    {
      invoiceNumber: 'INV-2026-0101',
      clientName: 'Maga Engineering (Pvt) Ltd',
      total: 12500000,
      issueDate: '2026-03-01',
      dueDate: '2026-04-15',
      status: 'Paid',
      projectName: 'Cinnamon Life Waterfront - Tower B Facades'
    },
    {
      invoiceNumber: 'INV-2026-0102',
      clientName: 'Access Projects (Pvt) Ltd',
      total: 8400000,
      issueDate: '2026-03-10',
      dueDate: '2026-04-10',
      status: 'Pending',
      projectName: 'Havelock City Phase 4 Clubhouse Glazing'
    }
  ],

  personnel: [
    {
      name: 'Saman Jayasinghe',
      role: 'Senior Façade Engineer',
      phone: '+94 77 123 4567',
      hourlyRate: 2800,
      status: 'Active'
    },
    {
      name: 'K. Bandara',
      role: 'Master Aluminium Fabricator',
      phone: '+94 71 987 6543',
      hourlyRate: 1500,
      status: 'Active'
    }
  ],

  equipment: [
    {
      name: 'Emmegi 2-Axis CNC Double Mitre Saw',
      assetTag: 'EQ-CNC-001',
      type: 'Fabrication Machine',
      dailyRate: 18000,
      status: 'Available'
    },
    {
      name: 'Smartlift Vacuum Glass Manipulator 600kg',
      assetTag: 'EQ-GLS-004',
      type: 'Hoisting Equipment',
      dailyRate: 25000,
      status: 'Available'
    }
  ],

  boq_lines: [
    {
      name: 'Powder coated aluminium sliding window 1800x1200mm with 6mm clear tempered glass',
      itemCode: 'AL-WIN-SLD-01',
      category: 'Aluminium Works',
      quantity: 14,
      unit: 'm²',
      rate: 34500
    },
    {
      name: '12mm frameless clear tempered glass partition with floor spring glass pivot door',
      itemCode: 'GL-PART-12MM-TMP',
      category: 'Glass & Glazing',
      quantity: 36,
      unit: 'm²',
      rate: 28500
    }
  ]
};

// ==========================================
// TEMPLATE GENERATOR (CSV & EXCEL)
// ==========================================

export const downloadSampleTemplate = (
  entityType: ImportEntityType,
  format: 'csv' | 'xlsx' = 'xlsx'
) => {
  const schema = ENTITY_SCHEMAS[entityType];
  const sampleRows = SAMPLE_DATA_FOR_TEMPLATES[entityType] || [];
  const filename = `${entityType.toUpperCase()}_Template_${new Date().toISOString().split('T')[0]}`;

  if (format === 'csv') {
    // Generate CSV
    const headers = schema.fields.map(f => f.label);
    const keys = schema.fields.map(f => f.key);
    const rows = sampleRows.map(row => keys.map(k => row[k] !== undefined ? row[k] : ''));

    const escapeCell = (v: any): string => {
      if (v === null || v === undefined) return '';
      const str = String(v);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const dataLines = rows.map(r => r.map(escapeCell).join(','));
    const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  } else {
    // Generate Excel with styled headers and guidelines
    const headers = schema.fields.map(f => f.label);
    const keys = schema.fields.map(f => f.key);
    const dataArray = [
      headers,
      ...sampleRows.map(row => keys.map(k => row[k] !== undefined ? row[k] : ''))
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dataArray);

    // Set column widths
    worksheet['!cols'] = schema.fields.map(f => ({
      wch: Math.max(f.label.length + 4, 18)
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, schema.label.substring(0, 31));

    // Optional Guide Sheet
    const guideData = [
      ['Column Name', 'Field Code', 'Required?', 'Data Type', 'Description & Example'],
      ...schema.fields.map(f => [
        f.label,
        f.key,
        f.required ? 'YES (Mandatory)' : 'Optional',
        f.type.toUpperCase(),
        f.description
      ])
    ];
    const guideSheet = XLSX.utils.aoa_to_sheet(guideData);
    guideSheet['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, guideSheet, 'Field Guide');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  }
};

// ==========================================
// FILE PARSING ROUTINES
// ==========================================

export const parseImportFile = async (
  file: File
): Promise<{ sheetNames: string[]; rawRows: any[][]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('No worksheets found in file.');
        }

        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        
        // Read raw rows
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '', 
          blankrows: false 
        });

        if (!rawData || rawData.length === 0) {
          throw new Error('Spreadsheet appears to be completely empty.');
        }

        // Identify header row (first non-empty row)
        let headerRowIndex = 0;
        while (headerRowIndex < rawData.length && (!rawData[headerRowIndex] || rawData[headerRowIndex].length === 0)) {
          headerRowIndex++;
        }

        if (headerRowIndex >= rawData.length) {
          throw new Error('Could not detect header row.');
        }

        const headers = rawData[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = rawData.slice(headerRowIndex + 1).filter(r => r.some(cell => cell !== '' && cell !== null && cell !== undefined));

        resolve({
          sheetNames: workbook.SheetNames,
          rawRows: dataRows,
          headers
        });
      } catch (err: any) {
        reject(new Error(`Failed to parse file: ${err.message || 'Corrupted or invalid spreadsheet format.'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses raw text copied directly from spreadsheet applications (Excel, Sheets).
 */
export const parsePastedSpreadsheetText = (
  text: string
): { headers: string[]; rawRows: any[][] } => {
  const clean = text.trim();
  if (!clean) throw new Error('Pasted content is empty.');

  // Check if tab-separated or comma-separated
  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) throw new Error('No rows found in pasted text.');

  const delimiter = lines[0].includes('\t') ? '\t' : ',';

  const rows = lines.map(line => {
    if (delimiter === '\t') {
      return line.split('\t').map(c => c.trim());
    }
    // CSV splitter handling quotes
    const pattern = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
    const entries: string[] = [];
    let match;
    while ((match = pattern.exec(line)) !== null) {
      if (match.index === pattern.lastIndex) pattern.lastIndex++;
      const val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      if (val !== undefined) entries.push(val.trim());
    }
    return entries;
  });

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return { headers, rawRows: dataRows };
};

// ==========================================
// COLUMN AUTO-MAPPING
// ==========================================

export const autoMapColumns = (
  headers: string[],
  entityType: ImportEntityType
): ColumnMapping[] => {
  const schema = ENTITY_SCHEMAS[entityType];
  const usedKeys = new Set<string>();

  return headers.map(header => {
    const hLower = header.toLowerCase().trim().replace(/[_\s-]+/g, ' ');
    let bestKey = '';
    let bestScore = 0;

    for (const field of schema.fields) {
      if (usedKeys.has(field.key)) continue;

      const fLabelLower = field.label.toLowerCase();
      const fKeyLower = field.key.toLowerCase();

      // Exact match
      if (hLower === fLabelLower || hLower === fKeyLower) {
        bestKey = field.key;
        bestScore = 1.0;
        break;
      }

      // Synonym match
      for (const syn of field.synonyms) {
        const sLower = syn.toLowerCase();
        if (hLower === sLower) {
          bestKey = field.key;
          bestScore = 0.95;
          break;
        }
        if (hLower.includes(sLower) || sLower.includes(hLower)) {
          if (bestScore < 0.8) {
            bestKey = field.key;
            bestScore = 0.8;
          }
        }
      }
    }

    if (bestKey && bestScore >= 0.7) {
      usedKeys.add(bestKey);
      return { fileHeader: header, targetFieldKey: bestKey, confidence: bestScore };
    }

    return { fileHeader: header, targetFieldKey: '', confidence: 0 };
  });
};

// ==========================================
// VERACITY & VALIDITY ENGINE
// ==========================================

export const evaluateRowVeracity = (
  data: Record<string, any>,
  entityType: ImportEntityType,
  existingSystemKeys: Set<string>,
  seenKeysInBatch: Map<string, number>,
  rowIndex: number
): {
  status: 'valid' | 'warning' | 'error';
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isDuplicateInFile: boolean;
  isExistingInSystem: boolean;
} => {
  const schema = ENTITY_SCHEMAS[entityType];
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  let isDuplicateInFile = false;
  let isExistingInSystem = false;

  const pkField = schema.primaryKey;
  const rawPkVal = data[pkField];
  const pkStr = rawPkVal !== undefined && rawPkVal !== null ? String(rawPkVal).trim() : '';

  // 1. Primary Key Checks
  if (!pkStr) {
    errors[pkField] = `${schema.fields.find(f => f.key === pkField)?.label || 'Primary Key'} is required.`;
  } else {
    // Normalization for duplicate checking
    const normalizedPk = pkStr.toLowerCase();
    
    // Check intra-file duplicate
    if (seenKeysInBatch.has(normalizedPk)) {
      isDuplicateInFile = true;
      errors[pkField] = `Duplicate ${schema.fields.find(f => f.key === pkField)?.label} "${pkStr}" detected in file (first seen at row ${seenKeysInBatch.get(normalizedPk)! + 1}).`;
    } else {
      seenKeysInBatch.set(normalizedPk, rowIndex);
    }

    // Check existing database duplicate
    if (existingSystemKeys.has(normalizedPk)) {
      isExistingInSystem = true;
      warnings[pkField] = `Record "${pkStr}" already exists in the system database.`;
    }
  }

  // 2. Field-by-Field Validations
  for (const field of schema.fields) {
    if (field.key === pkField && errors[pkField]) continue;

    const val = data[field.key];
    const isMissing = val === undefined || val === null || String(val).trim() === '';

    // Required check
    if (field.required && isMissing) {
      errors[field.key] = `${field.label} is required.`;
      continue;
    }

    if (isMissing) continue;

    // Type validations
    if (field.type === 'number') {
      const numVal = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]+/g, ''));
      if (isNaN(numVal)) {
        errors[field.key] = `${field.label} must be a valid numeric value.`;
      } else if (field.key.toLowerCase().includes('rate') || field.key.toLowerCase().includes('price') || field.key.toLowerCase().includes('cost')) {
        if (numVal < 0) {
          errors[field.key] = `${field.label} cannot be negative.`;
        } else if (numVal === 0 && field.required) {
          warnings[field.key] = `${field.label} is zero. Verify if this is intentional.`;
        } else if (numVal > 100000000) {
          warnings[field.key] = `Unusually high amount (LKR ${numVal.toLocaleString()}). Confirm veracity.`;
        }
      } else if (field.key === 'quantity' && numVal <= 0) {
        errors[field.key] = 'Quantity must be greater than zero.';
      }
    } else if (field.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(String(val).trim())) {
        warnings[field.key] = 'Email address format looks irregular.';
      }
    } else if (field.type === 'phone') {
      const phoneClean = String(val).replace(/[\s\-()]+/g, '');
      if (phoneClean.length < 7) {
        warnings[field.key] = 'Phone number seems incomplete (less than 7 digits).';
      }
    } else if (field.type === 'date') {
      const d = new Date(String(val));
      if (isNaN(d.getTime())) {
        warnings[field.key] = 'Could not parse exact date. Format as YYYY-MM-DD.';
      }
    } else if (field.type === 'select' && field.options) {
      const matching = field.options.find(opt => opt.toLowerCase() === String(val).trim().toLowerCase());
      if (!matching) {
        warnings[field.key] = `Value "${val}" not in standard options (${field.options.join(', ')}).`;
      }
    }
  }

  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;

  return {
    status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid',
    errors,
    warnings,
    isDuplicateInFile,
    isExistingInSystem
  };
};

/**
 * Calculates overall batch veracity statistics.
 */
export const calculateValidationSummary = (
  rows: StagingRow[]
): ValidationSummary => {
  const total = rows.length;
  if (total === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      existingMatchCount: 0,
      veracityScore: 100
    };
  }

  let valid = 0;
  let warn = 0;
  let err = 0;
  let existing = 0;

  for (const r of rows) {
    if (r._status === 'valid') valid++;
    else if (r._status === 'warning') warn++;
    else if (r._status === 'error') err++;

    if (r._isExistingInSystem) existing++;
  }

  // Veracity formula: (valid * 1.0 + warnings * 0.75) / total * 100
  const score = Math.round(((valid * 1.0 + warn * 0.75) / total) * 100);

  return {
    totalRows: total,
    validCount: valid,
    warningCount: warn,
    errorCount: err,
    existingMatchCount: existing,
    veracityScore: score
  };
};

// ==========================================
// CONVERSION & COMMIT ROUTINES
// ==========================================

export interface CommitResult {
  totalProcessed: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  details: string;
}

export const convertStagingToItemTemplates = (
  rows: StagingRow[],
  existingTemplates: ItemTemplate[],
  resolution: ConflictResolutionMode
): { newTemplates: ItemTemplate[]; summary: CommitResult } => {
  const existingMap = new Map<string, ItemTemplate>();
  for (const it of existingTemplates) {
    const key = (it.productCode || it.id).toLowerCase();
    existingMap.set(key, it);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const resultTemplates = [...existingTemplates];

  for (const row of rows) {
    // Skip uncorrected errors
    if (row._status === 'error') {
      skipped++;
      continue;
    }

    const d = row.data;
    let code = String(d.productCode || d.id || '').trim();
    if (!code) {
      code = `ITM-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const key = code.toLowerCase();
    const existing = existingMap.get(key);

    if (existing) {
      if (resolution === 'INSERT_ONLY') {
        skipped++;
        continue;
      }

      if (resolution === 'RENAME_NEW') {
        code = `${code}-IMP`;
      }
    }

    const rate = typeof d.rate === 'number' ? d.rate : Number(String(d.rate).replace(/[^0-9.-]+/g, '')) || 0;
    const cost = typeof d.lastSupplierPrice === 'number' ? d.lastSupplierPrice : Number(String(d.lastSupplierPrice).replace(/[^0-9.-]+/g, '')) || Math.round(rate * 0.72);

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const pvcCode = `PV-${segment(5)}-${segment(5)}-${segment(5)}`;
    const barcode = `B-${segment(8)}`;

    const templateObj: ItemTemplate = {
      id: existing && resolution === 'UPSERT' ? existing.id : crypto.randomUUID(),
      name: String(d.name || 'Imported BOQ Item').trim(),
      productCode: code,
      code: code,
      category: String(d.category || 'Aluminium Works').trim(),
      subCategory: d.subCategory ? String(d.subCategory).trim() : undefined,
      productType: 'Product' as any,
      unit: (String(d.unit || 'm²').trim() as MeasurementUnit),
      rate,
      lastSupplierPrice: cost,
      description: d.description ? String(d.description).trim() : '',
      status: (d.status as any) || 'Active',
      pvcCode,
      barcode,
      tags: ['Imported', 'CSV/Excel Verified']
    };

    if (existing && resolution === 'UPSERT') {
      const idx = resultTemplates.findIndex(t => t.id === existing.id);
      if (idx >= 0) {
        resultTemplates[idx] = { ...existing, ...templateObj };
        updated++;
      }
    } else {
      resultTemplates.push(templateObj);
      existingMap.set(code.toLowerCase(), templateObj);
      inserted++;
    }
  }

  return {
    newTemplates: resultTemplates,
    summary: {
      totalProcessed: rows.length,
      insertedCount: inserted,
      updatedCount: updated,
      skippedCount: skipped,
      details: `Imported ${inserted} new items, updated ${updated} existing records, skipped ${skipped}.`
    }
  };
};

export const convertStagingToClients = (
  rows: StagingRow[],
  existingClients: Client[],
  resolution: ConflictResolutionMode
): { newClients: Client[]; summary: CommitResult } => {
  const existingMap = new Map<string, Client>();
  for (const c of existingClients) {
    existingMap.set(c.name.toLowerCase().trim(), c);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const result = [...existingClients];

  for (const row of rows) {
    if (row._status === 'error') {
      skipped++;
      continue;
    }

    const d = row.data;
    const name = String(d.name || '').trim();
    if (!name) {
      skipped++;
      continue;
    }

    const existing = existingMap.get(name.toLowerCase());
    if (existing) {
      if (resolution === 'INSERT_ONLY') {
        skipped++;
        continue;
      }
    }

    const creditLimit = typeof d.creditLimit === 'number' ? d.creditLimit : Number(String(d.creditLimit).replace(/[^0-9.-]+/g, '')) || 0;

    const clientObj: Client = {
      id: existing && resolution === 'UPSERT' ? existing.id : crypto.randomUUID(),
      name,
      cvcCode: d.cvcCode ? String(d.cvcCode).trim() : `CVC-${Date.now().toString().slice(-4)}`,
      phone: String(d.phone || '+94 11 000 0000').trim(),
      email: d.email ? String(d.email).trim() : undefined,
      address: String(d.address || 'Colombo, Sri Lanka').trim(),
      addresses: [],
      category: (d.category as any) || 'Main Contractor',
      source: 'Direct' as any,
      tier: 'Standard' as any,
      isCommHidden: false,
      isTaxExempt: false,
      creditLimit,
      paymentTerms: d.paymentTerms ? String(d.paymentTerms).trim() : '30 Days Net',
      status: (d.status as any) || 'Active',
      currency: 'LKR',
      language: 'en',
      sinceDate: new Date().toISOString().split('T')[0],
      hasSpecialPricing: false,
      contactPersons: []
    };

    if (existing && resolution === 'UPSERT') {
      const idx = result.findIndex(c => c.id === existing.id);
      if (idx >= 0) {
        result[idx] = { ...existing, ...clientObj };
        updated++;
      }
    } else {
      result.push(clientObj);
      existingMap.set(name.toLowerCase(), clientObj);
      inserted++;
    }
  }

  return {
    newClients: result,
    summary: {
      totalProcessed: rows.length,
      insertedCount: inserted,
      updatedCount: updated,
      skippedCount: skipped,
      details: `Imported ${inserted} new clients, updated ${updated} existing accounts.`
    }
  };
};

export const convertStagingToProjects = (
  rows: StagingRow[],
  existingProjects: Project[],
  existingClients: Client[],
  resolution: ConflictResolutionMode
): { newProjects: Project[]; summary: CommitResult } => {
  const existingMap = new Map<string, Project>();
  for (const p of existingProjects) {
    existingMap.set(p.projectName.toLowerCase().trim(), p);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const result = [...existingProjects];

  for (const row of rows) {
    if (row._status === 'error') {
      skipped++;
      continue;
    }

    const d = row.data;
    const name = String(d.projectName || '').trim();
    if (!name) {
      skipped++;
      continue;
    }

    const existing = existingMap.get(name.toLowerCase());
    if (existing && resolution === 'INSERT_ONLY') {
      skipped++;
      continue;
    }

    const clientName = String(d.clientName || 'General Client').trim();
    const matchedClient: Client = existingClients.find(c => c.name.toLowerCase() === clientName.toLowerCase()) || {
      id: crypto.randomUUID(),
      name: clientName,
      phone: '+94 11 000 0000',
      address: 'Colombo, Sri Lanka',
      addresses: [],
      category: 'General' as any,
      source: 'Direct' as any,
      tier: 'Standard' as any,
      isCommHidden: false,
      isTaxExempt: false,
      status: 'Active',
      creditLimit: 0,
      paymentTerms: '30 Days Net',
      currency: 'LKR',
      language: 'en',
      sinceDate: new Date().toISOString().split('T')[0],
      hasSpecialPricing: false,
      contactPersons: []
    };

    const totalValue = typeof d.totalValue === 'number' ? d.totalValue : Number(String(d.totalValue).replace(/[^0-9.-]+/g, '')) || 0;

    const projectObj: Project = {
      id: existing && resolution === 'UPSERT' ? existing.id : crypto.randomUUID(),
      quoteId: existing ? existing.quoteId : `Q-IMP-${Date.now().toString().slice(-4)}`,
      projectName: name,
      client: matchedClient,
      totalValue,
      status: (d.status as any) || 'In Progress',
      startDate: d.startDate ? String(d.startDate).trim() : new Date().toISOString().split('T')[0],
      classification: d.classification ? String(d.classification).trim() : 'Commercial',
      notes: d.notes ? String(d.notes).trim() : undefined,
      items: existing?.items || []
    };

    if (existing && resolution === 'UPSERT') {
      const idx = result.findIndex(p => p.id === existing.id);
      if (idx >= 0) {
        result[idx] = { ...existing, ...projectObj };
        updated++;
      }
    } else {
      result.push(projectObj);
      existingMap.set(name.toLowerCase(), projectObj);
      inserted++;
    }
  }

  return {
    newProjects: result,
    summary: {
      totalProcessed: rows.length,
      insertedCount: inserted,
      updatedCount: updated,
      skippedCount: skipped,
      details: `Imported ${inserted} new projects, updated ${updated} existing contracts.`
    }
  };
};

export const convertStagingToInvoices = (
  rows: StagingRow[],
  existingInvoices: Invoice[],
  existingClients: Client[],
  resolution: ConflictResolutionMode
): { newInvoices: Invoice[]; summary: CommitResult } => {
  const existingMap = new Map<string, Invoice>();
  for (const inv of existingInvoices) {
    existingMap.set(inv.invoiceNo.toLowerCase().trim(), inv);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const result = [...existingInvoices];

  for (const row of rows) {
    if (row._status === 'error') {
      skipped++;
      continue;
    }

    const d = row.data;
    const invNo = String(d.invoiceNumber || d.invoiceNo || '').trim();
    if (!invNo) {
      skipped++;
      continue;
    }

    const existing = existingMap.get(invNo.toLowerCase());
    if (existing && resolution === 'INSERT_ONLY') {
      skipped++;
      continue;
    }

    const clientName = String(d.clientName || 'Valued Client').trim();
    const matchedClient: Client = existingClients.find(c => c.name.toLowerCase() === clientName.toLowerCase()) || {
      id: crypto.randomUUID(),
      name: clientName,
      phone: '+94 11 000 0000',
      address: 'Colombo, Sri Lanka',
      addresses: [],
      category: 'General' as any,
      source: 'Direct' as any,
      tier: 'Standard' as any,
      isCommHidden: false,
      isTaxExempt: false,
      status: 'Active',
      creditLimit: 0,
      paymentTerms: '30 Days Net',
      currency: 'LKR',
      language: 'en',
      sinceDate: new Date().toISOString().split('T')[0],
      hasSpecialPricing: false,
      contactPersons: []
    };

    const total = typeof d.total === 'number' ? d.total : Number(String(d.total).replace(/[^0-9.-]+/g, '')) || 0;
    const subTotal = Math.round(total / 1.18);
    const taxTotal = Math.round(total - subTotal);

    const invoiceObj: Invoice = {
      id: existing && resolution === 'UPSERT' ? existing.id : crypto.randomUUID(),
      invoiceNo: invNo,
      type: InvoiceType.STANDARD,
      status: (d.status as any) || InvoiceStatus.PAID,
      date: d.issueDate ? String(d.issueDate).trim() : new Date().toISOString().split('T')[0],
      dueDate: d.dueDate ? String(d.dueDate).trim() : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      client: matchedClient,
      items: existing?.items || [],
      subTotal,
      discountTotal: 0,
      taxTotal,
      grandTotal: total,
      amountPaid: total,
      balanceDue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existing && resolution === 'UPSERT') {
      const idx = result.findIndex(i => i.id === existing.id);
      if (idx >= 0) {
        result[idx] = { ...existing, ...invoiceObj };
        updated++;
      }
    } else {
      result.push(invoiceObj);
      existingMap.set(invNo.toLowerCase(), invoiceObj);
      inserted++;
    }
  }

  return {
    newInvoices: result,
    summary: {
      totalProcessed: rows.length,
      insertedCount: inserted,
      updatedCount: updated,
      skippedCount: skipped,
      details: `Imported ${inserted} new invoices, updated ${updated} existing bills.`
    }
  };
};

export const convertStagingToPersonnel = (
  rows: StagingRow[],
  existingPersonnel: Personnel[],
  resolution: ConflictResolutionMode
): { newPersonnel: Personnel[]; summary: CommitResult } => {
  const existingMap = new Map<string, Personnel>();
  for (const p of existingPersonnel) {
    existingMap.set(p.name.toLowerCase().trim(), p);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const result = [...existingPersonnel];

  for (const row of rows) {
    if (row._status === 'error') {
      skipped++;
      continue;
    }

    const d = row.data;
    const name = String(d.name || '').trim();
    if (!name) {
      skipped++;
      continue;
    }

    const existing = existingMap.get(name.toLowerCase());
    if (existing && resolution === 'INSERT_ONLY') {
      skipped++;
      continue;
    }

    const hourlyRate = typeof d.hourlyRate === 'number' ? d.hourlyRate : Number(String(d.hourlyRate).replace(/[^0-9.-]+/g, '')) || 1200;

    const personObj: Personnel = {
      id: existing && resolution === 'UPSERT' ? existing.id : crypto.randomUUID(),
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      role: String(d.role || 'Fabricator').trim(),
      skillLevel: 'Senior',
      department: 'Fabrication & Site Operations',
      contact: d.phone ? String(d.phone).trim() : '+94 77 000 0000',
      hourlyRate,
      status: (d.status as any) || 'Available',
      skills: [],
      certifications: []
    };

    if (existing && resolution === 'UPSERT') {
      const idx = result.findIndex(p => p.id === existing.id);
      if (idx >= 0) {
        result[idx] = { ...existing, ...personObj };
        updated++;
      }
    } else {
      result.push(personObj);
      existingMap.set(name.toLowerCase(), personObj);
      inserted++;
    }
  }

  return {
    newPersonnel: result,
    summary: {
      totalProcessed: rows.length,
      insertedCount: inserted,
      updatedCount: updated,
      skippedCount: skipped,
      details: `Imported ${inserted} personnel records, updated ${updated}.`
    }
  };
};

export const convertStagingToEquipment = (
  rows: StagingRow[],
  existingEquipment: Equipment[],
  resolution: ConflictResolutionMode
): { newEquipment: Equipment[]; summary: CommitResult } => {
  const existingMap = new Map<string, Equipment>();
  for (const e of existingEquipment) {
    existingMap.set(e.name.toLowerCase().trim(), e);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const result = [...existingEquipment];

  for (const row of rows) {
    if (row._status === 'error') {
      skipped++;
      continue;
    }

    const d = row.data;
    const name = String(d.name || '').trim();
    if (!name) {
      skipped++;
      continue;
    }

    const existing = existingMap.get(name.toLowerCase());
    if (existing && resolution === 'INSERT_ONLY') {
      skipped++;
      continue;
    }

    const eqObj: Equipment = {
      id: existing && resolution === 'UPSERT' ? existing.id : crypto.randomUUID(),
      equipmentId: d.assetTag ? String(d.assetTag).trim() : `EQ-${Date.now().toString().slice(-4)}`,
      name,
      type: String(d.type || 'Fabrication Machine').trim(),
      serialNumber: d.assetTag ? String(d.assetTag).trim() : `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      location: 'Main Workshop & Yard',
      status: (d.status as any) || 'Available'
    };

    if (existing && resolution === 'UPSERT') {
      const idx = result.findIndex(e => e.id === existing.id);
      if (idx >= 0) {
        result[idx] = { ...existing, ...eqObj };
        updated++;
      }
    } else {
      result.push(eqObj);
      existingMap.set(name.toLowerCase(), eqObj);
      inserted++;
    }
  }

  return {
    newEquipment: result,
    summary: {
      totalProcessed: rows.length,
      insertedCount: inserted,
      updatedCount: updated,
      skippedCount: skipped,
      details: `Imported ${inserted} equipment assets, updated ${updated}.`
    }
  };
};

export const convertStagingToBOQLines = (
  rows: StagingRow[]
): { newBOQItems: BOQItem[]; summary: CommitResult } => {
  let inserted = 0;
  let skipped = 0;
  const items: BOQItem[] = [];

  for (const row of rows) {
    if (row._status === 'error') {
      skipped++;
      continue;
    }

    const d = row.data;
    const name = String(d.name || '').trim();
    if (!name) {
      skipped++;
      continue;
    }

    const qty = typeof d.quantity === 'number' ? d.quantity : Number(String(d.quantity).replace(/[^0-9.-]+/g, '')) || 1;
    const rate = typeof d.rate === 'number' ? d.rate : Number(String(d.rate).replace(/[^0-9.-]+/g, '')) || 0;

    const boqItem: BOQItem = {
      id: crypto.randomUUID(),
      no: String(items.length + 1),
      productCode: d.itemCode ? String(d.itemCode).trim() : undefined,
      name,
      description: name,
      itemType: 'Main',
      category: d.category ? String(d.category).trim() : 'Aluminium Works',
      unit: (String(d.unit || 'm²').trim() as MeasurementUnit),
      qty,
      rate,
      discountPercent: 0,
      amount: Math.round(qty * rate)
    };

    items.push(boqItem);
    inserted++;
  }

  return {
    newBOQItems: items,
    summary: {
      totalProcessed: rows.length,
      insertedCount: inserted,
      updatedCount: 0,
      skippedCount: skipped,
      details: `Generated ${inserted} BOQ items from spreadsheet batch.`
    }
  };
};
