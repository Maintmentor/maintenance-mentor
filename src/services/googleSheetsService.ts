import { supabase } from '@/lib/supabase';
import { batchService } from './googleSheetsBatchService';

export interface SheetQuery {
  timestamp: string;
  userEmail: string;
  category: string;
  query: string;
  response: string;
}

export interface UserSheet {
  id: string;
  userId: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  createdAt: string;
  lastUpdated: string;
  queryCount: number;
}

export const googleSheetsService = {
  async createUserSheet(userId: string, userEmail: string, userName: string): Promise<UserSheet> {
    try {
      // Check if user already has a sheet
      const { data: existing } = await supabase
        .from('user_google_sheets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        return existing;
      }

      // Create new sheet via edge function
      const { data, error } = await supabase.functions.invoke('google-sheets-logger', {
        body: {
          action: 'create_sheet',
          userId,
          userEmail,
          userName
        }
      });

      if (error) throw error;

      const spreadsheetId = data.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      const sheetName = `Repair Queries - ${userName || userEmail}`;

      // Store in database
      const { data: sheet, error: dbError } = await supabase
        .from('user_google_sheets')
        .insert({
          user_id: userId,
          spreadsheet_id: spreadsheetId,
          spreadsheet_url: spreadsheetUrl,
          sheet_name: sheetName,
          query_count: 0
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return sheet;
    } catch (error) {
      console.error('Error creating user sheet:', error);
      throw error;
    }
  },

  async logQuery(
    userId: string,
    query: string,
    category: string,
    response: string,
    userEmail: string,
    useBatch: boolean = true
  ): Promise<void> {
    try {
      // Get user's sheet
      let { data: sheet } = await supabase
        .from('user_google_sheets')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Auto-create sheet if it doesn't exist
      if (!sheet) {
        console.log('📊 Auto-creating Google Sheet for first-time user...');
        
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
          
          const userName = profile?.full_name || userEmail.split('@')[0];
          sheet = await this.createUserSheet(userId, userEmail, userName);
          console.log('✅ Google Sheet auto-created successfully');
        } catch (createError) {
          console.warn('⚠️ Failed to auto-create sheet:', createError);
          return;
        }
      }

      // Use batch queue for better performance
      if (useBatch) {
        await batchService.addToQueue(
          userId,
          sheet.spreadsheet_id,
          userEmail,
          query,
          category,
          response
        );
      } else {
        // Immediate logging (legacy mode)
        const { error } = await supabase.functions.invoke('google-sheets-logger', {
          body: {
            action: 'batch_log',
            logs: [{
              spreadsheetId: sheet.spreadsheet_id,
              userEmail,
              query,
              category,
              response,
              timestamp: new Date().toISOString()
            }]
          }
        });

        if (error) throw error;

        await supabase
          .from('user_google_sheets')
          .update({
            query_count: sheet.query_count + 1,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.warn('Google Sheets logging failed:', error);
    }
  },

  async flushBatchQueue(): Promise<void> {
    await batchService.flush();
  },

  getBatchQueueSize(): number {
    return batchService.getQueueSize();
  },





  async getUserSheet(userId: string): Promise<UserSheet | null> {
    try {
      const { data, error } = await supabase
        .from('user_google_sheets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user sheet:', error);
      return null;
    }
  },

  async getAllSheets(): Promise<UserSheet[]> {
    try {
      const { data, error } = await supabase
        .from('user_google_sheets')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all sheets:', error);
      return [];
    }
  },

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-logger', {
        body: { action: 'test' }
      });

      return !error && data?.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
};
