
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, Sparkles, Minus, Plus, ChevronDown, 
  Upload, Send, Mic, Maximize2, Minimize2, Loader2, FileText, CheckCircle2, Save, Type, Eye, AlertCircle, RotateCcw, Key
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { BookMetadata } from '../App.tsx';

// PDF.js for client-side text extraction
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

interface EditorViewProps {
  onBack: () => void;
  bookId: string;
  initialTitle: string;
  onMetadataUpdate: (metadata: BookMetadata) => void;
  customKeys: string[];
}

type Tab = 'hinglish' | 'explain' | 'summary' | 'chat';
type LeftTab = 'create' | 'file';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  pages: string[];
}

const DEFAULT_PAGES = [
  `Welcome to your new Book! 

Start by writing content here or upload a document to get started. Use the navigation buttons above to move between pages.

You can use the AI tabs on the right to translate, explain, or summarize your content.`,
];

export const EditorView: React.FC<EditorViewProps> = ({ onBack, bookId, initialTitle, onMetadataUpdate, customKeys }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('hinglish');
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('create');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  
  // Tracking active key for rotation
  const activeKeyIndexRef = useRef(0);
  const [rotationTrigger, setRotationTrigger] = useState(0); // For UI updates
  const [rotationNotice, setRotationNotice] = useState<string | null>(null);
  
  // Book content state
  const [pages, setPages] = useState<string[]>(DEFAULT_PAGES);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // AI states
  const [aiOutputs, setAiOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentContent = pages[currentPage - 1] || "";

  /**
   * Gemini API call with auto-rotation logic.
   * Switches to the next key if current key reaches quota (429).
   */
  const callWithRotation = useCallback(async (contents: any, model = 'gemini-3-flash-preview') => {
    const validKeys = customKeys.filter(k => k.trim().length > 0);
    
    if (validKeys.length === 0) {
      throw new Error("No API keys found. Please add your Gemini keys in the sidebar manager.");
    }

    const startIdx = activeKeyIndexRef.current % validKeys.length;
    let currentIdx = startIdx;
    let attempts = 0;

    while (attempts < validKeys.length) {
      const apiKey = validKeys[currentIdx];
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({ model, contents });
        activeKeyIndexRef.current = currentIdx; // Persist successful index
        setRotationTrigger(prev => prev + 1);
        return response;
      } catch (error: any) {
        console.warn(`Attempt with key #${currentIdx + 1} failed:`, error);
        
        const errorMsg = (error?.message || "").toLowerCase();
        const isQuota = error?.status === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('exhausted');

        if (isQuota && attempts < validKeys.length - 1) {
          // Switch to next key
          currentIdx = (currentIdx + 1) % validKeys.length;
          attempts++;
          setRotationNotice(`Key #${startIdx + 1} exhausted. Rotating...`);
          setTimeout(() => setRotationNotice(null), 3000);
          continue;
        }

        throw error;
      }
    }
    throw new Error("All configured API keys have reached their quota limits.");
  }, [customKeys]);

  // Load existing data
  useEffect(() => {
    const savedData = localStorage.getItem(`muai_book_data_${bookId}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setPages(parsed.pages || DEFAULT_PAGES);
      setAiOutputs(parsed.outputs || {});
      setChatHistory(parsed.chatHistory || []);
      if (parsed.files) setFiles(parsed.files);
    }
  }, [bookId]);

  // Persist local state
  useEffect(() => {
    const data = { pages, outputs: aiOutputs, chatHistory, files };
    localStorage.setItem(`muai_book_data_${bookId}`, JSON.stringify(data));
  }, [pages, aiOutputs, chatHistory, files, bookId]);

  const handleManualSave = () => {
    setIsSaving(true);
    const metadata: BookMetadata = {
      id: bookId,
      title: title,
      description: pages[0]?.slice(0, 100).replace(/\n/g, ' ') + '...',
      createdAt: Date.now(),
    };
    onMetadataUpdate(metadata);
    setTimeout(() => {
      setIsSaving(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    }, 800);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      let extractedPages: string[] = [];
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedPages.push(textContent.items.map((item: any) => item.str).join(' '));
        }
      } else {
        const text = await file.text();
        extractedPages = [text];
      }
      setFiles(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: file.name, type: file.type, pages: extractedPages }]);
      setPages(extractedPages);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const generateAIContent = async (tab: Tab) => {
    if (tab === 'chat' || !currentContent) return;
    const contentHint = currentContent.slice(0, 30).replace(/\W/g, '');
    const cacheKey = `${tab}-p${currentPage}-${contentHint}`;
    
    if (aiOutputs[cacheKey]) {
      setApiError(null);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      let prompt = "";
      if (tab === 'hinglish') {
        prompt = `Translate the following to natural Hinglish with Hindi grammar. USE **Bold Titles** for sections. Text: ${currentContent}`;
      } else if (tab === 'explain') {
        prompt = `Explain these concepts simply with analogies. USE **Bold Titles**. Text: ${currentContent}`;
      } else if (tab === 'summary') {
        prompt = `Summarize into bullet points. Text: ${currentContent}`;
      }

      const response = await callWithRotation(prompt);
      setAiOutputs(prev => ({ ...prev, [cacheKey]: response.text || "" }));
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAIContent(activeTab);
  }, [currentPage, activeTab, pages, customKeys]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || loading) return;
    const userText = chatMessage;
    setChatMessage('');
    setLoading(true);
    setApiError(null);
    if (activeTab !== 'chat') setActiveTab('chat');

    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);

    try {
      const response = await callWithRotation(`Context: Book "${title}". Page ${currentPage}: "${currentContent}"\n\nQuestion: ${userText}`);
      setChatHistory(prev => [...prev, { role: 'ai', text: response.text || "No response received." }]);
    } catch (error: any) {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: `**ERROR:** ${error.message}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentOutput = () => {
    const contentHint = currentContent.slice(0, 30).replace(/\W/g, '');
    const cacheKey = `${activeTab}-p${currentPage}-${contentHint}`;
    return aiOutputs[cacheKey] || "";
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/);
      const formattedLine = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-gray-900 font-extrabold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      if (line.trim() === '') return <div key={idx} className="h-6" />;
      return <p key={idx} className="mb-4 leading-relaxed text-gray-700">{formattedLine}</p>;
    });
  };

  const currentKeyDisplay = customKeys.length > 0 ? (activeKeyIndexRef.current % customKeys.length) + 1 : 0;

  return (
    <div className="flex flex-col h-screen bg-white">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt" />

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0 z-50 bg-white">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Sparkles size={16} />
            </div>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-black text-gray-900 bg-transparent border-none focus:ring-0 w-48"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {customKeys.length > 0 && (
            <div className="bg-teal-50 text-[#00897b] px-3 py-1.5 rounded-full border border-teal-100 flex items-center gap-2">
              <Key size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Key #{currentKeyDisplay}</span>
            </div>
          )}
          <button 
            onClick={handleManualSave}
            disabled={isSaving}
            className="bg-[#00897b] text-white px-5 py-2 rounded-xl font-black text-xs shadow-lg shadow-teal-50 flex items-center gap-2 hover:bg-[#00796b] transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Save Book
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4 bg-[#fcfdfe] relative">
        {/* Rotation Notice */}
        {rotationNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-orange-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl animate-in slide-in-from-top-4 fade-in">
            {rotationNotice}
          </div>
        )}

        {!isFullscreen && (
          <div className="w-[300px] flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex gap-4 border-b border-gray-100 pb-1.5">
                <button onClick={() => setActiveLeftTab('create')} className={`font-black text-[10px] uppercase tracking-widest border-b-2 pb-1.5 ${activeLeftTab === 'create' ? 'text-[#00897b] border-[#00897b]' : 'text-gray-400 border-transparent'}`}>Content</button>
                <button onClick={() => setActiveLeftTab('file')} className={`font-black text-[10px] uppercase tracking-widest border-b-2 pb-1.5 ${activeLeftTab === 'file' ? 'text-[#00897b] border-[#00897b]' : 'text-gray-400 border-transparent'}`}>Files</button>
              </div>
              <div className="flex items-center bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 text-gray-400"><Minus size={12} /></button>
                <span className="px-2 text-[10px] font-black text-gray-700">{currentPage}</span>
                <button onClick={() => setCurrentPage(p => Math.min(pages.length, p + 1))} className="p-1 text-gray-400"><Plus size={12} /></button>
              </div>
            </div>

            {activeLeftTab === 'create' ? (
              <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                <div className="bg-[#e9f3f9] rounded-3xl flex-1 p-5 overflow-hidden border border-blue-50">
                  <div className="flex-1 h-full overflow-y-auto pr-1 custom-scrollbar text-xs text-gray-600 leading-relaxed font-semibold">
                    {currentContent}
                  </div>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center justify-center gap-2 shadow-sm text-[10px] font-black uppercase text-teal-600 tracking-widest hover:bg-teal-50 transition-colors">
                   <Upload size={14} /> New Source
                </button>
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 overflow-y-auto custom-scrollbar shadow-sm">
                {files.length === 0 ? <p className="text-[10px] text-center text-gray-300 py-10 uppercase font-black">Empty</p> : 
                  files.map(file => (
                    <div key={file.id} onClick={() => {setPages(file.pages); setCurrentPage(1); setActiveLeftTab('create');}} className="bg-gray-50 p-3 rounded-xl mb-2 cursor-pointer hover:border-teal-300 border border-transparent transition-all">
                      <p className="text-[11px] font-black text-gray-700 truncate">{file.name}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">{file.pages.length} Pages</p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        <div className={`flex flex-col transition-all duration-500 ${isFullscreen ? 'w-full' : 'flex-1'}`}>
          <div className="flex gap-8 border-b border-gray-100 pb-1.5 mx-auto mb-3">
            {(['hinglish', 'explain', 'summary', 'chat'] as Tab[]).map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setApiError(null); }} className={`text-[10px] font-black uppercase tracking-[0.2em] pb-1.5 border-b-2 transition-all ${activeTab === tab ? 'text-[#00897b] border-[#00897b]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>{tab}</button>
            ))}
          </div>

          <div className={`bg-white rounded-[40px] flex-1 flex flex-col overflow-hidden relative border border-gray-100 shadow-2xl shadow-gray-100 ${isFullscreen ? 'p-12' : 'p-8'}`}>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-teal-500 p-3 rounded-2xl shadow-xl shadow-teal-100 text-white"><Sparkles size={24} /></div>
                <div><h3 className="text-gray-900 font-black text-sm uppercase tracking-[0.2em]">AI {activeTab}</h3><p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Automatic Key Rotation System</p></div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-gray-400 hover:text-teal-600 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 active:scale-90 transition-all">{isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto pr-6 custom-scrollbar text-base text-gray-800`}>
              {loading && chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <Loader2 className="animate-spin text-teal-500" size={56} />
                  </div>
                  <span className="text-xs text-gray-900 font-black uppercase tracking-[0.3em]">AI Processing...</span>
                </div>
              ) : apiError ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="bg-orange-50 p-6 rounded-full mb-6">
                    <AlertCircle size={40} className="text-orange-500" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-2">Service Status</h4>
                  <p className="text-xs text-gray-500 max-w-sm mb-8 font-medium leading-relaxed">{apiError}</p>
                  <button onClick={() => generateAIContent(activeTab)} className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl"><RotateCcw size={14} className="inline mr-2" /> Try Again</button>
                </div>
              ) : (
                <div className="animate-in fade-in duration-1000 max-w-4xl mx-auto">
                  {activeTab === 'chat' && chatHistory.length > 0 ? (
                    <div className="flex flex-col gap-8 pb-10">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-6 rounded-[32px] ${msg.role === 'user' ? 'bg-teal-500 text-white shadow-xl shadow-teal-50' : 'bg-gray-50 border border-gray-100'}`}>
                            {renderFormattedText(msg.text)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : getCurrentOutput() ? renderFormattedText(getCurrentOutput()) : (
                    <div className="py-24 text-center opacity-20"><Sparkles size={64} className="mx-auto mb-4" /><p className="font-black uppercase tracking-widest text-xs">Waiting for prompt</p></div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center gap-4 bg-gray-50 rounded-[32px] p-3 border border-gray-100 max-w-4xl mx-auto w-full group focus-within:ring-2 ring-teal-100 transition-all">
               <input 
                 type="text" 
                 placeholder={`Query this ${activeTab}...`} 
                 className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 px-6 font-bold placeholder:text-gray-300" 
                 value={chatMessage} 
                 onChange={(e) => setChatMessage(e.target.value)} 
                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
               />
               <button onClick={handleSendMessage} disabled={loading || !chatMessage.trim()} className="p-4 bg-teal-500 text-white hover:bg-teal-600 rounded-[20px] transition-all disabled:opacity-30 shadow-lg shadow-teal-100"><Send size={20} /></button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f1f1; border-radius: 10px; }
      `}</style>
    </div>
  );
};
