
import React from 'react';
import { Sparkles } from 'lucide-react';
import { BookMetadata } from '../App.tsx';

interface SidebarItemProps {
  icon?: string;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-50 text-gray-700'}`}
  >
    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
      {icon ? (
        <img src={icon} alt={label} className="w-full h-full object-cover" />
      ) : (
        <Sparkles size={16} className="text-teal-400" />
      )}
    </div>
    <span className="text-xs font-bold truncate flex-1">{label}</span>
  </div>
);

export const Sidebar: React.FC<{ 
  books: BookMetadata[], 
  onSelectBook: (id: string) => void
}> = ({ books, onSelectBook }) => {
  return (
    <aside className="w-64 border-r border-gray-100 flex flex-col py-8 px-4 h-screen sticky top-0 bg-white z-10">
      <div className="flex items-center gap-3 px-4 mb-12">
        <div className="text-teal-500 relative bg-teal-50 p-2 rounded-xl">
          <Sparkles size={24} fill="currentColor" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-white animate-pulse"></div>
        </div>
        <span className="text-2xl font-black text-gray-900 tracking-tighter">Muai</span>
      </div>

      <div className="space-y-1 flex-1 overflow-y-auto custom-sidebar-scroll pr-1">
        <h3 className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">My Collection</h3>
        {books.map(book => (
          <SidebarItem 
            key={book.id}
            icon={book.image} 
            label={book.title} 
            onClick={() => onSelectBook(book.id)}
          />
        ))}
      </div>

      <div className="mt-8 px-4 border-t border-gray-50 pt-8 flex flex-col gap-4">
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Storage Status</p>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
             <div className="h-full bg-teal-500 w-[15%]"></div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .custom-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb { background: #f1f1f1; border-radius: 10px; }
      `}</style>
    </aside>
  );
};
