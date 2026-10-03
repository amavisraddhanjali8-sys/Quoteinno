import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Copy, Check, Save, 
  Layers, Shield, Sliders, FileText, CheckCircle2, 
  Edit3, BookOpen, Plus, Trash2,
  RefreshCw, FileSpreadsheet, Eye, ListChecks, ArrowRight,
  CopyPlus, Maximize2, Minimize2, Barcode, ScanLine, X,
  Printer, RotateCcw
} from 'lucide-react';
import { ItemTemplate, ItemCategory } from '../../types';
import { cn } from '../../lib/utils';
import { ItemSelectDropdown } from './ItemSelectDropdown';
import { ItemEditModal } from './ItemEditModal';
import { ExportActions } from '../common/ExportActions';
import { exportSpecificationsCSV, exportSpecificationsPDF } from '../../services/dataExportService';
import { SmartSpecField } from './SmartSpecField';
import { generateAIBOQSpecification } from '../../services/geminiService';
import { BarcodeVisual } from './BarcodeVisual';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface SpecificationEngineProps {
  selectedItem?: ItemTemplate | null;
  allItems?: ItemTemplate[];
  categories?: ItemCategory[];
  onSelectItem?: (item: ItemTemplate) => void;
  onSaveItem?: (updatedItem: ItemTemplate) => void;
  onDeleteItem?: (itemId: string) => void;
}

interface SpecParameters {
  seriesName: string;
  alloyGrade: string;
  wallThickness: string;
  profileDepth: string;
  glassType: string;
  glassThickness: string;
  glassCoating: string;
  acousticRating: string;
  finishType: string;
  coatingThickness: string;
  ralColor: string;
  rollerStayType: string;
  lockType: string;
  hardwareGrade: string;
  gasketType: string;
  sealantType: string;
  applicableStandards: string[];
  scopeClause: string;
  warrantyPeriod: string;
}

export interface SectionCustomField {
  id: string;
  section: 'profile' | 'glazing' | 'finish' | 'hardware' | 'standards' | 'general';
  label: string;
  value: string;
}

// Curated industry options & descriptions for fields
const FIELD_OPTIONS = {
  seriesName: {
    description: 'Profile system series, sash configuration, and structural sightlines.',
    options: [
      'Alumex 1000 Series Architectural 2-Track',
      'Alumex 2000 Heavy Architectural 3-Track Patio',
      'Casement 50 Heavy Architectural Series',
      'ThermalBreak 75 Architectural Heavy Folding Door',
      'GrandEntrance 90 Monumental Insulated Pivot Door',
      'Unitized Facade 50/150 High-Rise Structural Glazing',
      'Frameless Architectural Glass Wall System',
      'Slimline Minimalist Sliding System (20mm sightline)',
      'Shopfront 45 Flush Glazed Architectural System',
      'SolarScreen 200 Aerofoil Louvre System',
      'SoundGuard Acoustic Drywall & Metal Stud Partition',
      'OptiView Architectural Frameless Glass Balustrade'
    ],
    suggestions: ['Alumex 1000', 'Alumex 2000', 'Casement 50', 'ThermalBreak 75', 'Frameless 12mm']
  },
  alloyGrade: {
    description: 'Extrusion aluminium metallurgy and temper rating conforming to ASTM B221 / SLS 1410.',
    options: [
      '6063-T6 Architectural Extrusion (ASTM B221)',
      '6063-T5 Standard Commercial Extrusion',
      '6061-T6 High-Strength Structural Alloy',
      '6082-T6 Marine-Grade Structural Alloy',
      'Grade 316 Marine Stainless Steel (ASTM A276)',
      'Grade 304 Architectural Stainless Steel',
      'Structural Cold-Rolled Galvanized Steel (ASTM C645)'
    ],
    suggestions: ['6063-T6 (ASTM B221)', '6063-T5', 'Grade 316 Marine SS', 'Grade 304 SS']
  },
  wallThickness: {
    description: 'Profile extrusion wall gauge ensuring structural deflection compliance.',
    options: [
      '1.2mm standard light commercial',
      '1.5mm architectural grade extrusion',
      '1.6mm (2.0mm structural sill track)',
      '1.8mm heavy architectural frame',
      '2.0mm structural frame (2.5mm reinforced sill)',
      '2.2mm heavy-gauge aluminium extrusion',
      '2.5mm - 3.5mm engineered structural sections',
      '3.0mm reinforced perimeter profiles'
    ],
    suggestions: ['1.2mm', '1.5mm', '1.6mm (2.0mm sill)', '2.0mm structural', '2.5mm heavy']
  },
  profileDepth: {
    description: 'Overall perimeter sub-frame depth, threshold channel, and perimeter clearance.',
    options: [
      '45mm Shopfront Flush Frame',
      '50mm Frame & Sash Depth',
      '75mm Frame Depth with thermal break',
      '90mm Monumental Leaf Depth',
      '100mm 2-Track Sub-frame',
      '150mm 3-Track Frame with Flyscreen Channel',
      '50mm sightline with 150mm structural mullion depth',
      '25mm x 35mm recessed perimeter pocket channel'
    ],
    suggestions: ['50mm', '75mm Thermal', '100mm (2-Track)', '150mm (3-Track)']
  },
  glassType: {
    description: 'Glazing safety float type, tempering standard, or insulated unit construction.',
    options: [
      'Monolithic Clear Tempered Safety Float',
      'High-Performance Laminated Safety Glass',
      'Insulated Glass Unit (IGU) Double Glazed Acoustic',
      'Double Glazed Structural Silicone Glazed (SSG)',
      'Low-Iron Extra Clear (Optiwhite) Tempered',
      'Reflective Solar Control Tempered Glass',
      'Multi-layer intumescent gel fire resistant glass',
      'Frosted / Acid-Etched Privacy Tempered Glass'
    ],
    suggestions: ['Monolithic Tempered', 'Laminated Safety Glass', 'Double Glazed IGU', 'Low-Iron Optiwhite']
  },
  glassThickness: {
    description: 'Nominal total glass or pane configuration thickness in millimeters.',
    options: [
      '5mm Clear Toughened',
      '6mm High-Tensile Tempered Glass',
      '8mm Heavy Tempered Float Glass',
      '10mm Architectural Clear Tempered',
      '12mm Structural Frameless Tempered Glass',
      '15mm Heavy Architectural Balustrade Tempered',
      '8.38mm Laminated Safety Glass (4+0.38+4mm)',
      '10.76mm Acoustic Laminated (5+0.76+5mm)',
      '12.76mm Heavy Structural Laminated (6+0.76+6mm)',
      '24mm Double Glazed (6mm Tempered + 12mm Argon + 6mm Low-E)',
      '28mm High-Performance Double Glazed Unit'
    ],
    suggestions: ['5mm Clear', '6mm Tempered', '8.38mm Lam', '12mm Tempered', '24mm DGU (6+12A+6)']
  },
  glassCoating: {
    description: 'Solar heat gain coefficient (SHGC) and UV protection film or soft coating.',
    options: [
      'Clear / Anti-UV Pyrolytic Hard Coat',
      'Low-E Soft Coat (U-value 1.4 W/m²K)',
      'Solar Control Low-E Coating (SHGC 0.38)',
      'Solarban 60 High Performance Solar Control',
      'Euro Grey Body-Tinted Solar Absorbing',
      'Dark Blue Reflective Solar Coating',
      'Ceramic Fritted Architectural Pattern',
      'N/A (Standard Clear Float)'
    ],
    suggestions: ['Clear / Anti-UV', 'Low-E Soft Coat', 'Solar Control (SHGC 0.38)', 'Euro Grey Tint']
  },
  acousticRating: {
    description: 'Sound Transmission Class (STC) or weighted sound reduction index (Rw).',
    options: [
      'STC 28 dB Standard Glazing',
      'STC 29 dB (5mm Monolithic Float)',
      'STC 32 dB (6mm Toughened Glass)',
      'STC 34 dB Sound Reduction (Acoustic PVB Laminated)',
      'STC 38 dB Acoustic Reduction (Double Glazed)',
      'STC 42 dB High Acoustic Barrier (Dual Laminate IGU)',
      'STC 45 dB Studio Grade Sound Isolation'
    ],
    suggestions: ['STC 29 dB', 'STC 32 dB', 'STC 34 dB (Acoustic Lam)', 'STC 38 dB (Double Glazed)']
  },
  finishType: {
    description: 'Surface architectural coating process conforming to Qualicoat Class 2 / BS 3987.',
    options: [
      'Electrostatic Polyester Powder Coated (Qualicoat Class 2)',
      'Super-durable Architectural Powder Coating (AAMA 2604)',
      'Fluoropolymer PVDF 3-Coat Architectural Coating (AAMA 2605)',
      'Architectural Anodized (BS 3987 Class AA25 - 25 Microns)',
      'Architectural Anodized (BS 3987 Class AA15 - 15 Microns)',
      'Wood-Grain Sublimated Architectural Thermal Transfer',
      'Mill Finish (Uncoated Raw Aluminium Extrusion)'
    ],
    suggestions: ['Powder Coated (Qualicoat Class 2)', 'Anodized AA25 Satin', 'Super-durable AAMA 2604', 'PVDF 3-Coat']
  },
  coatingThickness: {
    description: 'Minimum micron dry film thickness for coastal weathering resistance.',
    options: [
      '60 - 80 microns',
      '70 - 90 microns film thickness',
      '80 - 100 microns heavy architectural',
      '25 microns minimum film thickness (AA25 Anodized)',
      '15 microns minimum film thickness (AA15 Anodized)',
      '35 - 45 microns (PVDF 3-coat total system)'
    ],
    suggestions: ['60 - 80 microns', '70 - 90 microns', '25 microns (AA25)', '80 - 100 microns']
  },
  ralColor: {
    description: 'Standard RAL color reference code, surface texture, and gloss percentage level.',
    options: [
      'RAL 7016 Anthracite Grey (Matte 30% gloss)',
      'RAL 9005 Jet Black Fine Texture',
      'RAL 9016 Traffic White (Gloss 80%)',
      'RAL 9010 Pure White (Matte 30% gloss)',
      'RAL 7021 Black Grey Architectural Satin',
      'RAL 7035 Light Grey Industrial Smooth',
      'Natural Anodized Silver Satin (AA25)',
      'Dark Bronze Architectural Anodized (AA25)',
      'Champagne Gold Satin Anodized (AA25)',
      'Teak Wood Grain Textured Finish'
    ],
    suggestions: ['RAL 7016 Anthracite Grey', 'RAL 9005 Jet Black', 'RAL 9016 Traffic White', 'Natural Anodized Silver']
  },
  rollerStayType: {
    description: 'Operable running carriages, heavy-duty tandem ball-bearings, or friction stays.',
    options: [
      'Heavy-duty tandem stainless steel ball-bearing rollers (90kg/sash)',
      'Heavy-duty quad stainless steel bogie rollers tested to 200kg per sash',
      'Stainless Steel 304 4-bar heavy-duty friction stays (rated 120kg)',
      'Stainless Steel 316 Concealed Heavy Friction Hinges',
      'Heavy-duty top-hung concealed carriage bogies with bottom guide track',
      'Concealed floor-spring pivot hydraulic mechanism with 90-degree hold-open',
      'N/A (Fixed Architectural Panel / Non-operable)'
    ],
    suggestions: ['Tandem SS Rollers (90kg)', 'Quad Bogie Rollers (200kg)', 'SS 304 Friction Stays', 'Floor-Spring Pivot']
  },
  lockType: {
    description: 'Architectural locking gear, multi-point transmission bars, and cylinder security.',
    options: [
      'Flush architectural recessed D-pull with multi-point stainless mortise lock',
      'Concealed perimeter 4-point claw locking mechanism with Euro-profile key cylinder',
      'Continuous multi-point perimeter espagnolette locking transmission',
      'Heavy-duty twin-point bi-fold shootbolt lock with key release handle',
      'Heavy-duty architectural pull handle (1200mm Grade 316) with roller latch',
      'Cylinder deadbolt floor lock with dust-proof brass floor strike socket',
      'Touch-latch stainless magnetic catches',
      'N/A (Non-locking / Fixed)'
    ],
    suggestions: ['Flush D-Pull Multi-point', '4-Point Claw Lock', 'Espagnolette Multi-point', '1200mm SS Pull Handle']
  },
  hardwareGrade: {
    description: 'Fastener metallurgy, isolation pads, and anti-galvanic corrosion specs.',
    options: [
      'Grade 304 Stainless Steel Fixings & Anti-lift blocks',
      'Marine-grade Grade 316 Stainless Steel running tracks and fixings',
      'Grade 304 Stainless Steel screws & anti-galvanic PVC isolation gaskets',
      'Class 4 Anti-corrosion Coated Structural Tek Screws (AS 3566)',
      'Hot-dip galvanized structural bracketry with Grade 316 perimeter anchors'
    ],
    suggestions: ['Grade 304 Stainless Steel', 'Marine Grade 316 SS', 'Anti-galvanic Isolation']
  },
  gasketType: {
    description: 'Continuous UV-stabilized captive perimeter gaskets and woolpile.',
    options: [
      'Dual-extruded continuous EPDM seals + high-density siliconized fin woolpile',
      'Co-extruded santoprene double fin weatherseals and interlocking PVC baffles',
      'Twin vulcanized EPDM compression perimeter gaskets',
      'Quadruple perimeter EPDM bubble gaskets with vulcanized 90-degree molded corners',
      'Dry-glazing UV-resistant continuous captive EPDM rubber wedge gaskets',
      'Silicone setting blocks with captive dual-density weather seals'
    ],
    suggestions: ['Dual EPDM + Fin Woolpile', 'Santoprene Double Fin', 'Twin Vulcanized EPDM']
  },
  sealantType: {
    description: 'Perimeter structural silicone sealant and closed-cell backing rod joint seal.',
    options: [
      'Dow Corning 795 neutral-cure structural silicone perimeter joint sealant',
      'Dow Corning 791 silicone structural perimeter weather sealant',
      'Sikasil WS-305 neutral weather silicone with closed-cell backing rod',
      'Optically clear structural silicone at perimeter channel joints',
      'High-modulus polyurethane perimeter structural caulking',
      'Nullifire M701 fire-stopping elastomeric perimeter acrylic sealant'
    ],
    suggestions: ['Dow Corning 795', 'Sikasil WS-305', 'DC 791 Weatherproofing', 'Polyurethane Caulking']
  },
  scopeClause: {
    description: 'Tender scope description: supply, fabrication, scaffolding, hoisting, and sealing.',
    options: [
      'Supply, fabricate, deliver to site, hoist, and install 2-track sliding window assemblies with all perimeter structural anchors, flashings, weatherproofing, and final degreasing.',
      'Supply and complete installation of heavy-duty 3-track sliding patio assemblies including integrated floor threshold drainage trays, stainless guide rails, and typhoon-grade anti-blowoff clips.',
      'Design, supply, deliver, hoist, and install acoustic architectural casement windows complete with precision laser alignment, continuous perimeter expansion joint sealing, and water penetration testing.',
      'Engineering design, supply, and precision certified installation of bi-folding door assemblies including structural lintel deflection bracketry, flush weather-rated threshold sub-drainage, and full perimeter airtightness commissioning.',
      'Full supply and turnkey installation of monumental pivot entrance assembly including ground core drilling, concealed hydraulic unit embedding, electronic access interfacing, and balance calibration.',
      'Comprehensive shop drawing design, mock-up test chamber validation, unitized panel factory fabrication, site crane rigging, structural bracket slab embedding, and dynamic hose water spray testing.',
      'Full-height interior frameless tempered glass partition assembly including precision ceiling/floor channel recessed anchoring, hydraulic floor pivot door installation, and safety warning manifestation tape.'
    ],
    suggestions: ['Supply & Install Standard', 'Heavy Patio with Drainage', 'Acoustic Laser Aligned', 'Turnkey Facade Assembly']
  },
  warrantyPeriod: {
    description: 'Contractual performance warranty duration for structural frame, finish, and hardware.',
    options: [
      '10 Years Structural Frame & Finish, 5 Years Rollers & Locking Hardware',
      '12 Years Structural Frame & Coating, 7 Years Running Hardware',
      '10 Years Structural Frame, 10 Years Glazing Seal Integrity, 5 Years Hardware',
      '15 Years Thermal Profile Warranty, 10 Years Hardware Mechanism',
      '15 Years Architectural Leaf Warranty, 10 Years Pivot Mechanism',
      '20 Years Structural Integrity & Sealant Bond, 15 Years Glass IGU Seals',
      '10 Years Glass Integrity, 5 Years Hydraulic Floor Springs',
      '5 Years Comprehensive Commercial Warranty'
    ],
    suggestions: ['10 Yrs Frame / 5 Yrs Hardware', '12 Yrs Frame / 7 Yrs Hardware', '15 Yrs Profile / 10 Yrs Mech', '20 Yrs Structural']
  }
};

const STANDARD_OPTIONS_PRESETS = [
  'BS 8213-4:2016 (Windows and doors installation)',
  'BS 6262 (Code of practice for glazing in buildings)',
  'BS 6375-1:2015 (Weather tightness: air permeability & water resistance)',
  'BS 6375-2:2015 (Operation & strength characteristics)',
  'SLS 1410 (Specification for aluminium alloy windows and doors)',
  'ASTM B221 (Aluminium-alloy extruded bars, rods, wire, shapes)',
  'ASTM E283 (Rate of air leakage through exterior windows/curtain walls)',
  'ASTM E330 (Structural performance under static air pressure difference)',
  'ASTM E331 (Water penetration by uniform static air pressure)',
  'AAMA 2604 (Voluntary specification for high performance coatings)',
  'AAMA 2605 (Superior performing organic coatings on aluminium)',
  'BS 3987 (Specification for anodic oxidation coatings on aluminium)',
  'Qualicoat Class 2 Architectural Powder Coating Specification',
  'BS 6180:2011 (Barriers in and about buildings)',
  'BS 476 Part 22 / BS EN 1634-1 (Fire resistance)',
  'PAS 24 (Enhanced security performance requirements)'
];

const PRESET_TEMPLATES: Record<string, Partial<SpecParameters>> = {
  'Aluminium Sliding Window (2-Track)': {
    seriesName: 'Alumex 1000 Series Architectural 2-Track',
    alloyGrade: '6063-T6 Architectural Extrusion (ASTM B221)',
    wallThickness: '1.6mm (2.0mm structural sill track)',
    profileDepth: '100mm 2-Track Frame',
    glassType: 'Monolithic Clear Tempered Safety Float',
    glassThickness: '5mm Clear Toughened',
    glassCoating: 'Clear / Anti-UV',
    acousticRating: 'STC 29 dB',
    finishType: 'Electrostatic Polyester Powder Coated (Qualicoat Class 2)',
    coatingThickness: '60 - 80 microns',
    ralColor: 'RAL 7016 Anthracite Grey (Matte 30% gloss)',
    rollerStayType: 'Heavy-duty tandem stainless steel ball-bearing rollers (90kg/sash)',
    lockType: 'Flush architectural recessed D-pull with multi-point stainless mortise lock',
    hardwareGrade: 'Grade 304 Stainless Steel Fixings & Anti-lift blocks',
    gasketType: 'Dual-extruded continuous EPDM seals + high-density siliconized fin woolpile',
    sealantType: 'Dow Corning 795 neutral-cure structural silicone perimeter joint sealant',
    applicableStandards: ['BS 8213-4:2016', 'BS 6262', 'BS 6375-1:2015', 'SLS 1410', 'ASTM E283'],
    scopeClause: 'Supply, fabricate, deliver to site, hoist, and install 2-track sliding window assemblies with all perimeter structural anchors, flashings, weatherproofing, and final degreasing.',
    warrantyPeriod: '10 Years Structural Frame & Finish, 5 Years Rollers & Locking Hardware'
  },
  'Aluminium Sliding Window (3-Track Heavy Patio)': {
    seriesName: 'Alumex 2000 Heavy Architectural 3-Track Patio System',
    alloyGrade: '6063-T6 Structural Aluminium Extrusion (SLS 1410 / ASTM B221)',
    wallThickness: '2.0mm structural frame (2.5mm reinforced sill track)',
    profileDepth: '150mm 3-Track Sub-frame with integrated perimeter flyscreen channel',
    glassType: 'High-Performance Laminated Safety Glass',
    glassThickness: '8.38mm Clear Laminated (4mm Clear + 0.38mm PVB + 4mm Clear)',
    glassCoating: 'Solar Control Low-E Coating (SHGC 0.38)',
    acousticRating: 'STC 34 dB Sound Reduction',
    finishType: 'Super-durable Architectural Powder Coating (AAMA 2604)',
    coatingThickness: '70 - 90 microns film thickness',
    ralColor: 'RAL 9005 Jet Black Fine Texture',
    rollerStayType: 'Heavy-duty quad stainless steel bogie rollers tested to 200kg per sash',
    lockType: 'Concealed perimeter 4-point claw locking mechanism with Euro-profile key cylinder',
    hardwareGrade: 'Marine-grade Grade 316 Stainless Steel running tracks and fixings',
    gasketType: 'Co-extruded santoprene double fin weatherseals and interlocking PVC baffles',
    sealantType: 'Sikasil WS-305 neutral weather silicone with closed-cell backing rod',
    applicableStandards: ['BS 6375-1:2015', 'SLS 1410', 'BS 6262 Glazing'],
    scopeClause: 'Supply and complete installation of heavy-duty 3-track sliding patio assemblies including integrated floor threshold drainage trays, stainless guide rails, and typhoon-grade anti-blowoff clips.',
    warrantyPeriod: '12 Years Structural Frame & Coating, 7 Years Running Hardware'
  },
  'Aluminium Casement Window (Acoustic)': {
    seriesName: 'Casement 50 Heavy Architectural Series',
    alloyGrade: '6063-T6 Architectural Grade (SLS 1410)',
    wallThickness: '2.0mm uniform wall thickness',
    profileDepth: '50mm Frame & Sash Depth',
    glassType: 'Insulated Glass Unit (IGU) Double Glazed Acoustic',
    glassThickness: '6mm Clear Tempered + 12mm Argon Space + 6mm Low-E Tempered',
    glassCoating: 'Low-E Soft Coat (U-value 1.4 W/m²K)',
    acousticRating: 'STC 38 dB Acoustic Reduction',
    finishType: 'Architectural Anodized (BS 3987 Class AA25)',
    coatingThickness: '25 microns minimum film thickness',
    ralColor: 'Natural Anodized Silver Satin (AA25)',
    rollerStayType: 'Stainless Steel 304 4-bar heavy-duty friction stays (rated 120kg)',
    lockType: 'Continuous multi-point perimeter espagnolette locking transmission',
    hardwareGrade: 'Grade 304 Stainless Steel screws & anti-galvanic PVC isolation gaskets',
    gasketType: 'Twin vulcanized EPDM compression perimeter gaskets',
    sealantType: 'Sikasil WS-305 high-performance weatherproofing silicone',
    applicableStandards: ['BS 6375 Parts 1 & 2', 'BS 6262', 'ASTM E330 Structural Performance', 'SLS 1410'],
    scopeClause: 'Design, supply, deliver, hoist, and install acoustic architectural casement windows complete with precision laser alignment, continuous perimeter expansion joint sealing, and water penetration field testing.',
    warrantyPeriod: '10 Years Structural Frame, 10 Years Glazing Seal Integrity, 5 Years Hardware'
  },
  'Aluminium Heavy Bi-Folding Door System': {
    seriesName: 'ThermalBreak 75 Architectural Heavy Folding Door System',
    alloyGrade: '6063-T6 Thermal-break Polyamide 24mm Structural Profiles',
    wallThickness: '2.2mm heavy-gauge aluminium extrusion',
    profileDepth: '75mm Frame Depth with flush bottom threshold option',
    glassType: 'High-Impact Double Glazed Low-E Toughened Units',
    glassThickness: '6mm Sunguard Solar + 16mm Warm-edge Spacer + 6mm Clear Toughened',
    glassCoating: 'Solar Control Low-E Soft Coat',
    acousticRating: 'STC 38 dB Acoustic Reduction',
    finishType: 'Super-durable Architectural Powder Coating (AAMA 2604)',
    coatingThickness: '70 - 90 microns',
    ralColor: 'RAL 7021 Black Grey Architectural Satin',
    rollerStayType: 'Heavy-duty top-hung concealed carriage bogies with bottom guide track',
    lockType: 'Heavy-duty twin-point bi-fold shootbolt lock with key release handle',
    hardwareGrade: 'Marine-grade Grade 316 Stainless Steel hinges & guide tracks',
    gasketType: 'Quadruple perimeter EPDM bubble gaskets with vulcanized 90-degree molded corners',
    sealantType: 'Dow Corning 795 neutral-cure structural silicone perimeter joint sealant',
    applicableStandards: ['BS 6375-1:2015', 'PAS 24 Security Standard', 'SLS 1410', 'AAMA 2604'],
    scopeClause: 'Engineering design, supply, and precision certified installation of bi-folding door assemblies including structural lintel deflection bracketry, flush weather-rated threshold sub-drainage, and full perimeter airtightness commissioning.',
    warrantyPeriod: '15 Years Thermal Profile Warranty, 10 Years Hardware Mechanism'
  },
  'Frameless Glass Partition (12mm)': {
    seriesName: 'Frameless Architectural Glass Wall System',
    alloyGrade: 'Grade 304 Architectural Stainless Steel / Heavy Aluminium Pocket Channel',
    wallThickness: '3.0mm reinforced perimeter pocket profile',
    profileDepth: '25mm x 35mm recessed perimeter pocket channel',
    glassType: 'Monolithic Clear Tempered Safety Float',
    glassThickness: '12mm Structural Frameless Tempered Glass',
    glassCoating: 'Clear / Anti-UV (Ceramic safety manifestation lines)',
    acousticRating: 'STC 34 dB Sound Reduction',
    finishType: 'Architectural Anodized (BS 3987 Class AA25)',
    coatingThickness: '25 microns minimum film thickness',
    ralColor: 'Natural Anodized Silver Satin (AA25)',
    rollerStayType: 'Concealed floor-spring pivot hydraulic mechanism with 90-degree hold-open',
    lockType: 'Cylinder deadbolt floor lock with dust-proof brass floor strike socket',
    hardwareGrade: 'Grade 316 Marine Stainless Steel patch fittings & D-handles',
    gasketType: 'Dry-glazing UV-resistant continuous captive EPDM rubber wedge gaskets',
    sealantType: 'Optically clear structural silicone at perimeter channel joints',
    applicableStandards: ['BS 6262 Glazing Standard', 'BS 6180 Barriers in Buildings', 'SLS 1410'],
    scopeClause: 'Full-height interior frameless tempered glass partition assembly including precision ceiling/floor channel recessed anchoring, hydraulic floor pivot door installation, and safety warning manifestation tape.',
    warrantyPeriod: '10 Years Glass Integrity, 5 Years Hydraulic Floor Springs'
  }
};

export const SpecificationEngine: React.FC<SpecificationEngineProps> = ({
  selectedItem: initialItem,
  allItems = [],
  categories = [],
  onSelectItem,
  onSaveItem,
  onDeleteItem
}) => {
  // Master Active Item state
  const [activeItem, setActiveItem] = useState<ItemTemplate | null>(initialItem || (allItems.length > 0 ? allItems[0] : null));

  // Full Screen View Toggle (User requested full screen mode and fit to screen)
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Barcode Scanner Modal State
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isBarcodeViewOpen, setIsBarcodeViewOpen] = useState(false);

  // Copy feedback state
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

  // Item Modal state for Add/Edit
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalMode, setItemModalMode] = useState<'create' | 'edit'>('edit');
  const [itemToEdit, setItemToEdit] = useState<ItemTemplate | null>(null);
  
  // Output mode tabs
  const [outputTab, setOutputTab] = useState<'BOQ_LINE' | 'TENDER_CLAUSE' | 'DUAL_VIEW'>('BOQ_LINE');
  
  // Custom manual edit states
  const [isCustomEditingBOQ, setIsCustomEditingBOQ] = useState(false);
  const [customBOQText, setCustomBOQText] = useState('');
  const [isCustomEditingClause, setIsCustomEditingClause] = useState(false);
  const [customClauseText, setCustomClauseText] = useState('');

  // AI Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTone, setAiTone] = useState<'standard' | 'fidic' | 'luxury' | 'value_engineered' | 'marine_coastal'>('standard');
  const [generationMode, setGenerationMode] = useState<'auto' | 'ai'>('auto');
  const [aiHighlights, setAiHighlights] = useState<string[]>([]);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Custom Specification Details (Per Section)
  const [customFields, setCustomFields] = useState<SectionCustomField[]>([]);
  const [addingToSection, setAddingToSection] = useState<'profile' | 'glazing' | 'finish' | 'hardware' | 'standards' | 'general' | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // Standards Manager
  const [customStandardInput, setCustomStandardInput] = useState('');
  const [editingStandardIdx, setEditingStandardIdx] = useState<number | null>(null);
  const [editingStandardText, setEditingStandardText] = useState('');

  // Technical Parameter State
  const [params, setParams] = useState<SpecParameters>({
    seriesName: 'Alumex 1000 Series Architectural 2-Track',
    alloyGrade: '6063-T6 Architectural Extrusion (ASTM B221)',
    wallThickness: '1.6mm (2.0mm structural sill track)',
    profileDepth: '100mm 2-Track Frame',
    glassType: 'Monolithic Clear Tempered Safety Float',
    glassThickness: '5mm Clear Toughened',
    glassCoating: 'Clear / Anti-UV',
    acousticRating: 'STC 29 dB',
    finishType: 'Electrostatic Polyester Powder Coated (Qualicoat Class 2)',
    coatingThickness: '60 - 80 microns',
    ralColor: 'RAL 7016 Anthracite Grey (Matte 30% gloss)',
    rollerStayType: 'Heavy-duty tandem stainless steel ball-bearing rollers (90kg/sash)',
    lockType: 'Flush architectural recessed D-pull with multi-point stainless mortise lock',
    hardwareGrade: 'Grade 304 Stainless Steel Fixings & Anti-lift blocks',
    gasketType: 'Dual-extruded continuous EPDM seals + high-density siliconized fin woolpile',
    sealantType: 'Dow Corning 795 neutral-cure structural silicone perimeter joint sealant',
    applicableStandards: ['BS 8213-4:2016', 'BS 6262', 'BS 6375-1:2015', 'SLS 1410', 'ASTM E283'],
    scopeClause: 'Supply, fabricate, deliver to site, hoist, and install 2-track sliding window assemblies with all perimeter structural anchors, flashings, weatherproofing, and final degreasing.',
    warrantyPeriod: '10 Years Structural Frame & Finish, 5 Years Rollers & Locking Hardware'
  });

  // Primary key code helper
  const primaryKeyCode = activeItem?.productCode || activeItem?.code || activeItem?.id || 'BOQ-ITEM-001';

  // Handle ESC key for full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Sync active item when initialItem changes
  useEffect(() => {
    if (initialItem) {
      setActiveItem(initialItem);
    }
  }, [initialItem]);

  // When active item changes, load its technical spec or match preset
  useEffect(() => {
    if (!activeItem) return;

    if (activeItem.description) {
      setCustomBOQText(activeItem.description);
    }
    if (activeItem.detailedSpecification) {
      setCustomClauseText(activeItem.detailedSpecification);
    }

    const itemName = (activeItem.name || '').toLowerCase();
    const itemCat = (activeItem.category || '').toLowerCase();
    
    let matchedPresetKey: string | undefined;
    if (itemName.includes('bi-fold') || itemName.includes('folding') || itemName.includes('bifold')) {
      matchedPresetKey = 'Aluminium Heavy Bi-Folding Door System';
    } else if (itemName.includes('partition') || itemName.includes('frameless') || itemCat.includes('partition')) {
      matchedPresetKey = 'Frameless Glass Partition (12mm)';
    } else if (itemName.includes('casement') || itemName.includes('acoustic') || itemCat.includes('casement')) {
      matchedPresetKey = 'Aluminium Casement Window (Acoustic)';
    } else if (itemName.includes('3-track') || itemName.includes('patio')) {
      matchedPresetKey = 'Aluminium Sliding Window (3-Track Heavy Patio)';
    } else if (itemName.includes('sliding') || itemCat.includes('window')) {
      matchedPresetKey = 'Aluminium Sliding Window (2-Track)';
    } else {
      matchedPresetKey = Object.keys(PRESET_TEMPLATES).find(k => 
        itemName.includes(k.toLowerCase().split(' ')[0])
      );
    }

    if (matchedPresetKey && PRESET_TEMPLATES[matchedPresetKey]) {
      setParams(prev => ({
        ...prev,
        ...PRESET_TEMPLATES[matchedPresetKey]
      }));
    } else if (activeItem.technicalSpecification) {
      const ts = activeItem.technicalSpecification;
      setParams(prev => ({
        ...prev,
        seriesName: ts.profileSystem || prev.seriesName,
        alloyGrade: ts.aluminiumGrade || prev.alloyGrade,
        finishType: ts.surfaceFinish || prev.finishType,
        glassType: ts.glazingType || prev.glassType,
        glassThickness: ts.glassThickness || prev.glassThickness,
        warrantyPeriod: ts.warrantyProduct ? `${ts.warrantyProduct} Product Warranty` : prev.warrantyPeriod
      }));
    }
  }, [activeItem]);

  // Automatic Rule-Based BOQ Line Item Description
  const autoGeneratedBOQDescription = useMemo(() => {
    const itemName = activeItem?.name || 'Architectural Aluminium Component';
    const parts: string[] = [];
    
    parts.push(`Supply, fabricate, deliver, hoist, and install ${itemName.toLowerCase()}, constructed from ${params.seriesName} (${params.alloyGrade}) with ${params.wallThickness} wall thickness and ${params.profileDepth} configuration.`);
    
    parts.push(`Surface finished with ${params.finishType} in ${params.ralColor} with minimum film thickness of ${params.coatingThickness}.`);
    
    if (params.glassType && params.glassType !== 'N/A') {
      parts.push(`Glazed with ${params.glassThickness} ${params.glassType}${params.glassCoating && params.glassCoating !== 'N/A' ? ` (${params.glassCoating})` : ''}, acoustic rating ${params.acousticRating}, fitted with ${params.gasketType}.`);
    }

    parts.push(`Fitted with ${params.rollerStayType}, ${params.lockType}, and all exposed/concealed fixings in ${params.hardwareGrade}.`);
    parts.push(`Perimeter expansion joints sealed with ${params.sealantType}.`);

    if (customFields.length > 0) {
      const customSummary = customFields.map(cf => `${cf.label}: ${cf.value}`).join('; ');
      parts.push(`Additional parameters: ${customSummary}.`);
    }

    parts.push(`All fabricated and erected strictly in accordance with approved shop drawings and ${params.applicableStandards.slice(0, 3).join(', ')}. Complete with manufacturer and installer warranty of ${params.warrantyPeriod}.`);

    return parts.join(' ');
  }, [activeItem, params, customFields]);

  // Automatic Rule-Based Full Tender Specification Clause
  const autoGeneratedTenderClause = useMemo(() => {
    const itemName = activeItem?.name || 'Architectural BOQ Item';
    const itemCode = primaryKeyCode;

    let clause = `================================================================================
SECTION: TECHNICAL BILL OF QUANTITIES SPECIFICATION
ITEM CODE (PRIMARY KEY): ${itemCode} | ${itemName.toUpperCase()}
BARCODE REF: ${activeItem?.barcode || itemCode}
================================================================================

1.0 SCOPE OF WORKS
${params.scopeClause}

2.0 PROFILE SYSTEM, ALLOY & MECHANICAL SPECIFICATIONS
- Profile Series: ${params.seriesName}
- Extrusion Alloy & Temper: ${params.alloyGrade}
- Frame Depth & Configuration: ${params.profileDepth}
- Profile Wall Thickness: Minimum ${params.wallThickness}
- Corner Jointing: Precision 45-degree mechanically crimped / cleated corners with stainless steel alignment corner keys and continuous internal polyurethane sealing compound.

3.0 SURFACE TREATMENT & CORROSION PROTECTION
- Finish Standard: ${params.finishType}
- Minimum Film Thickness: ${params.coatingThickness}
- Color & Gloss Level: ${params.ralColor}
- Performance Guarantee: Conforming to Qualicoat Class 2 / BS 3987 with resistance against chalking, fading, peeling, and coastal marine corrosion.

4.0 GLAZING SYSTEM & ACOUSTIC PERFORMANCE
- Glazing Specification: ${params.glassType} (${params.glassThickness})
- Solar / Low-E Coating: ${params.glassCoating}
- Acoustic Attenuation Rating: ${params.acousticRating}
- Glazing Channels & Setting: Neoprene setting blocks at quarter points with dry-glaze UV-stabilized continuous EPDM captive gaskets.

5.0 HARDWARE, LOCKING GEAR & MECHANICAL ACCESSORIES
- Operable Running Gear: ${params.rollerStayType}
- Locking Mechanism: ${params.lockType}
- Fasteners & Anti-Lift: All exposed and concealed fixings shall be ${params.hardwareGrade}. Anti-lift security nylon blocks fitted at top head rail.

6.0 WEATHERPROOFING, SEALS & GASKETS
- Weatherseals: ${params.gasketType}
- Perimeter Caulking: ${params.sealantType} applied over closed-cell polyethylene foam backing rod.

7.0 CODES, STANDARDS & COMPLIANCE
All fabrication, assembly, and erection shall comply strictly with:
${params.applicableStandards.map(std => `- ${std}`).join('\n')}`;

    if (customFields.length > 0) {
      clause += `\n\n8.0 SPECIAL PROJECT REQUIREMENTS & ENGINEERED PARAMETERS\n` +
        customFields.map(cf => `- [${cf.section.toUpperCase()}] ${cf.label}: ${cf.value}`).join('\n');
    }

    const warrantySectionNum = customFields.length > 0 ? '9.0' : '8.0';
    clause += `\n\n${warrantySectionNum} COMPREHENSIVE WARRANTY & PERFORMANCE GUARANTEE
- ${params.warrantyPeriod}
Manufacturer and fabricator joint warranty certificate to be submitted upon practical completion.
================================================================================`;

    return clause;
  }, [activeItem, primaryKeyCode, params, customFields]);

  // Active texts based on manual edit or auto
  const activeBOQText = isCustomEditingBOQ ? customBOQText : autoGeneratedBOQDescription;
  const activeClauseText = isCustomEditingClause ? customClauseText : autoGeneratedTenderClause;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // AI Generation Action
  const handleGenerateAI = async () => {
    if (!activeItem) return;
    setIsGeneratingAI(true);
    setStatusNotification('Generating engineering specification with AI...');
    try {
      const result = await generateAIBOQSpecification({
        itemName: activeItem.name || 'Architectural Component',
        itemCode: primaryKeyCode,
        category: activeItem.category,
        params,
        customFields: customFields.map(cf => ({ label: cf.label, value: cf.value })),
        tone: aiTone
      });

      if (result.boqDescription) {
        setCustomBOQText(result.boqDescription);
        setIsCustomEditingBOQ(true);
      }
      if (result.tenderClause) {
        setCustomClauseText(result.tenderClause);
        setIsCustomEditingClause(true);
      }
      if (result.keyHighlights && result.keyHighlights.length > 0) {
        setAiHighlights(result.keyHighlights);
      }
      setGenerationMode('ai');
      setStatusNotification('AI Specification generated successfully!');
      setTimeout(() => setStatusNotification(null), 3000);
    } catch (err) {
      console.warn('AI generation fallback to deterministic engine:', err);
      setCustomBOQText(autoGeneratedBOQDescription);
      setCustomClauseText(autoGeneratedTenderClause);
      setStatusNotification('AI service offline/unconfigured. Generated via Precision Rule-Based Engine.');
      setTimeout(() => setStatusNotification(null), 4000);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Reset to auto engine
  const handleResetToAuto = () => {
    setIsCustomEditingBOQ(false);
    setIsCustomEditingClause(false);
    setGenerationMode('auto');
    setAiHighlights([]);
    setStatusNotification('Reset to real-time auto calculation engine.');
    setTimeout(() => setStatusNotification(null), 2000);
  };

  // Save all specs and sync to Master Library
  const handleSyncToItem = () => {
    if (!activeItem || !onSaveItem) return;

    const itemWithSpecs: ItemTemplate = {
      ...activeItem,
      description: activeBOQText,
      detailedSpecification: activeClauseText,
      code: activeItem.code || primaryKeyCode,
      productCode: activeItem.productCode || primaryKeyCode,
      barcode: activeItem.barcode || primaryKeyCode,
      technicalSpecification: {
        ...activeItem.technicalSpecification,
        profileSystem: params.seriesName,
        aluminiumGrade: params.alloyGrade,
        surfaceFinish: params.finishType,
        finishColor: params.ralColor,
        glazingType: params.glassType,
        glassThickness: params.glassThickness,
        acousticRating: params.acousticRating,
        warrantyProduct: params.warrantyPeriod
      }
    };

    onSaveItem(itemWithSpecs);
    setActiveItem(itemWithSpecs);
    setIsSaved(true);
    setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setStatusNotification(`Specifications & Barcode saved to "${activeItem.name}" (${primaryKeyCode})`);
    setTimeout(() => {
      setIsSaved(false);
      setStatusNotification(null);
    }, 3000);
  };

  // Save as New Item Template (Branching)
  const handleSaveAsNewItem = () => {
    if (!activeItem || !onSaveItem) return;

    const newCode = `BOQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newItem: ItemTemplate = {
      ...activeItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productCode: newCode,
      code: newCode,
      barcode: newCode,
      name: `${activeItem.name} (Custom Spec)`,
      description: activeBOQText,
      detailedSpecification: activeClauseText,
      rateHistory: [],
      competitivePrices: [],
      technicalSpecification: {
        ...activeItem.technicalSpecification,
        profileSystem: params.seriesName,
        aluminiumGrade: params.alloyGrade,
        surfaceFinish: params.finishType,
        finishColor: params.ralColor,
        glazingType: params.glassType,
        glassThickness: params.glassThickness,
        warrantyProduct: params.warrantyPeriod
      }
    };

    onSaveItem(newItem);
    setActiveItem(newItem);
    onSelectItem?.(newItem);
    setIsSaved(true);
    setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setStatusNotification(`Created & saved new BOQ item "${newItem.name}" (${newCode})!`);
    setTimeout(() => {
      setIsSaved(false);
      setStatusNotification(null);
    }, 3500);
  };

  // Open item modal in edit mode
  const handleOpenEditItem = () => {
    if (!activeItem) return;
    setItemToEdit(activeItem);
    setItemModalMode('edit');
    setIsItemModalOpen(true);
  };

  // Open item modal in create mode
  const handleOpenCreateItem = (initialCode?: string) => {
    setItemToEdit(initialCode ? ({ productCode: initialCode, code: initialCode, rate: 1200, unit: 'sqft' } as any) : null);
    setItemModalMode('create');
    setIsItemModalOpen(true);
  };

  // Modal save callback
  const handleSaveItemModal = (savedItem: ItemTemplate) => {
    const mergedItem: ItemTemplate = {
      ...savedItem,
      description: activeBOQText || savedItem.description,
      detailedSpecification: activeClauseText || savedItem.detailedSpecification,
      code: savedItem.productCode || savedItem.code,
      barcode: savedItem.barcode || savedItem.productCode || savedItem.code,
      technicalSpecification: {
        ...savedItem.technicalSpecification,
        profileSystem: params.seriesName,
        aluminiumGrade: params.alloyGrade,
        surfaceFinish: params.finishType,
        finishColor: params.ralColor,
        glazingType: params.glassType,
        glassThickness: params.glassThickness,
        warrantyProduct: params.warrantyPeriod
      }
    };

    if (onSaveItem) {
      onSaveItem(mergedItem);
    }
    setActiveItem(mergedItem);
    onSelectItem?.(mergedItem);
    setIsSaved(true);
    setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setStatusNotification(`Saved BOQ item "${mergedItem.name}" (${mergedItem.productCode || mergedItem.code})`);
    setTimeout(() => {
      setIsSaved(false);
      setStatusNotification(null);
    }, 3000);
  };

  const handleLoadPreset = (presetName: string) => {
    const preset = PRESET_TEMPLATES[presetName];
    if (preset) {
      setParams(prev => ({
        ...prev,
        ...preset
      }));
      setIsCustomEditingBOQ(false);
      setIsCustomEditingClause(false);
      setStatusNotification(`Loaded "${presetName}" preset successfully.`);
      setTimeout(() => setStatusNotification(null), 2500);
    }
  };

  // Add detail to a specific section
  const handleAddSectionDetail = (section: SectionCustomField['section']) => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
    const newField: SectionCustomField = {
      id: 'cf-' + Date.now(),
      section,
      label: newFieldLabel.trim(),
      value: newFieldValue.trim()
    };
    setCustomFields(prev => [...prev, newField]);
    setNewFieldLabel('');
    setNewFieldValue('');
    setAddingToSection(null);
  };

  const handleDeleteCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  // Standards Manager Handlers
  const handleAddStandard = (std: string) => {
    const trimmed = std.trim();
    if (!trimmed || params.applicableStandards.includes(trimmed)) return;
    setParams(prev => ({
      ...prev,
      applicableStandards: [...prev.applicableStandards, trimmed]
    }));
    setCustomStandardInput('');
  };

  const handleRemoveStandard = (std: string) => {
    setParams(prev => ({
      ...prev,
      applicableStandards: prev.applicableStandards.filter(s => s !== std)
    }));
  };

  const handleSaveEditedStandard = (index: number) => {
    if (!editingStandardText.trim()) return;
    setParams(prev => {
      const next = [...prev.applicableStandards];
      next[index] = editingStandardText.trim();
      return { ...prev, applicableStandards: next };
    });
    setEditingStandardIdx(null);
    setEditingStandardText('');
  };

  // Section Clear / Reset handlers
  const handleResetSection = (sectionName: string) => {
    if (sectionName === 'profile') {
      setParams(prev => ({
        ...prev,
        seriesName: '',
        alloyGrade: '',
        wallThickness: '',
        profileDepth: ''
      }));
    } else if (sectionName === 'glazing') {
      setParams(prev => ({
        ...prev,
        glassType: '',
        glassThickness: '',
        glassCoating: '',
        acousticRating: ''
      }));
    } else if (sectionName === 'finish') {
      setParams(prev => ({
        ...prev,
        finishType: '',
        coatingThickness: '',
        ralColor: ''
      }));
    } else if (sectionName === 'hardware') {
      setParams(prev => ({
        ...prev,
        rollerStayType: '',
        lockType: '',
        hardwareGrade: '',
        gasketType: '',
        sealantType: ''
      }));
    }
    setStatusNotification(`Cleared details in ${sectionName} section.`);
    setTimeout(() => setStatusNotification(null), 2000);
  };

  return (
    <div className={cn(
      "flex flex-col bg-white overflow-hidden select-none",
      isFullScreen 
        ? "fixed inset-0 z-[200] h-screen w-screen bg-white" 
        : "h-full flex-1"
    )}>
      {/* 
        CLEAN SPECIFICATION CONTROL TOOLBAR
        Pure White Background, Single Title, Full Screen Controls, Primary Key & Barcode
      */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-30">
        {/* Left Side: Target Item Selector, Primary Key Badge, Barcode & CRUD Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Target Item Selector */}
          {allItems.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <FileSpreadsheet size={14} className="text-orange-500" />
                Target Item:
              </span>
              <ItemSelectDropdown
                items={allItems}
                selectedItemId={activeItem?.id || ''}
                onSelectItem={(id) => {
                  const item = allItems.find(i => i.id === id);
                  if (item) {
                    setActiveItem(item);
                    onSelectItem?.(item);
                  }
                }}
                categories={categories}
                allowAll={false}
                placeholder="Select BOQ item to develop..."
                className="w-60 sm:w-72"
                showPrevNext={true}
                onAddNewItem={() => handleOpenCreateItem()}
              />
            </div>
          )}

          {/* Primary Key (Item Code) Badge */}
          {activeItem && (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-2xs hover:border-orange-300 transition-colors cursor-pointer"
              title="Item Code is the Primary Key. Click to view or edit barcode."
              onClick={() => setIsBarcodeViewOpen(true)}
            >
              <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-1 py-0.5 rounded border border-orange-200">
                PK
              </span>
              <span>{primaryKeyCode}</span>
              <Barcode size={14} className="text-slate-500 ml-0.5" />
            </div>
          )}

          {/* Barcode Scanner Action Button */}
          <button
            type="button"
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            title="Scan item barcode via camera or USB scanner"
          >
            <ScanLine size={13} className="text-orange-500" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </button>

          {/* Edit Details Button */}
          <button
            type="button"
            onClick={handleOpenEditItem}
            disabled={!activeItem}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40"
            title="Edit item code (primary key), name, category, rate"
          >
            <Edit3 size={13} className="text-slate-500" />
            <span className="hidden md:inline">Edit Details</span>
          </button>

          {/* Delete Item Button */}
          {onDeleteItem && (
            <button
              type="button"
              onClick={() => {
                if (!activeItem) return;
                const confirmed = window.confirm(`Are you sure you want to delete "${activeItem.name}" (${activeItem.code || activeItem.id}) from the master library?`);
                if (confirmed) {
                  onDeleteItem(activeItem.id);
                  const remaining = allItems.filter(i => i.id !== activeItem.id);
                  const nextItem = remaining.length > 0 ? remaining[0] : null;
                  setActiveItem(nextItem);
                  if (nextItem) onSelectItem?.(nextItem);
                }
              }}
              disabled={!activeItem}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40"
              title="Delete item from master library"
            >
              <Trash2 size={13} className="text-slate-400 hover:text-red-500" />
              <span className="hidden md:inline">Delete</span>
            </button>
          )}

          {/* Add New Item Button */}
          <button
            type="button"
            onClick={() => handleOpenCreateItem()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            title="Create a new BOQ Item Template in master library"
          >
            <Plus size={13} className="text-orange-600" />
            <span>New Item</span>
          </button>

          {/* Quick Preset Selector */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <select
              onChange={(e) => {
                if (e.target.value) handleLoadPreset(e.target.value);
              }}
              defaultValue=""
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-orange-400 shadow-2xs"
            >
              <option value="" disabled>Load Spec Preset...</option>
              {Object.keys(PRESET_TEMPLATES).map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: AI Tone, Full Screen Toggle, Export & Save Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Generator Controls */}
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value as any)}
              className="text-[11px] font-medium bg-transparent px-2 py-1 text-slate-700 border-none outline-none cursor-pointer"
              title="Select specification tone for AI generation"
            >
              <option value="standard">Tender Standard (BS/SLS)</option>
              <option value="fidic">FIDIC Contract Clause</option>
              <option value="luxury">Luxury Architectural</option>
              <option value="value_engineered">Value-Engineered (Cost)</option>
              <option value="marine_coastal">Marine/Coastal Anti-Corrosion</option>
            </select>

            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shadow-2xs",
                isGeneratingAI
                  ? "bg-slate-200 text-slate-600 cursor-wait"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              )}
              title="Generate professional specification and BOQ description using AI"
            >
              {isGeneratingAI ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} className="text-amber-300" />
              )}
              <span>{isGeneratingAI ? 'Writing...' : 'Write with AI'}</span>
            </button>
          </div>

          {/* Reset / Auto mode if edited */}
          {(isCustomEditingBOQ || isCustomEditingClause || generationMode === 'ai') && (
            <button
              type="button"
              onClick={handleResetToAuto}
              className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              title="Reset to real-time auto-generated rule engine"
            >
              Auto Engine
            </button>
          )}

          {/* Export Actions */}
          <ExportActions 
            onExportCSV={() => exportSpecificationsCSV(allItems)}
            onExportPDF={() => exportSpecificationsPDF(allItems, activeItem, activeClauseText)}
            labelCSV="CSV"
            labelPDF="PDF"
          />

          {/* Save As New Item (Branching) */}
          <button
            type="button"
            onClick={handleSaveAsNewItem}
            disabled={!activeItem}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-2xs disabled:opacity-40 shrink-0"
            title="Save current specifications as a new separate BOQ item in library"
          >
            <CopyPlus size={13} className="text-slate-500" />
            <span className="hidden xl:inline">Save as New</span>
          </button>

          {/* Master Sync to BOQ Item Button */}
          <button
            type="button"
            onClick={handleSyncToItem}
            disabled={!activeItem}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs shrink-0",
              isSaved
                ? "bg-emerald-600 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
            )}
            title="Save description and detailed specification to active item in master BOQ library"
          >
            {isSaved ? <Check size={14} /> : <Save size={14} />}
            <span>{isSaved ? 'Saved to BOQ!' : 'Save Specification'}</span>
          </button>

          {/* Full Screen Mode Toggle Button (Fits to Full Screen) */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            title={isFullScreen ? "Exit Full Screen (Esc)" : "View Full Screen (Fit to Full Screen)"}
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {lastSavedTimestamp && (
            <span className="text-[10px] text-slate-400 hidden 2xl:inline whitespace-nowrap">
              Saved {lastSavedTimestamp}
            </span>
          )}
        </div>
      </div>

      {/* Live Status Notification Banner - Pure White Background */}
      {statusNotification && (
        <div className="px-6 py-2 bg-white border-b border-orange-200 text-orange-950 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-orange-500" />
            <span>{statusNotification}</span>
          </div>
          <button onClick={() => setStatusNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main Workspace Split: Left Technical Parameters (White) / Right Live Spec Writer (White) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-white">
        {/* Left Column: Technical Parameter Controls with Pure White Background */}
        <div className="lg:w-1/2 w-full border-r border-slate-200 bg-white overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-orange-500" />
              <h2 className="text-sm font-bold text-slate-900">
                Engineering Specification Parameters
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              Select or type details in each field; clauses update automatically
            </span>
          </div>

          {/* 1. Profile System & Extrusion Metallurgy */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-orange-500" />
                1. Profile System & Extrusion Metallurgy
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAddingToSection(addingToSection === 'profile' ? null : 'profile')}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md flex items-center gap-1"
                >
                  <Plus size={10} />
                  <span>Add Detail</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResetSection('profile')}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                  title="Clear all fields in Section 1"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            </div>

            {/* Inline Add Detail Form for Section 1 */}
            {addingToSection === 'profile' && (
              <div className="p-3 border border-orange-200 rounded-lg space-y-2 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Detail Name (e.g., Mullion Moment of Inertia)"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Detail Value (e.g., Ix ≥ 145 cm⁴)"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingToSection(null)}
                    className="px-2 py-1 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSectionDetail('profile')}
                    disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-orange-500 text-white rounded-md disabled:opacity-50"
                  >
                    Add Parameter
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <SmartSpecField
                label="System / Profile Series"
                description={FIELD_OPTIONS.seriesName.description}
                value={params.seriesName}
                onChange={(val) => setParams({ ...params, seriesName: val })}
                options={FIELD_OPTIONS.seriesName.options}
                suggestions={FIELD_OPTIONS.seriesName.suggestions}
                placeholder="e.g., Alumex 1000 Series 2-Track"
                onClear={() => setParams({ ...params, seriesName: '' })}
              />

              <SmartSpecField
                label="Alloy & Temper"
                description={FIELD_OPTIONS.alloyGrade.description}
                value={params.alloyGrade}
                onChange={(val) => setParams({ ...params, alloyGrade: val })}
                options={FIELD_OPTIONS.alloyGrade.options}
                suggestions={FIELD_OPTIONS.alloyGrade.suggestions}
                placeholder="e.g., 6063-T6 (ASTM B221)"
                onClear={() => setParams({ ...params, alloyGrade: '' })}
              />

              <SmartSpecField
                label="Wall Thickness"
                description={FIELD_OPTIONS.wallThickness.description}
                value={params.wallThickness}
                onChange={(val) => setParams({ ...params, wallThickness: val })}
                options={FIELD_OPTIONS.wallThickness.options}
                suggestions={FIELD_OPTIONS.wallThickness.suggestions}
                placeholder="e.g., 1.6mm (2.0mm sill)"
                onClear={() => setParams({ ...params, wallThickness: '' })}
              />

              <SmartSpecField
                label="Frame Depth & Sightline"
                description={FIELD_OPTIONS.profileDepth.description}
                value={params.profileDepth}
                onChange={(val) => setParams({ ...params, profileDepth: val })}
                options={FIELD_OPTIONS.profileDepth.options}
                suggestions={FIELD_OPTIONS.profileDepth.suggestions}
                placeholder="e.g., 100mm 2-Track Frame"
                onClear={() => setParams({ ...params, profileDepth: '' })}
              />
            </div>

            {/* Custom fields in Section 1 */}
            {customFields.filter(f => f.section === 'profile').map(cf => (
              <div key={cf.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="font-bold text-slate-800">{cf.label}:</span>{' '}
                  <span className="text-slate-600">{cf.value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomField(cf.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* 2. Glazing, Infill & Acoustic Performance */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={13} className="text-blue-500" />
                2. Glazing, Infill & Acoustic Performance
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAddingToSection(addingToSection === 'glazing' ? null : 'glazing')}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md flex items-center gap-1"
                >
                  <Plus size={10} />
                  <span>Add Detail</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResetSection('glazing')}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                  title="Clear all fields in Section 2"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            </div>

            {addingToSection === 'glazing' && (
              <div className="p-3 border border-blue-200 rounded-lg space-y-2 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Glazing Detail (e.g., Spacer Bar Type)"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., 16mm Warm-Edge Black Technoform)"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingToSection(null)}
                    className="px-2 py-1 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSectionDetail('glazing')}
                    disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md disabled:opacity-50"
                  >
                    Add Parameter
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <SmartSpecField
                label="Glass Spec / Configuration"
                description={FIELD_OPTIONS.glassType.description}
                value={params.glassType}
                onChange={(val) => setParams({ ...params, glassType: val })}
                options={FIELD_OPTIONS.glassType.options}
                suggestions={FIELD_OPTIONS.glassType.suggestions}
                placeholder="e.g., Monolithic Tempered Safety Float"
                onClear={() => setParams({ ...params, glassType: '' })}
              />

              <SmartSpecField
                label="Glass Thickness"
                description={FIELD_OPTIONS.glassThickness.description}
                value={params.glassThickness}
                onChange={(val) => setParams({ ...params, glassThickness: val })}
                options={FIELD_OPTIONS.glassThickness.options}
                suggestions={FIELD_OPTIONS.glassThickness.suggestions}
                placeholder="e.g., 5mm, 12mm, 6+12A+6mm"
                onClear={() => setParams({ ...params, glassThickness: '' })}
              />

              <SmartSpecField
                label="Glass Coating / Solar Tint"
                description={FIELD_OPTIONS.glassCoating.description}
                value={params.glassCoating}
                onChange={(val) => setParams({ ...params, glassCoating: val })}
                options={FIELD_OPTIONS.glassCoating.options}
                suggestions={FIELD_OPTIONS.glassCoating.suggestions}
                placeholder="e.g., Low-E Soft Coat, Euro Grey"
                onClear={() => setParams({ ...params, glassCoating: '' })}
              />

              <SmartSpecField
                label="Acoustic STC Rating"
                description={FIELD_OPTIONS.acousticRating.description}
                value={params.acousticRating}
                onChange={(val) => setParams({ ...params, acousticRating: val })}
                options={FIELD_OPTIONS.acousticRating.options}
                suggestions={FIELD_OPTIONS.acousticRating.suggestions}
                placeholder="e.g., STC 32 dB Acoustic"
                onClear={() => setParams({ ...params, acousticRating: '' })}
              />
            </div>

            {customFields.filter(f => f.section === 'glazing').map(cf => (
              <div key={cf.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="font-bold text-slate-800">{cf.label}:</span>{' '}
                  <span className="text-slate-600">{cf.value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomField(cf.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* 3. Surface Treatment & Corrosion Coating */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-500" />
                3. Surface Treatment & Corrosion Coating
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAddingToSection(addingToSection === 'finish' ? null : 'finish')}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md flex items-center gap-1"
                >
                  <Plus size={10} />
                  <span>Add Detail</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResetSection('finish')}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                  title="Clear all fields in Section 3"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            </div>

            {addingToSection === 'finish' && (
              <div className="p-3 border border-emerald-200 rounded-lg space-y-2 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Finish Detail (e.g., Salt Spray Resistance)"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., 3000 Hours ASTM B117)"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingToSection(null)}
                    className="px-2 py-1 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSectionDetail('finish')}
                    disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-md disabled:opacity-50"
                  >
                    Add Parameter
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="md:col-span-2">
                <SmartSpecField
                  label="Finish Process Standard"
                  description={FIELD_OPTIONS.finishType.description}
                  value={params.finishType}
                  onChange={(val) => setParams({ ...params, finishType: val })}
                  options={FIELD_OPTIONS.finishType.options}
                  suggestions={FIELD_OPTIONS.finishType.suggestions}
                  placeholder="e.g., Powder Coated (Qualicoat Class 2)"
                  onClear={() => setParams({ ...params, finishType: '' })}
                />
              </div>

              <div>
                <SmartSpecField
                  label="Coating Thickness"
                  description={FIELD_OPTIONS.coatingThickness.description}
                  value={params.coatingThickness}
                  onChange={(val) => setParams({ ...params, coatingThickness: val })}
                  options={FIELD_OPTIONS.coatingThickness.options}
                  suggestions={FIELD_OPTIONS.coatingThickness.suggestions}
                  placeholder="e.g., 60-80 microns"
                  onClear={() => setParams({ ...params, coatingThickness: '' })}
                />
              </div>

              <div className="md:col-span-3">
                <SmartSpecField
                  label="RAL Color / Shade Code & Gloss"
                  description={FIELD_OPTIONS.ralColor.description}
                  value={params.ralColor}
                  onChange={(val) => setParams({ ...params, ralColor: val })}
                  options={FIELD_OPTIONS.ralColor.options}
                  suggestions={FIELD_OPTIONS.ralColor.suggestions}
                  placeholder="e.g., RAL 7016 Anthracite Grey (Matte 30% gloss)"
                  onClear={() => setParams({ ...params, ralColor: '' })}
                />
              </div>
            </div>

            {customFields.filter(f => f.section === 'finish').map(cf => (
              <div key={cf.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="font-bold text-slate-800">{cf.label}:</span>{' '}
                  <span className="text-slate-600">{cf.value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomField(cf.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* 4. Hardware, Gaskets & Sealants */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={13} className="text-indigo-500" />
                4. Hardware, Weatherseals & Fasteners
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAddingToSection(addingToSection === 'hardware' ? null : 'hardware')}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md flex items-center gap-1"
                >
                  <Plus size={10} />
                  <span>Add Detail</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResetSection('hardware')}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                  title="Clear all fields in Section 4"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            </div>

            {addingToSection === 'hardware' && (
              <div className="p-3 border border-indigo-200 rounded-lg space-y-2 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Hardware Detail (e.g., Restrictor Arm)"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., 100mm Child Safety Stay)"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingToSection(null)}
                    className="px-2 py-1 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSectionDetail('hardware')}
                    disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-md disabled:opacity-50"
                  >
                    Add Parameter
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <SmartSpecField
                label="Rollers / Stays / Hinges / Carriages"
                description={FIELD_OPTIONS.rollerStayType.description}
                value={params.rollerStayType}
                onChange={(val) => setParams({ ...params, rollerStayType: val })}
                options={FIELD_OPTIONS.rollerStayType.options}
                suggestions={FIELD_OPTIONS.rollerStayType.suggestions}
                placeholder="e.g., Heavy-duty tandem stainless steel ball-bearing rollers (90kg/sash)"
                onClear={() => setParams({ ...params, rollerStayType: '' })}
              />

              <SmartSpecField
                label="Locking Hardware & Handles"
                description={FIELD_OPTIONS.lockType.description}
                value={params.lockType}
                onChange={(val) => setParams({ ...params, lockType: val })}
                options={FIELD_OPTIONS.lockType.options}
                suggestions={FIELD_OPTIONS.lockType.suggestions}
                placeholder="e.g., Flush recessed D-pull with multi-point stainless mortise lock"
                onClear={() => setParams({ ...params, lockType: '' })}
              />

              <SmartSpecField
                label="Fasteners & Hardware Grade"
                description={FIELD_OPTIONS.hardwareGrade.description}
                value={params.hardwareGrade}
                onChange={(val) => setParams({ ...params, hardwareGrade: val })}
                options={FIELD_OPTIONS.hardwareGrade.options}
                suggestions={FIELD_OPTIONS.hardwareGrade.suggestions}
                placeholder="e.g., Grade 304 Stainless Steel Fixings & Anti-lift blocks"
                onClear={() => setParams({ ...params, hardwareGrade: '' })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <SmartSpecField
                  label="Weatherseals & Woolpile"
                  description={FIELD_OPTIONS.gasketType.description}
                  value={params.gasketType}
                  onChange={(val) => setParams({ ...params, gasketType: val })}
                  options={FIELD_OPTIONS.gasketType.options}
                  suggestions={FIELD_OPTIONS.gasketType.suggestions}
                  placeholder="e.g., Continuous EPDM seals + fin woolpile"
                  onClear={() => setParams({ ...params, gasketType: '' })}
                />

                <SmartSpecField
                  label="Perimeter Sealant & Backing"
                  description={FIELD_OPTIONS.sealantType.description}
                  value={params.sealantType}
                  onChange={(val) => setParams({ ...params, sealantType: val })}
                  options={FIELD_OPTIONS.sealantType.options}
                  suggestions={FIELD_OPTIONS.sealantType.suggestions}
                  placeholder="e.g., Dow Corning 795 structural silicone"
                  onClear={() => setParams({ ...params, sealantType: '' })}
                />
              </div>
            </div>

            {customFields.filter(f => f.section === 'hardware').map(cf => (
              <div key={cf.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="font-bold text-slate-800">{cf.label}:</span>{' '}
                  <span className="text-slate-600">{cf.value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomField(cf.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* 5. Standards, Scope & Warranty */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <CheckCircle2 size={13} className="text-amber-500" />
              5. Codes, Standards & Warranty Scope
            </h3>

            {/* Interactive Standards Manager (Add, Edit, Delete Standards) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700">
                  Applicable Engineering Standards ({params.applicableStandards.length})
                </label>
                <span className="text-[10px] text-slate-400">Click standard to edit inline or delete</span>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white border border-slate-200 rounded-lg">
                {params.applicableStandards.map((std, idx) => {
                  const isEditingThis = editingStandardIdx === idx;
                  if (isEditingThis) {
                    return (
                      <div key={idx} className="flex items-center gap-1 bg-white p-1 rounded border border-orange-400">
                        <input
                          type="text"
                          value={editingStandardText}
                          onChange={(e) => setEditingStandardText(e.target.value)}
                          className="text-xs px-1.5 py-0.5 border border-slate-200 rounded focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditedStandard(idx);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditedStandard(idx)}
                          className="px-1.5 py-0.5 text-[10px] bg-emerald-600 text-white rounded font-bold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStandardIdx(null)}
                          className="text-slate-400 p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-800 border border-slate-300 hover:border-orange-400 transition-colors group"
                    >
                      <span 
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          setEditingStandardIdx(idx);
                          setEditingStandardText(std);
                        }}
                        title="Click to edit standard"
                      >
                        {std}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStandard(std)}
                        className="text-slate-400 hover:text-red-600 rounded-full p-0.5"
                        title="Delete standard"
                      >
                        <Trash2 size={10} />
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Add Standard Controls */}
              <div className="flex items-center gap-2 pt-1">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddStandard(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-medium"
                >
                  <option value="" disabled>+ Select standard from library...</option>
                  {STANDARD_OPTIONS_PRESETS.filter(s => !params.applicableStandards.includes(s)).map((std, i) => (
                    <option key={i} value={std}>{std}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="text"
                    value={customStandardInput}
                    onChange={(e) => setCustomStandardInput(e.target.value)}
                    placeholder="or type custom standard (e.g., DIN 18055)..."
                    className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-800 flex-1 focus:outline-none focus:border-orange-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStandard(customStandardInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddStandard(customStandardInput)}
                    disabled={!customStandardInput.trim()}
                    className="px-2 py-1 text-xs font-semibold bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <SmartSpecField
              label="Scope of Work Clause"
              description={FIELD_OPTIONS.scopeClause.description}
              value={params.scopeClause}
              onChange={(val) => setParams({ ...params, scopeClause: val })}
              options={FIELD_OPTIONS.scopeClause.options}
              suggestions={FIELD_OPTIONS.scopeClause.suggestions}
              isTextArea={true}
              rows={2}
              placeholder="Detail supply, fabrication, hoisting, anchor fixing, and sealing scope..."
              onClear={() => setParams({ ...params, scopeClause: '' })}
            />

            <SmartSpecField
              label="Warranty Period Clause"
              description={FIELD_OPTIONS.warrantyPeriod.description}
              value={params.warrantyPeriod}
              onChange={(val) => setParams({ ...params, warrantyPeriod: val })}
              options={FIELD_OPTIONS.warrantyPeriod.options}
              suggestions={FIELD_OPTIONS.warrantyPeriod.suggestions}
              placeholder="e.g., 10 Years Structural Frame & Finish, 5 Years Rollers & Locking Hardware"
              onClear={() => setParams({ ...params, warrantyPeriod: '' })}
            />
          </div>

          {/* 6. Custom Specification Parameters (Extensible Attributes) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={13} className="text-emerald-500" />
                6. Custom Project Parameters & Engineered Limits
              </h3>
              <button
                type="button"
                onClick={() => setAddingToSection(addingToSection === 'general' ? null : 'general')}
                className="px-2.5 py-1 text-[10px] font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-200 shadow-2xs flex items-center gap-1"
              >
                <Plus size={11} />
                <span>Add Custom Field</span>
              </button>
            </div>

            {addingToSection === 'general' && (
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Field Name / Label</label>
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="e.g., Thermal Break Strip, Wind Load, Flyscreen"
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Detail Specification</label>
                    <input
                      type="text"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      placeholder="e.g., 24mm Polyamide Insulating Bar"
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded-md bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAddingToSection(null)}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSectionDetail('general')}
                    disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-md disabled:opacity-50"
                  >
                    Add Parameter
                  </button>
                </div>
              </div>
            )}

            {customFields.filter(f => f.section === 'general').length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                No general project parameters added yet. Click &ldquo;Add Custom Field&rdquo; to add engineered parameters.
              </p>
            ) : (
              <div className="space-y-2">
                {customFields.filter(f => f.section === 'general').map((cf) => (
                  <div key={cf.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <div className="w-1/3">
                      <input
                        type="text"
                        value={cf.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomFields(prev => prev.map(f => f.id === cf.id ? { ...f, label: val } : f));
                        }}
                        className="w-full text-xs font-bold px-1.5 py-0.5 border border-transparent hover:border-slate-200 focus:border-orange-400 rounded text-slate-800"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={cf.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomFields(prev => prev.map(f => f.id === cf.id ? { ...f, value: val } : f));
                        }}
                        className="w-full text-xs px-2 py-1 border border-slate-200 rounded-md text-slate-800 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomField(cf.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove custom field"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Auto-Written BOQ Item Description & Tender Clause Output */}
        <div className="lg:w-1/2 w-full flex flex-col bg-white overflow-hidden border-t lg:border-t-0">
          {/* Output Toolbar & Tab Selector - Pure White Background */}
          <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* View Selector Tabs */}
            <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setOutputTab('BOQ_LINE')}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
                  outputTab === 'BOQ_LINE'
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <FileText size={13} />
                <span>BOQ Item Description</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputTab('TENDER_CLAUSE')}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
                  outputTab === 'TENDER_CLAUSE'
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <ListChecks size={13} />
                <span>Tender Spec Clause</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputTab('DUAL_VIEW')}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
                  outputTab === 'DUAL_VIEW'
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Eye size={13} />
                <span>Dual View</span>
              </button>
            </div>

            {/* Edit Mode & Copy Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (outputTab === 'BOQ_LINE') {
                    if (!isCustomEditingBOQ) setCustomBOQText(autoGeneratedBOQDescription);
                    setIsCustomEditingBOQ(!isCustomEditingBOQ);
                  } else {
                    if (!isCustomEditingClause) setCustomClauseText(autoGeneratedTenderClause);
                    setIsCustomEditingClause(!isCustomEditingClause);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                  (outputTab === 'BOQ_LINE' ? isCustomEditingBOQ : isCustomEditingClause)
                    ? "bg-orange-500 text-white border-orange-600 shadow-2xs" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs"
                )}
              >
                <Edit3 size={13} />
                <span>
                  {(outputTab === 'BOQ_LINE' ? isCustomEditingBOQ : isCustomEditingClause)
                    ? 'Switch to Auto' 
                    : 'Manual Edit'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(outputTab === 'BOQ_LINE' ? activeBOQText : activeClauseText)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                title="Copy current specification text"
              >
                {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* AI Highlights if available */}
          {aiHighlights.length > 0 && (
            <div className="px-5 py-2.5 bg-white border-b border-purple-200">
              <div className="flex items-center gap-2 text-purple-900 text-xs font-bold mb-1">
                <Sparkles size={13} className="text-purple-600" />
                <span>AI Engineering Spec Highlights:</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-purple-800">
                {aiHighlights.map((hl, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ArrowRight size={11} className="shrink-0 mt-0.5 text-purple-500" />
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Live Document Viewer / Editor (Paper Canvas) - Clean Pure White Background */}
          <div className="flex-1 p-5 overflow-y-auto bg-white select-text space-y-4">
            {/* View 1: BOQ Line Item Description */}
            {(outputTab === 'BOQ_LINE' || outputTab === 'DUAL_VIEW') && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-orange-600" />
                    <span className="text-xs font-bold text-slate-900 tracking-wide">
                      Bill of Quantities (BOQ) Line Item Description
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white text-orange-700 border border-orange-200">
                      Syncs to Quote Items
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      PK: {primaryKeyCode}
                    </span>
                  </div>
                </div>

                {isCustomEditingBOQ ? (
                  <textarea
                    value={customBOQText}
                    onChange={(e) => setCustomBOQText(e.target.value)}
                    className="w-full min-h-[160px] bg-white text-slate-800 font-sans text-xs leading-relaxed focus:outline-none resize-none border border-orange-300 rounded-lg p-3"
                    placeholder="Type or edit BOQ item description..."
                  />
                ) : (
                  <p className="text-slate-800 font-sans text-xs leading-relaxed">
                    {autoGeneratedBOQDescription}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Words: {activeBOQText.split(/\s+/).filter(Boolean).length} | Characters: {activeBOQText.length}</span>
                  <div className="flex items-center gap-3">
                    {isCustomEditingBOQ && (
                      <button
                        type="button"
                        onClick={() => setCustomBOQText('')}
                        className="text-slate-400 hover:text-red-600 flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 size={11} /> Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBOQText)}
                      className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      <Copy size={11} /> Copy Description
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Full Tender Specification Clause */}
            {(outputTab === 'TENDER_CLAUSE' || outputTab === 'DUAL_VIEW') && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ListChecks size={15} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 tracking-wide">
                      Tender Specification Clause (Legal & Contract Standard)
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white text-emerald-700 border border-emerald-200">
                    Tender Ready Output
                  </span>
                </div>

                {isCustomEditingClause ? (
                  <textarea
                    value={customClauseText}
                    onChange={(e) => setCustomClauseText(e.target.value)}
                    className="w-full min-h-[380px] bg-white text-slate-800 font-mono text-xs leading-relaxed focus:outline-none resize-none border border-orange-300 rounded-lg p-3"
                    placeholder="Type or customize tender specification clause..."
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-slate-800 font-mono text-xs leading-relaxed bg-white">
                    {autoGeneratedTenderClause}
                  </pre>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Sections: 8 Clauses | Conforming to Standards: {params.applicableStandards.length}</span>
                  <div className="flex items-center gap-3">
                    {isCustomEditingClause && (
                      <button
                        type="button"
                        onClick={() => setCustomClauseText('')}
                        className="text-slate-400 hover:text-red-600 flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 size={11} /> Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(activeClauseText)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <Copy size={11} /> Copy Clause
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document Footer Callout - Pure White Background */}
          <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Target Item:</span>
              <strong className="text-slate-900">{activeItem?.name || 'Unassigned'}</strong>
              <span className="font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 text-[10px]">
                PK: {primaryKeyCode}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Mode: <strong className={generationMode === 'ai' ? "text-purple-600 font-semibold" : "text-slate-700"}>{generationMode === 'ai' ? 'AI Assisted' : 'Real-time Rule Engine'}</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 size={13} /> Tender Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {isBarcodeScannerOpen && (
        <BarcodeScannerModal
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          allItems={allItems}
          onSelectItem={(item) => {
            setActiveItem(item);
            onSelectItem?.(item);
            setStatusNotification(`Loaded item "${item.name}" (${item.productCode || item.code}) via Barcode Scanner!`);
            setTimeout(() => setStatusNotification(null), 3500);
          }}
          onAddNewItemWithCode={(code) => {
            handleOpenCreateItem(code);
          }}
        />
      )}

      {/* Barcode Preview & Print Modal */}
      {isBarcodeViewOpen && activeItem && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Barcode size={18} className="text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900">Item Barcode (Code 128)</h3>
              </div>
              <button onClick={() => setIsBarcodeViewOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <BarcodeVisual value={primaryKeyCode} height={54} width={1.8} displayValue={true} />
              <p className="text-xs font-bold text-slate-800">{activeItem.name}</p>
              <p className="text-[11px] text-slate-500">{activeItem.category} &bull; LKR {activeItem.rate.toLocaleString()} / {activeItem.unit}</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Printer size={13} />
                <span>Print Label</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCopy(primaryKeyCode);
                  setIsBarcodeViewOpen(false);
                }}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Copy size={13} />
                <span>Copy Code</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Add & Edit BOQ Item Modal */}
      {isItemModalOpen && (
        <ItemEditModal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItemModal}
          categories={categories}
          itemToEdit={itemModalMode === 'edit' ? itemToEdit : null}
          initialCategoryId={activeItem?.categoryId || (categories.length > 0 ? categories[0].id : null)}
        />
      )}
    </div>
  );
};
