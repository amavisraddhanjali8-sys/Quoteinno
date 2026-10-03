import { GoogleGenAI, Type } from "@google/genai";
import { BOQItem, ItemSpecification, Term, Job, MeasurementRow, CalculationMethod, Project } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const enhanceItemDescription = async (item: Partial<BOQItem>): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Enhance and complete the following BOQ item description for a construction/engineering quotation. 
      Item Name: ${item.name}
      Current Description: ${item.description}
      Category: ${item.category}
      Unit: ${item.unit}
      
      Provide a professional, detailed technical description that includes materials, standards, and scope. 
      Keep it concise but comprehensive. Return ONLY the enhanced description text.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("AI Enhance Item Description failed:", error);
    return item.description || "";
  }
};

export const enhanceSpecification = async (item: BOQItem, currentSpec: ItemSpecification): Promise<ItemSpecification> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Complete and enhance the technical specification for this item:
      Item: ${item.name}
      Category: ${item.category}
      Current Spec: ${JSON.stringify(currentSpec)}
      
      Fill in missing technical details like fabrication methods, finishing, quality standards, testing, and installation scope based on industry best practices for ${item.category} works.
      Return the updated specification as a JSON object matching the provided structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            core: {
              type: Type.OBJECT,
              properties: {
                systemType: { type: Type.STRING },
                location: { type: Type.STRING },
                reference: { type: Type.STRING }
              }
            },
            dimensions: {
              type: Type.OBJECT,
              properties: {
                width: { type: Type.STRING },
                height: { type: Type.STRING },
                panels: { type: Type.STRING },
                opening: { type: Type.STRING }
              }
            },
            functional: { type: Type.STRING },
            fabrication: { type: Type.STRING },
            finishing: { type: Type.STRING },
            installation: { type: Type.STRING },
            exclusions: { type: Type.STRING },
            siteConditions: { type: Type.STRING },
            quality: { type: Type.STRING },
            testing: { type: Type.STRING },
            warranty: { type: Type.STRING },
            delivery: { type: Type.STRING },
            notes: { type: Type.STRING }
          }
        }
      }
    });
    
    const enhanced = JSON.parse(response.text.trim());
    return {
      ...currentSpec,
      ...enhanced,
      materials: currentSpec.materials // Keep current materials as they are specific
    };
  } catch (error) {
    console.error("AI Enhance Specification failed:", error);
    return currentSpec;
  }
};

export const enhanceTerms = async (terms: Term[]): Promise<Term[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Review, complete, and enhance these contract terms and conditions for a construction quotation in Sri Lanka. 
      Current Terms: ${JSON.stringify(terms)}
      
      Improve the legal clarity, professional tone, and ensure they cover critical aspects like payment, variations, force majeure, and dispute resolution. 
      Return the updated terms as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              no: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              isActive: { type: Type.BOOLEAN }
            },
            required: ["id", "no", "title", "content", "isActive"]
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("AI Enhance Terms failed:", error);
    return terms;
  }
};

export const generateSmartTimeline = async (projectName: string, items: BOQItem[]): Promise<Job[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a logical project timeline (sequence of jobs) for the project: "${projectName}".
      Items included: ${items.map(i => `${i.no}. ${i.name} (${i.qty} ${i.unit})`).join(", ")}
      
      Create a sequence of jobs including procurement, fabrication, site preparation, and installation. 
      Ensure dates are realistic and sequential. Start from today.
      Return a JSON array of jobs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              startDate: { type: Type.STRING, description: "ISO date string YYYY-MM-DD" },
              endDate: { type: Type.STRING, description: "ISO date string YYYY-MM-DD" },
              status: { type: Type.STRING, enum: ["Pending", "In Progress", "Completed", "Delayed"] },
              progress: { type: Type.NUMBER },
              itemId: { type: Type.STRING, description: "ID of the linked BOQ item if applicable" }
            },
            required: ["title", "description", "startDate", "endDate", "status", "progress"]
          }
        }
      }
    });
    
    const jobs = JSON.parse(response.text.trim());
    return jobs.map((j: any) => ({
      ...j,
      id: crypto.randomUUID()
    }));
  } catch (error) {
    console.error("AI Generate Timeline failed:", error);
    return [];
  }
};

export const enhanceMeasurements = async (item: BOQItem, currentMethod: CalculationMethod): Promise<MeasurementRow[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As a professional quantity surveyor, suggest a set of measurement rows for the following BOQ item:
      Item: ${item.name}
      Description: ${item.description}
      Calculation Method: ${currentMethod}
      
      Provide a list of measurement rows that would be typical for this kind of work.
      Each row should have:
      - description: A clear description of the part being measured.
      - count: Number of items (default 1).
      - length: Length in meters.
      - width: Width in meters (if applicable).
      - height: Height/Depth in meters (if applicable).
      - shape: One of 'Rectangle', 'Triangle', 'Circle', 'Trapezoid', 'Ellipse', 'Sector', 'Solid'.
      
      Return the result as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              count: { type: Type.NUMBER },
              length: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
              shape: { type: Type.STRING, enum: ['Rectangle', 'Triangle', 'Circle', 'Trapezoid', 'Ellipse', 'Sector', 'Solid'] }
            },
            required: ["description", "count", "length", "width", "height", "shape"]
          }
        }
      }
    });
    
    const suggestedRows = JSON.parse(response.text.trim());
    return suggestedRows.map((row: any) => ({
      ...row,
      id: crypto.randomUUID(),
      isDeduction: false,
      total: 0
    }));
  } catch (error) {
    console.error("AI Enhance Measurements failed:", error);
    return [];
  }
};

export const enhanceVariation = async (project: Project, item: BOQItem): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As a project manager, provide a professional justification/description for a variation in project: "${project.projectName}".
      Item: ${item.name}
      Current Status: ${item.variationStatus}
      
      Explain why this variation was necessary (e.g., site conditions, client request, design change) and how it impacts the project.
      Keep it professional and concise. Return ONLY the justification text.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("AI Enhance Variation failed:", error);
    return "";
  }
};

export const enhanceProjectNotes = async (projectName: string, currentNotes: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Enhance and complete the project description/notes for: "${projectName}".
      Current Notes: ${currentNotes}
      
      Provide a professional, detailed project overview that includes site conditions, scope of work, and key objectives. 
      Keep it concise but comprehensive. Return ONLY the enhanced notes text.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("AI Enhance Project Notes failed:", error);
    return currentNotes;
  }
};

export interface AIBOQSpecRequest {
  itemName: string;
  itemCode?: string;
  category?: string;
  params: Record<string, string | string[] | any>;
  customFields?: { label: string; value: string }[];
  tone?: 'standard' | 'fidic' | 'luxury' | 'value_engineered' | 'marine_coastal';
}

export interface AIBOQSpecResult {
  boqDescription: string;
  tenderClause: string;
  keyHighlights: string[];
}

export const generateAIBOQSpecification = async (request: AIBOQSpecRequest): Promise<AIBOQSpecResult> => {
  try {
    const toneInstructions = {
      standard: "Professional architectural & civil engineering tender standard conforming to BS / SLS norms.",
      fidic: "Strict FIDIC civil engineering contract specification format with rigorous material compliance, testing clauses, and contractor warranties.",
      luxury: "Ultra-premium architectural specification emphasizing aesthetics, seamless sightlines, precision tolerances, and world-class finishes.",
      value_engineered: "Value-engineered commercial specification balancing high performance with cost-efficiency and standard fabrication ease.",
      marine_coastal: "Heavy-duty coastal and marine environment specification with anti-corrosive coatings, 316-grade fasteners, and severe weather seals."
    }[request.tone || 'standard'];

    const prompt = `You are a master Chartered Structural / Architectural Quantity Surveyor and Façade Engineer.
Generate an authoritative, construction-ready Bill of Quantities (BOQ) description and full tender specification clause for the following item:

Item Name: ${request.itemName}
Item Code: ${request.itemCode || 'BOQ-ITEM'}
Category: ${request.category || 'Architectural Aluminium & Glazing'}
Tone/Style Requirement: ${toneInstructions}

Input Specification Parameters:
${JSON.stringify(request.params, null, 2)}

${request.customFields && request.customFields.length > 0 ? `Additional Custom Requirements:\n${JSON.stringify(request.customFields, null, 2)}` : ''}

Generate:
1. boqDescription: A concise, professional BOQ line item description (3-6 sentences) suitable for quoting and bill of quantities item schedules, covering profile system, alloy, wall thickness, finish, glass configuration, hardware, weatherseals, sealant, standards, and scope of installation.
2. tenderClause: A comprehensive 8-section legal and architectural tender specification clause with numbered sections (1.0 Scope, 2.0 Metallurgy & Profiles, 3.0 Surface Finish, 4.0 Glazing & Acoustics, 5.0 Hardware & Accessories, 6.0 Weatherproofing & Gaskets, 7.0 Codes & Compliance Standards, 8.0 Warranty & Guarantee).
3. keyHighlights: An array of 4-6 key engineering bullet points.

Return strictly a valid JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            boqDescription: { type: Type.STRING },
            tenderClause: { type: Type.STRING },
            keyHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["boqDescription", "tenderClause", "keyHighlights"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("AI Specification Generation failed:", error);
    throw error;
  }
};

