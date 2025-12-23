
import React from 'react';
import { Plus } from 'lucide-react';

export const Header: React.FC<{ onCreateBook: () => void }> = ({ onCreateBook }) => {
  return (
    <header className="h-20 flex items-center justify-end px-12 gap-6 bg-white shrink-0">
      <button 
        onClick={onCreateBook}
        className="flex items-center gap-2 bg-[#00897b] hover:bg-[#00796b] text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm"
      >
        <Plus size={18} />
        <span>Create Book</span>
      </button>
      
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
        <img 
          src="https://picsum.photos/seed/avatar3/100/100" 
          alt="User avatar" 
          className="w-full h-full object-cover"
        />
      </div>
    </header>
  );
};
