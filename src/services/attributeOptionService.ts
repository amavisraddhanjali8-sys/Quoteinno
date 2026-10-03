import { AttributeDefinition, AttributeOption } from '../types';
import { MASTER_ATTRIBUTE_DEFINITIONS } from './constructionTemplates';

const STORAGE_KEY = 'innovista_custom_attribute_definitions_v2';

/**
 * Normalizes group IDs to avoid mismatch between grp-glass vs grp-glazing
 */
function normalizeDefinitions(defs: AttributeDefinition[]): AttributeDefinition[] {
  return defs.map(def => {
    let groupId = def.groupId;
    if (groupId === 'grp-glass') groupId = 'grp-glazing';
    return {
      ...def,
      groupId,
      allowedValues: def.allowedValues ? def.allowedValues.map(opt => ({ ...opt })) : []
    };
  });
}

/**
 * Loads attribute definitions from localStorage or falls back to master template
 */
export function getStoredAttributeDefinitions(): AttributeDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeDefinitions(parsed);
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored attribute definitions, falling back to master:', err);
  }

  const initial = normalizeDefinitions(MASTER_ATTRIBUTE_DEFINITIONS);
  saveAttributeDefinitions(initial);
  return initial;
}

/**
 * Saves attribute definitions to localStorage
 */
export function saveAttributeDefinitions(definitions: AttributeDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(definitions));
    // Dispatch custom event for reactive cross-component synchronization
    window.dispatchEvent(new CustomEvent('innovista:attribute-definitions-updated', {
      detail: { definitions }
    }));
  } catch (err) {
    console.error('Failed to save attribute definitions to localStorage:', err);
  }
}

/**
 * Adds a new value/option to a specific attribute definition and saves it
 */
export function addOptionToAttribute(
  attributeCode: string,
  newOption: { label: string; codeSuffix?: string; description?: string }
): { definitions: AttributeDefinition[]; createdOption: AttributeOption } {
  const currentDefs = getStoredAttributeDefinitions();
  const defIndex = currentDefs.findIndex(d => d.code === attributeCode);
  
  if (defIndex === -1) {
    throw new Error(`Attribute definition with code "${attributeCode}" not found.`);
  }

  const targetDef = { ...currentDefs[defIndex] };
  const existingOptions = targetDef.allowedValues ? [...targetDef.allowedValues] : [];

  // Check if option with same label already exists
  const trimmedLabel = newOption.label.trim();
  const existingMatch = existingOptions.find(
    o => o.label.toLowerCase() === trimmedLabel.toLowerCase()
  );

  if (existingMatch) {
    // Return existing without duplicating
    return {
      definitions: currentDefs,
      createdOption: existingMatch
    };
  }

  // Generate unique ID and code suffix if not provided
  const generatedId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let suffix = (newOption.codeSuffix || '').trim().toUpperCase();
  if (!suffix) {
    // Auto-generate code suffix from label
    const words = trimmedLabel.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      suffix = words[0].substring(0, 4).toUpperCase();
    } else {
      suffix = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
    }
  }

  const createdOption: AttributeOption = {
    id: generatedId,
    label: trimmedLabel,
    codeSuffix: suffix,
    description: newOption.description?.trim()
  };

  targetDef.allowedValues = [...existingOptions, createdOption];
  currentDefs[defIndex] = targetDef;

  saveAttributeDefinitions(currentDefs);
  return { definitions: currentDefs, createdOption };
}

/**
 * Updates an existing option label or code suffix in an attribute definition
 */
export function updateOptionInAttribute(
  attributeCode: string,
  optionId: string,
  updates: { label: string; codeSuffix?: string; description?: string }
): { definitions: AttributeDefinition[]; updatedOption: AttributeOption | null } {
  const currentDefs = getStoredAttributeDefinitions();
  const defIndex = currentDefs.findIndex(d => d.code === attributeCode);

  if (defIndex === -1) {
    throw new Error(`Attribute definition with code "${attributeCode}" not found.`);
  }

  const targetDef = { ...currentDefs[defIndex] };
  const existingOptions = targetDef.allowedValues ? [...targetDef.allowedValues] : [];
  const optIndex = existingOptions.findIndex(o => o.id === optionId);

  if (optIndex === -1) {
    return { definitions: currentDefs, updatedOption: null };
  }

  const updatedOption: AttributeOption = {
    ...existingOptions[optIndex],
    label: updates.label.trim(),
    codeSuffix: (updates.codeSuffix || '').trim().toUpperCase(),
    description: updates.description !== undefined ? updates.description.trim() : existingOptions[optIndex].description
  };

  existingOptions[optIndex] = updatedOption;
  targetDef.allowedValues = existingOptions;
  currentDefs[defIndex] = targetDef;

  saveAttributeDefinitions(currentDefs);
  return { definitions: currentDefs, updatedOption };
}

/**
 * Deletes an option from an attribute definition
 */
export function deleteOptionFromAttribute(
  attributeCode: string,
  optionId: string
): { definitions: AttributeDefinition[]; deletedOption: AttributeOption | null } {
  const currentDefs = getStoredAttributeDefinitions();
  const defIndex = currentDefs.findIndex(d => d.code === attributeCode);

  if (defIndex === -1) {
    throw new Error(`Attribute definition with code "${attributeCode}" not found.`);
  }

  const targetDef = { ...currentDefs[defIndex] };
  const existingOptions = targetDef.allowedValues ? [...targetDef.allowedValues] : [];
  const optToDelete = existingOptions.find(o => o.id === optionId) || null;

  targetDef.allowedValues = existingOptions.filter(o => o.id !== optionId);
  currentDefs[defIndex] = targetDef;

  saveAttributeDefinitions(currentDefs);
  return { definitions: currentDefs, deletedOption: optToDelete };
}

/**
 * Resets a single attribute's options back to the master template defaults
 */
export function resetAttributeToDefault(attributeCode: string): AttributeDefinition[] {
  const currentDefs = getStoredAttributeDefinitions();
  const masterDef = MASTER_ATTRIBUTE_DEFINITIONS.find(d => d.code === attributeCode);
  
  if (!masterDef) {
    return currentDefs;
  }

  const defIndex = currentDefs.findIndex(d => d.code === attributeCode);
  if (defIndex !== -1) {
    currentDefs[defIndex] = {
      ...masterDef,
      allowedValues: masterDef.allowedValues ? masterDef.allowedValues.map(o => ({ ...o })) : []
    };
    saveAttributeDefinitions(currentDefs);
  }

  return currentDefs;
}

/**
 * Resets all attributes back to master defaults
 */
export function resetAllAttributesToDefault(): AttributeDefinition[] {
  const initial = normalizeDefinitions(MASTER_ATTRIBUTE_DEFINITIONS);
  saveAttributeDefinitions(initial);
  return initial;
}
