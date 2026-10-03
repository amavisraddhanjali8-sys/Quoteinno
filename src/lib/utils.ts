import { BOQItem, Job, Quote } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function generatePVC(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters
  const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PV-${segment(5)}-${segment(5)}-${segment(5)}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function computeItemNumber(items: BOQItem[], index: number): string {
  let titleIndex = 0;
  let mainIndex = 0;
  let subIndex = 0;

  for (let i = 0; i <= index; i++) {
    const item = items[i];
    if (!item) continue;
    if (item.itemType === 'Title') {
      titleIndex++;
      mainIndex = 0;
      subIndex = 0;
    } else if (item.itemType === 'Main') {
      mainIndex++;
      subIndex = 0;
    } else if (item.itemType === 'Sub') {
      subIndex++;
    }
  }

  const current = items[index];
  if (!current) return (index + 1).toString();
  if (current.itemType === 'Title') {
    return `${titleIndex}.0`;
  }
  if (current.itemType === 'Main') {
    return titleIndex > 0 ? `${titleIndex}.${mainIndex}` : `${mainIndex}.0`;
  }
  if (current.itemType === 'Sub') {
    return titleIndex > 0
      ? `${titleIndex}.${mainIndex}.${subIndex}`
      : `${mainIndex}.${subIndex}`;
  }
  return (index + 1).toString();
}

export function computeHierarchyItemNumbers(items: BOQItem[]): string[] {
  return items.map((_, idx) => computeItemNumber(items, idx));
}

export function syncItemsHierarchyNumbers(items: BOQItem[], forceRenumber = false): BOQItem[] {
  const numbers = computeHierarchyItemNumbers(items);
  return items.map((item, idx) => {
    if (!forceRenumber && item.hasCustomNo && item.no && item.no.trim() !== '') {
      return item;
    }
    return {
      ...item,
      no: numbers[idx] || (idx + 1).toString()
    };
  });
}

export function getQuoteTotalBreakdown(q: Quote) {
  let subTotal = 0;
  if (q.pricingMethod === 'Lump Sum' && q.lumpSumAmount) {
    subTotal = q.lumpSumAmount;
  } else {
    const isLeafItem = (item: BOQItem, index: number, allItems: BOQItem[]) => {
      if (item.itemType === 'Title') return false;
      if (item.itemType === 'Sub') return true;
      if (item.itemType === 'Main') {
        const nextItem = allItems[index + 1];
        return !nextItem || nextItem.itemType !== 'Sub';
      }
      return true;
    };

    const itemsTotal = q.items
      .filter((item, index) => isLeafItem(item, index, q.items))
      .reduce((sum, item) => sum + item.amount, 0);

    if (q.pricingMethod === 'Cost Plus' && q.marginPercent) {
      subTotal = itemsTotal * (1 + q.marginPercent / 100);
    } else {
      subTotal = itemsTotal;
    }
  }

  const discountAmount = subTotal * (q.discountPercent / 100);
  const additionalChargesTotal = q.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const totalBeforeTax = subTotal - discountAmount + additionalChargesTotal;
  const taxAmount = q.isTaxInclusive ? 0 : totalBeforeTax * (q.taxPercent / 100);
  const grandTotal = totalBeforeTax + taxAmount;

  return {
    subTotal,
    discountAmount,
    additionalChargesTotal,
    totalBeforeTax,
    taxAmount,
    grandTotal
  };
}

export function calculateQuoteTotal(q: Quote) {
  return getQuoteTotalBreakdown(q).grandTotal;
}

export function generateDefaultJobsForItem(item: BOQItem): Job[] {
  if (item.itemType === 'Title') return [];
  
  const baseDate = new Date();
  const jobs: Job[] = [
    {
      id: crypto.randomUUID(),
      title: `Material Procurement: ${item.name || 'New Item'}`,
      description: `Procure materials for ${item.name || 'New Item'}`,
      startDate: baseDate.toISOString().split('T')[0],
      endDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      progress: 0,
      itemId: item.id
    },
    {
      id: crypto.randomUUID(),
      title: `Fabrication: ${item.name || 'New Item'}`,
      description: `Fabricate ${item.name || 'New Item'}`,
      startDate: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      progress: 0,
      itemId: item.id
    },
    {
      id: crypto.randomUUID(),
      title: `Installation: ${item.name || 'New Item'}`,
      description: `Install ${item.name || 'New Item'} at site`,
      startDate: new Date(baseDate.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(baseDate.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      progress: 0,
      itemId: item.id
    }
  ];
  return jobs;
}
