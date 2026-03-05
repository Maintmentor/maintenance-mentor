import { supabase } from '@/lib/supabase';

export interface DocumentImport {
  id: string;
  filename: string;
  file_size: number;
  equipment_type: string;
  domain: string;
  status: 'processing' | 'completed' | 'failed';
  terms_extracted: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface ExtractedTerm {
  term: string;
  definition: string;
  phonetic: string;
  difficulty: number;
  category: string;
  equipment_types: string[];
  domain: string;
}

class DocumentImportService {
  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Simple text extraction - in production, use PDF.js or similar
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async createImportRecord(filename: string, fileSize: number, equipmentType: string, domain: string): Promise<string> {
    const { data, error } = await supabase
      .from('document_imports')
      .insert({
        filename,
        file_size: fileSize,
        equipment_type: equipmentType,
        domain,
        status: 'processing'
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async processDocument(file: File, equipmentType: string, domain: string): Promise<ExtractedTerm[]> {
    const importId = await this.createImportRecord(file.name, file.size, equipmentType, domain);

    try {
      const documentText = await this.extractTextFromFile(file);
      
      const { data, error } = await supabase.functions.invoke('document-glossary-extractor', {
        body: {
          documentText,
          equipmentType,
          domain
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      // Update import record as completed
      await supabase
        .from('document_imports')
        .update({
          status: 'completed',
          terms_extracted: data.terms.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', importId);

      return data.terms;
    } catch (error) {
      // Update import record as failed
      await supabase
        .from('document_imports')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', importId);

      throw error;
    }
  }

  async importTermsToVocabulary(terms: ExtractedTerm[], collectionId?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Insert terms into vocabulary_terms table
    const termsToInsert = terms.map(term => ({
      term: term.term,
      definition: term.definition,
      phonetic_transcription: term.phonetic,
      difficulty_level: term.difficulty,
      category: term.category,
      equipment_types: term.equipment_types,
      domain: term.domain,
      created_by: user.id,
      collection_id: collectionId
    }));

    const { error } = await supabase
      .from('vocabulary_terms')
      .insert(termsToInsert);

    if (error) throw error;
  }

  async getImportHistory(): Promise<DocumentImport[]> {
    const { data, error } = await supabase
      .from('document_imports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

export const documentImportService = new DocumentImportService();