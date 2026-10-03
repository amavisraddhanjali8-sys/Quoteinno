export interface ExtractedEvidenceData {
  date?: string;
  amount?: number;
  reference?: string;
  customerName?: string;
  bankName?: string;
  paymentMethod?: string;
  invoiceNo?: string;
}

export const analyzeEvidence = async (_base64Data: string, _mimeType: string): Promise<ExtractedEvidenceData> => {
  // AI analysis removed as per user request to avoid data usage/AI processing.
  // In a real-world scenario without AI, we might use client-side OCR (like tesseract.js)
  // or simply allow the user to manually enter the data after upload.
  
  console.log("Evidence uploaded. Manual entry required as AI analysis is disabled.");
  
  // Return empty object to prompt manual entry in the UI
  return {};
};
