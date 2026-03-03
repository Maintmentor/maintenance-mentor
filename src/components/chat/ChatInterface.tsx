import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2, Bot, Camera, Image as ImageIcon, X, MessageSquare, Sparkles, Wrench, Wand2, Save } from 'lucide-react';

import StepByStepGuide from './StepByStepGuide';
import VideoPlayerModal from './VideoPlayerModal';
import ImageUploadPreview from './ImageUploadPreview';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  images?: string[];
  stepImages?: Array<{ stepNumber: number; imageUrl: string }>;
  videos?: Array<any>;
  generatedImage?: string;
  partImages?: Array<{ query: string; url: string; source: string }>;
}

function PartImageDisplay({ part }: { part: { query: string; url: string; source: string } }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imgSrc, setImgSrc] = useState(part.url);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = () => {
    if (retryCount < 1) {
      // Try Google search fallback URL
      const fallbackUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(part.query + ' HVAC part')}`;
      setRetryCount(prev => prev + 1);
      setStatus('error');
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="border-t pt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {part.source === 'Google Images' ? 'Real Product Photo' : part.source}
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {part.query}
        </Badge>
      </div>
      {status === 'error' ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 font-medium">Image unavailable</span>
          </div>
          <p className="text-gray-500 mb-3 text-xs">The product photo could not be loaded. You can search for it directly:</p>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(part.query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs hover:bg-blue-100 transition-colors"
            >
              <ImageIcon className="w-3 h-3" />
              Search Google Images
            </a>
            <button
              onClick={() => {
                setRetryCount(0);
                setStatus('loading');
                setImgSrc(part.url + (part.url.includes('?') ? '&' : '?') + 'retry=' + Date.now());
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={`Real product: ${part.query}`}
          className={`w-full max-w-md rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${status === 'loading' ? 'opacity-50' : ''}`}
          onClick={() => window.open(part.url, '_blank')}
          onLoad={() => setStatus('loaded')}
          onError={handleError}
        />
      )}
    </div>
  );
}

export default function ChatInterface({ conversationId, initialMessage }: any) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing messages from database
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) return;
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const loadedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.created_at),
          images: msg.images || []
        }));
        setMessages(loadedMessages);
      }
    };

    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
      setTimeout(() => handleSend(), 500);
    }
  }, [initialMessage]);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
      toast.success('Images uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload images');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && uploadedImages.length === 0) return;

    setLoading(true);
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

    // Set a client-side timeout as backup
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast.error('Request timed out. Please try again.');
    }, 60000); // 60 second timeout

    try {
      const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
        body: { 
          question: userMsg.content, 
          userId: user?.id, 
          conversationId,
          images: imgs
        }
      });

      clearTimeout(timeoutId);

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to get response');
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        sender: 'ai',
        timestamp: new Date(),
        stepImages: data.stepImages,
        videos: data.videos,
        generatedImage: data.generatedImage,
        partImages: data.partImages
      };

      setMessages(prev => [...prev, aiMsg]);

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        content: userMsg.content,
        role: 'user',
        images: imgs
      });

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        content: aiMsg.content,
        role: 'assistant'
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Chat error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message?.includes('timeout') 
        ? 'Request timed out. Please try again with a shorter question.'
        : error.message?.includes('API') 
        ? 'AI service temporarily unavailable. Please try again.'
        : 'Failed to get response. Please try again.';
      
      toast.error(errorMessage);
      
      // Add error message to chat
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble responding right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };


  const handleGenerateImage = async () => {
    if (!imageGenPrompt.trim()) {
      toast.error('Please enter a description for the image');
      return;
    }

    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-repair-image', {
        body: { prompt: imageGenPrompt }
      });

      if (error) throw error;

      if (data.imageUrl) {
        const aiMsg: Message = {
          id: Date.now().toString(),
          content: `Generated photograph: ${imageGenPrompt}`,
          sender: 'ai',
          timestamp: new Date(),
          generatedImage: data.imageUrl
        };


        setMessages(prev => [...prev, aiMsg]);
        setImageGenPrompt('');
        setShowImageGen(false);
        toast.success('Image generated successfully!');
      }
    } catch (error: any) {
      toast.error('Failed to generate image');
      console.error(error);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSaveDiagram = async (imageUrl: string, prompt: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error('Please sign in to save diagrams');
        return;
      }

      const { error } = await supabase
        .from('saved_diagrams')
        .insert({
          user_id: currentUser.id,
          image_url: imageUrl,
          title: prompt.substring(0, 100),
          description: prompt,
          category: 'general',
          prompt: prompt
        });

      if (error) throw error;

      toast.success('Diagram saved successfully!');
    } catch (error: any) {
      console.error('Error saving diagram:', error);
      toast.error('Failed to save diagram');
    }
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
            <p className="text-sm text-gray-500">Ask questions or upload photos</p>
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
              Ask questions or upload photographs of parts for identification. AI will generate professional photographs of modern parts.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%]`}>
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

                    {/* Display real part images if available */}
                    {msg.partImages && msg.partImages.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {msg.partImages.map((part, idx) => (
                          <PartImageDisplay key={idx} part={part} />
                        ))}
                      </div>
                    )}

                    {/* Fallback to generated image if no real parts found */}
                    {msg.generatedImage && !msg.partImages?.length && (
                      <div className="mt-4 border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">AI Generated Photograph</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveDiagram(msg.generatedImage!, msg.content)}
                            className="text-xs"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                        </div>
                        <div className="relative">
                          <img 
                            src={msg.generatedImage} 
                            alt="AI generated photograph" 
                            className="w-full rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => window.open(msg.generatedImage, '_blank')}
                            onLoad={() => console.log('✅ Image loaded successfully:', msg.generatedImage)}
                            onError={(e) => {
                              console.error('❌ Failed to load generated image:', msg.generatedImage);
                              e.currentTarget.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'p-4 bg-red-50 text-red-600 rounded-lg text-sm';
                              errorDiv.innerHTML = `
                                <p class="font-semibold mb-1">Failed to load image</p>
                                <p class="text-xs">URL: ${msg.generatedImage}</p>
                                <p class="text-xs mt-1">This may be due to CORS or storage access issues.</p>
                              `;
                              e.currentTarget.parentElement?.appendChild(errorDiv);
                            }}
                           />
                        </div>
                       </div>
                    )}



                    {msg.stepImages && <StepByStepGuide steps={msg.stepImages} answer={msg.content} />}
                    {msg.videos && msg.videos.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.videos.map((v: any) => (
                          <Badge key={v.id} variant="secondary">{v.title}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            ))}
          </>
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">AI is analyzing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>


      <div className="border-t bg-white px-4 py-4 shadow-lg">
        <ImageUploadPreview images={uploadedImages} onRemove={(i) => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} />
        
        {/* Image Generation Section */}
        {showImageGen && (
          <Card className="mb-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Generate Custom Photograph</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowImageGen(false)}
                className="ml-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Describe the modern part or system you want to see as a professional photograph
            </p>


            <div className="flex gap-2">
              <Input
                value={imageGenPrompt}
                onChange={(e) => setImageGenPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateImage()}
                placeholder="e.g., photorealistic modern faucet cartridge assembly..."
                disabled={generatingImage}
                className="flex-1"
              />

              <Button 
                onClick={handleGenerateImage}
                disabled={generatingImage || !imageGenPrompt.trim()}
                className="bg-gradient-to-r from-purple-500 to-blue-600"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        <div className="flex gap-2 max-w-4xl mx-auto mt-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="h-12">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowImageGen(!showImageGen)} 
            disabled={generatingImage}
            className="h-12"
            title="Generate custom diagram"
          >
            <Wand2 className="w-5 h-5" />
          </Button>
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question or upload images..." disabled={loading}
            className="flex-1 h-12 text-base" />
          <Button onClick={handleSend} disabled={loading || (!input.trim() && uploadedImages.length === 0)}
            className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
