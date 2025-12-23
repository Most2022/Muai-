
import React, { useState } from 'react';
import { X, Plus, Trash2, Key, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApiSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  keys: string[];
  setKeys: (keys: string[]) => void;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({ isOpen, onClose, keys, setKeys }) => {
  const [newKey, setNewKey] = useState('');

  if (!isOpen) return null;

  const handleAddKey = () => {
    if (newKey.trim() && keys.length < 10) {
      setKeys([...keys, newKey.trim()]);
      setNewKey('');
    }
  };

  const handleRemoveKey = (index: number) => {
    const newKeys = [...keys];
    newKeys.splice(index, 1);
    setKeys(newKeys);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">API Key Manager</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Quota Auto-Rotation System</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex gap-3">
            <AlertCircle className="text-blue-500 shrink-0" size={18} />
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              The app uses only the keys you provide below. If a key hits its quota, it will automatically cycle to the next one.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Paste Gemini API Key..." 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 ring-teal-100 outline-none transition-all"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                  disabled={keys.length >= 10}
                />
              </div>
              <button 
                onClick={handleAddKey}
                disabled={!newKey.trim() || keys.length >= 10}
                className="bg-teal-500 text-white p-3 rounded-xl hover:bg-teal-600 transition-all disabled:opacity-30 shadow-lg shadow-teal-100"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Backup Keys ({keys.length}/10)</span>
              </div>
              
              {keys.map((key, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl group animate-in slide-in-from-top-2">
                   <Key size={16} className="text-gray-400" />
                   <div className="flex-1">
                     <p className="text-[10px] font-black text-gray-800 uppercase">Key #{i + 1}</p>
                     <p className="text-[9px] text-gray-500 font-bold truncate">••••••••{key.slice(-6)}</p>
                   </div>
                   <button 
                     onClick={() => handleRemoveKey(i)}
                     className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              ))}

              {keys.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center gap-2">
                  <Key size={32} className="text-gray-200" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No API keys added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
          >
            Done
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ccc; }
      `}</style>
    </div>
  );
};
