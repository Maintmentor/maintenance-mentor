import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { documentImportService, ExtractedTerm } from '@/services/documentImportService';
import { vocabularyService } from '@/services/vocabularyService';

interface DocumentImporterProps {
  onTermsImported?: (terms: ExtractedTerm[]) => void;
}

export const DocumentImporter: React.FC<DocumentImporterProps> = ({ onTermsImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [equipmentType, setEquipmentType] = useState('');
  const [domain, setDomain] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedTerms, setExtractedTerms] = useState<ExtractedTerm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const equipmentTypes = [
    'HVAC Systems', 'Electrical Equipment', 'Mechanical Systems',
    'Hydraulic Systems', 'Pneumatic Systems', 'Industrial Machinery',
    'Automotive', 'Plumbing', 'Safety Equipment', 'General Maintenance'
  ];

  const domains = [
    'Manufacturing', 'Construction', 'Automotive', 'Aerospace',
    'Energy', 'Healthcare', 'Transportation', 'General Industrial'
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const processDocument = async () => {
    if (!file || !equipmentType || !domain) {
      setError('Please select a file, equipment type, and domain');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(25);
      const terms = await documentImportService.processDocument(file, equipmentType, domain);
      setProgress(75);
      
      setExtractedTerms(terms);
      setProgress(100);
      setSuccess(true);
      
      onTermsImported?.(terms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const importToVocabulary = async () => {
    try {
      await documentImportService.importTermsToVocabulary(extractedTerms);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import terms');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Glossary Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="document">Select Document</Label>
            <Input
              id="document"
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Equipment Type</Label>
              <Select value={equipmentType} onValueChange={setEquipmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Technical Domain</Label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                Processing document and extracting terms...
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && extractedTerms.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully extracted {extractedTerms.length} technical terms
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={processDocument}
              disabled={!file || !equipmentType || !domain || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Extract Terms'}
            </Button>

            {extractedTerms.length > 0 && (
              <Button onClick={importToVocabulary} variant="outline">
                Import to Vocabulary
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {extractedTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Terms Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {extractedTerms.slice(0, 10).map((term, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{term.term}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {term.category}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Level {term.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{term.definition}</p>
                  <p className="text-xs text-blue-600">/{term.phonetic}/</p>
                </div>
              ))}
              {extractedTerms.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {extractedTerms.length - 10} more terms...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};