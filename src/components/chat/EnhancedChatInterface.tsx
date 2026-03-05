import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2, Bot, Image as ImageIcon, X, Sparkles, Wrench, Wand2, Save, AlertCircle, ThumbsUp, ThumbsDown, Eye, Search, ShoppingCart, Camera, Mic } from 'lucide-react';

import { toast } from 'sonner';
import { imageFeedbackService } from '@/services/imageFeedbackService';
import { ObjectDetectionOverlay } from './ObjectDetectionOverlay';
import { ImageDisplay } from './ImageDisplay';
import { googleSheetsService } from '@/services/googleSheetsService';
import ImageUploadModal from './ImageUploadModal';
import VoiceInput from './VoiceInput';



interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  images?: string[];
  generatedImage?: string;
  partImages?: Array<{ 
    query: string; 
    url: string; 
    source: string;
    verificationScore?: number;
    verificationReasoning?: string;
    feedback?: 'positive' | 'negative';
  }>;
}


export default function EnhancedChatInterface({ conversationId, initialMessage }: any) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Utility function for delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImagesFromModal = async (files: File[]) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${user?.id}/${Date.now()}_${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('repair-photos')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('repair-photos')
          .getPublicUrl(fileName);

        urls.push(publicUrl);
      }
      
      setUploadedImages(prev => [...prev, ...urls]);
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`);
    } catch (error: any) {
      toast.error('Failed to upload images');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleImagesFromModal(Array.from(files));
  };


  const handleSend = async () => {
    if (!input.trim() && uploadedImages.length === 0) return;

    setLoading(true);
    setRetryAttempt(0);
    const userMsg: Message = {
      id: Date.now().toString(),
      content: input || 'Please analyze these images',
      sender: 'user',
      timestamp: new Date(),
      images: uploadedImages
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imgs = uploadedImages;
    setUploadedImages([]);

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 3000, 5000]; // 1s, 3s, 5s

    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          setRetryAttempt(attempt);
          console.log(`🔄 Retry attempt ${attempt + 1}/${MAX_RETRIES}`);
          toast.info(`Retrying connection... (Attempt ${attempt + 1}/${MAX_RETRIES})`, {
            duration: 2000,
            id: 'retry-toast'
          });
          await sleep(RETRY_DELAYS[attempt - 1]);
        }
        console.log('🚀 Invoking repair-diagnostic function...');
        console.log('📤 Request payload:', { 
          question: userMsg.content, 
          userId: user?.id, 
          conversationId,
          images: imgs,
          imageCount: imgs.length 
        });
        
        const startTime = Date.now();
        
        // Call with explicit error handling
        let data, error;
        try {
          const response = await supabase.functions.invoke('repair-diagnostic', {
            body: { 
              question: userMsg.content, 
              userId: user?.id, 
              conversationId,
              images: imgs
            }
          });
          data = response.data;
          error = response.error;
        } catch (fetchError: any) {
          console.error('❌ Network/Fetch error:', fetchError);
          error = {
            message: fetchError.message || 'Network connection failed',
            name: 'NetworkError'
          };
        }
        
        const duration = Date.now() - startTime;


        console.log(`⏱️ Function completed in ${duration}ms`);
        console.log('📥 Function response:', { data, error });

        if (error) {
          console.error('❌ Edge function error details:', {
            message: error.message,
            name: error.name,
            context: error.context,
            stack: error.stack,
            fullError: JSON.stringify(error, null, 2),
            attempt: attempt + 1
          });
          
          lastError = error;
          
          // If this is not the last attempt, continue to retry
          if (attempt < MAX_RETRIES - 1) {
            continue;
          }
          
          // Last attempt failed, show error
          const errorMsg = error.message || 'Unknown error';
          const errorContext = error.context ? JSON.stringify(error.context) : '';
          
          toast.error('Edge Function Error', {
            duration: 10000,
            description: `${errorMsg}\n${errorContext}`
          });
          
          throw new Error(`Edge function error: ${errorMsg}`);
        }

        if (!data) {
          console.error('❌ No data returned from edge function');
          lastError = new Error('No data returned from AI service');
          
          if (attempt < MAX_RETRIES - 1) {
            continue;
          }
          
          throw lastError;
        }

        console.log('✅ Data received:', {
          success: data.success,
          hasAnswer: !!data.answer,
          answerLength: data.answer?.length,
          hasGeneratedImage: !!data.generatedImage,
          partImagesCount: data.partImages?.length || 0,
          error: data.error
        });

        if (!data.success) {
          console.error('❌ Function returned success: false', data.error);
          lastError = new Error(data.error || 'AI service returned an error');
          
          if (attempt < MAX_RETRIES - 1) {
            continue;
          }
          
          throw lastError;
        }

        // Success! Clear retry state and show success message
        setRetryAttempt(0);
        if (attempt > 0) {
          toast.success('Connection successful!', {
            duration: 2000,
            id: 'retry-toast'
          });
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: data.answer || 'No response received',
          sender: 'ai',
          timestamp: new Date(),
          generatedImage: data.generatedImage,
          partImages: data.partImages || []
        };

        console.log('💬 AI message created:', {
          contentLength: aiMsg.content.length,
          hasGeneratedImage: !!aiMsg.generatedImage,
          partImagesCount: aiMsg.partImages.length
        });

        setMessages(prev => [...prev, aiMsg]);

        // Log to Google Sheets (non-blocking)
        if (user?.id && user?.email) {
          googleSheetsService.logQuery(
            user.id,
            userMsg.content,
            'Repair Query',
            aiMsg.content,
            user.email
          ).catch(error => {
            console.error('⚠️ Google Sheets logging error:', error);
          });
        }

        // Save to database (non-blocking)
        supabase.from('messages').insert([
          { conversation_id: conversationId, content: userMsg.content, role: 'user', images: imgs },
          { conversation_id: conversationId, content: aiMsg.content, role: 'assistant' }
        ]).then(({ error: dbError }) => {
          if (dbError) {
            console.error('⚠️ Database save error:', dbError);
          } else {
            console.log('✅ Messages saved to database');
          }
        });

        // Success - break out of retry loop
        setLoading(false);
        return;

      } catch (error: any) {
        lastError = error;
        console.error(`💥 Chat error (attempt ${attempt + 1}/${MAX_RETRIES}):`, {
          message: error.message,
          name: error.name,
          stack: error.stack,
          fullError: JSON.stringify(error, null, 2)
        });
        
        // If this is not the last attempt, continue to retry
        if (attempt < MAX_RETRIES - 1) {
          continue;
        }
      }
    }

    // All retries failed
    setRetryAttempt(0);
    setLoading(false);
    
    toast.error('Connection Failed', {
      duration: 8000,
      description: lastError?.message || 'The AI service is temporarily unavailable after 3 attempts. Please wait 30 seconds and try again.'
    });
    
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      content: '⚠️ Unable to connect to AI service after 3 retry attempts.\n\n' +
               '🔄 Error Details:\n' +
               `${lastError?.message || 'Connection timeout'}\n\n` +
               '✅ Please try again in 30 seconds.\n\n' +
               'If the problem persists, check the browser console (F12) for detailed error logs.',
      sender: 'ai',
      timestamp: new Date()
    }]);
  };









  const handleGeneratePartImage = async (partDescription: string) => {
    setGeneratingImage(true);
    try {
      console.log('Generating image for:', partDescription);
      
      const { data, error } = await supabase.functions.invoke('generate-repair-image', {
        body: { prompt: `professional product photograph of ${partDescription}, white background, detailed, realistic` }
      });

      if (error) throw error;

      if (data.imageUrl) {
        const aiMsg: Message = {
          id: Date.now().toString(),
          content: `Generated image for: ${partDescription}`,
          sender: 'ai',
          timestamp: new Date(),
          generatedImage: data.imageUrl
        };

        setMessages(prev => [...prev, aiMsg]);
        toast.success('Image generated!');
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleImageFeedback = async (messageId: string, partIdx: number, feedbackType: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.partImages) {
        const updatedPartImages = [...msg.partImages];
        updatedPartImages[partIdx] = {
          ...updatedPartImages[partIdx],
          feedback: feedbackType
        };
        return { ...msg, partImages: updatedPartImages };
      }
      return msg;
    }));

    const message = messages.find(m => m.id === messageId);
    const part = message?.partImages?.[partIdx];
    
    if (part) {
      const result = await imageFeedbackService.submitFeedback({
        message_id: messageId,
        part_number: part.query,
        image_url: part.url,
        search_query: part.query,
        feedback_type: feedbackType,
        ai_verification_score: part.verificationScore,
        ai_verification_reasoning: part.verificationReasoning
      });

      if (result.success) {
        toast.success(`Feedback recorded! This helps improve image accuracy.`);
      } else {
        toast.error('Failed to save feedback');
      }
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(prev => prev ? `${prev} ${transcript}` : transcript);
  };



  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">AI Maintenance Assistant</h2>
            <p className="text-sm text-gray-500">Real product photos & AI assistance</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h3>
            <p className="text-gray-600 max-w-md">
              Ask repair questions and I'll show you real product photos from the internet, or generate AI images when needed.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">AI Assistant</span>
                  </div>
                )}
                
                <Card className={`p-4 ${msg.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-white'}`}>
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {msg.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-24 h-24 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Real Part Images with Better Display */}
                  {msg.partImages && msg.partImages.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700">Product Images Found:</span>
                        <Badge variant="secondary" className="text-xs">
                          {msg.partImages.length} result{msg.partImages.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {msg.partImages.map((part, idx) => (
                          <ImageDisplay
                            key={idx}
                            url={part.url}
                            query={part.query}
                            source={part.source}
                            verificationScore={part.verificationScore}
                            onRetry={async () => {
                              // Retry fetching the image
                              const { data } = await supabase.functions.invoke('fetch-real-part-images-cached', {
                                body: { query: part.query }
                              });
                              if (data?.success && data?.image) {
                                setMessages(prev => prev.map(m => {
                                  if (m.id === msg.id && m.partImages) {
                                    const updated = [...m.partImages];
                                    updated[idx] = {
                                      ...updated[idx],
                                      url: data.image,
                                      source: data.source || 'Google Images'
                                    };
                                    return { ...m, partImages: updated };
                                  }
                                  return m;
                                }));
                                toast.success('Image refreshed');
                              }
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Shopping Links */}
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingCart className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Where to Buy:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.partImages.map((part, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => window.open(`https://www.homedepot.com/s/${encodeURIComponent(part.query)}`, '_blank')}
                              >
                                Home Depot
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => window.open(`https://www.lowes.com/search?searchTerm=${encodeURIComponent(part.query)}`, '_blank')}
                              >
                                Lowe's
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => window.open(`https://www.amazon.com/s?k=${encodeURIComponent(part.query)}`, '_blank')}
                              >
                                Amazon
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Feedback Section */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-xs text-gray-600">Were these images helpful?</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            toast.success('Thank you for your feedback!');
                            // Track positive feedback
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            toast.info('We\'ll work on improving our image search');
                            // Track negative feedback
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          No
                        </Button>
                      </div>
                    </div>
                  )}



                  {/* Fallback Generated Image */}
                  {msg.generatedImage && (!msg.partImages || msg.partImages.length === 0) && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">AI Generated Image</span>
                      </div>
                      <img 
                        src={msg.generatedImage} 
                        alt="AI generated" 
                        className="w-full rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => window.open(msg.generatedImage, '_blank')}
                      />
                    </div>
                  )}

                  {/* No images warning */}
                  {msg.sender === 'ai' && !msg.generatedImage && (!msg.partImages || msg.partImages.length === 0) && (
                    <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>No images available for this response</span>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">
                  {retryAttempt > 0 
                    ? `Retrying connection... (Attempt ${retryAttempt + 1}/3)` 
                    : 'Analyzing and fetching real product images...'}
                </span>
                {retryAttempt > 0 && (
                  <span className="text-xs text-gray-500 mt-1">
                    Please wait, attempting to reconnect...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white px-4 py-4 shadow-lg">
        {uploadedImages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                <button
                  onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 max-w-4xl mx-auto">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          <Button 
            variant="outline" 
            onClick={() => setShowImageModal(true)} 
            disabled={uploading} 
            className="h-12"
            title="Take photo or upload image"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          </Button>
          <VoiceInput 
            onTranscript={handleVoiceTranscript}
            disabled={loading}
          />
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about repairs or use voice input..." 
            disabled={loading}
            className="flex-1 h-12 text-base" 
          />
          <Button 
            onClick={handleSend} 
            disabled={loading || (!input.trim() && uploadedImages.length === 0)}
            className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>

      </div>

      <ImageUploadModal 
        open={showImageModal} 
        onClose={() => setShowImageModal(false)}
        onImagesSelected={handleImagesFromModal}
      />
    </div>
  );
}
