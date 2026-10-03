import React, { useState, useEffect } from 'react';
import { Box } from 'lucide-react';
import { centralApiGateway } from '../../../services/centralApiGateway';
import { ProductMaster, BillOfMaterialItem, OperationRoutingStep } from '../../../types/operationalControl';
import { useSecurity } from '../../../context/SecurityContext';

export const ProductPortal: React.FC = () => {
  const { currentUser } = useSecurity();
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('prd-01');
  const [bomItems, setBomItems] = useState<BillOfMaterialItem[]>([]);
  const [routings, setRoutings] = useState<OperationRoutingStep[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'bom' | 'routing' | 'specs'>('catalog');

  useEffect(() => {
    try {
      const prods = centralApiGateway.getProducts(currentUser);
      setProducts(prods);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedProductId) {
      setBomItems(centralApiGateway.getBomsForProduct(currentUser, selectedProductId));
      setRoutings(centralApiGateway.getRoutingsForProduct(currentUser, selectedProductId));
    }
  }, [selectedProductId, currentUser]);

  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Product Engineering Master
              </span>
              <span className="text-xs text-slate-400">BOM, Routings & Technical Specifications</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Box className="w-6 h-6 text-indigo-600" />
              Product Master & Engineering Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Standard fabrication product assemblies, variant matrices, multi-level Bill of Materials (BOM), and sequential shop-floor machine routing steps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.productCode} - {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'catalog' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Product Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('bom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'bom' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Bill of Materials (BOM) ({bomItems.length})
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'routing' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Operation Routing ({routings.length} Steps)
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'specs' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            CAD & Engineering Specifications
          </button>
        </div>
      </div>

      {/* Tab: Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map(p => (
            <div 
              key={p.id}
              onClick={() => setSelectedProductId(p.id)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white ${selectedProductId === p.id ? 'border-indigo-600 shadow-md' : 'border-slate-200 hover:border-indigo-300'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white font-mono">{p.productCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">{p.currentRevision}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">{p.status}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">{p.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">Category: {p.category} • Base: {p.baseMaterialGrade}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Std Cost Est</span>
                  <span className="text-sm font-bold text-indigo-700">AED {p.standardCostEst.toLocaleString()} / {p.standardUnit}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                {p.specificationSummary}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Drawing: <strong className="text-slate-800">{p.drawingNumber}</strong></span>
                <span>Lead Time: <strong className="text-slate-800">{p.leadTimeDays} Days</strong></span>
                <span>Variants: <strong className="text-indigo-600">{p.activeVariantsCount} Configurations</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: BOM */}
      {activeTab === 'bom' && activeProduct && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs text-indigo-600 font-bold">{activeProduct.productCode} ({activeProduct.currentRevision})</span>
              <h4 className="text-sm font-bold text-slate-900">Multi-Level Bill of Materials (BOM)</h4>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
              Procurement Bridge Ready
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Material Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Qty / Unit</th>
                  <th className="p-3 text-right">Scrap %</th>
                  <th className="p-3 text-right">Unit Cost Est</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold">10</td>
                  <td className="p-3 font-mono text-indigo-600 font-semibold">RAW-SS-PL-10MM</td>
                  <td className="p-3 text-slate-800">10mm Hot-Rolled Stainless Steel 316L Plate</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-semibold">Raw Material</span></td>
                  <td className="p-3 text-right font-bold text-slate-900">18.50 SQM</td>
                  <td className="p-3 text-right text-amber-600">5.0%</td>
                  <td className="p-3 text-right font-semibold">AED 420.00</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold">20</td>
                  <td className="p-3 font-mono text-indigo-600 font-semibold">FAST-A4-M16-80</td>
                  <td className="p-3 text-slate-800">M16x80mm Grade A4-80 Hex Bolt & Nyloc Nut Set</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-semibold">Fastener</span></td>
                  <td className="p-3 text-right font-bold text-slate-900">48 PCS</td>
                  <td className="p-3 text-right text-slate-400">0.0%</td>
                  <td className="p-3 text-right font-semibold">AED 18.50</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold">30</td>
                  <td className="p-3 font-mono text-indigo-600 font-semibold">CONS-WELD-316L</td>
                  <td className="p-3 text-slate-800">ER316L 1.2mm Solid Welding Wire (15kg Spool)</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-semibold">Consumable</span></td>
                  <td className="p-3 text-right font-bold text-slate-900">2.5 SPOOLS</td>
                  <td className="p-3 text-right text-amber-600">3.0%</td>
                  <td className="p-3 text-right font-semibold">AED 210.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Routing */}
      {activeTab === 'routing' && activeProduct && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs text-indigo-600 font-bold">{activeProduct.productCode}</span>
              <h4 className="text-sm font-bold text-slate-900">Sequential Operation Routing</h4>
            </div>
            <span className="text-xs text-slate-500">Shop-Floor Standard Cycle Times</span>
          </div>

          <div className="space-y-3">
            {[
              { seq: 10, name: 'CNC Fiber Laser Blanking', station: 'High-Power Fiber Laser Center', setup: 20, run: 45, skill: 'CNC Specialist', hold: true },
              { seq: 20, name: 'Beveling & Weld Joint Preparation', station: 'Heavy Welding Bay A', setup: 15, run: 30, skill: 'Fabricator Level 2', hold: false },
              { seq: 30, name: 'MIG Robotic Box Girder Welding', station: 'Heavy Structural MIG Bay', setup: 30, run: 120, skill: 'Robotic Welding Tech', hold: true },
              { seq: 40, name: 'Non-Destructive Ultrasonic NDT Inspection', station: 'QA Metrology & NDT Lab', setup: 10, run: 25, skill: 'ASNT Level II Inspector', hold: true },
              { seq: 50, name: 'Titanium PVD Surface Finishing', station: 'Automated Coating Line', setup: 40, run: 90, skill: 'Surface Chemist', hold: false }
            ].map(step => (
              <div key={step.seq} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center font-mono">
                    {step.seq}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">{step.name}</h5>
                    <div className="text-slate-500 mt-0.5">Workstation: <strong className="text-slate-700">{step.station}</strong> • Required Skill: {step.skill}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Setup / Run</span>
                    <span className="font-semibold text-slate-800">{step.setup}m / {step.run}m</span>
                  </div>
                  {step.hold && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      QA Hold Point
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Specs */}
      {activeTab === 'specs' && activeProduct && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Engineering Specifications & Master CAD</h4>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
            <div>Master Drawing: <strong className="font-mono text-indigo-700">{activeProduct.drawingNumber}</strong></div>
            <div>Base Metallurgy: <strong className="text-slate-800">{activeProduct.baseMaterialGrade}</strong></div>
            <p className="text-slate-600 leading-relaxed pt-2 border-t border-slate-200">{activeProduct.specificationSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
};
