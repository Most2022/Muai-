
import React from 'react';
import { Plus, Pencil, MoreHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { BookMetadata } from '../App';

interface BookCardProps {
  isCreator?: boolean;
  image?: string;
  title: string;
  description: string;
  onClick: () => void;
  onDelete?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ isCreator, image, title, description, onClick, onDelete }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-[32px] p-6 flex items-center gap-6 group hover:shadow-xl transition-all border border-transparent hover:border-teal-100 max-w-3xl w-full cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500"
    >
      <div className={`w-16 h-16 rounded-[20px] flex-shrink-0 flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 ${isCreator ? 'border-2 border-dashed border-gray-200 text-gray-300 bg-gray-50' : 'shadow-lg shadow-gray-100'}`}>
        {isCreator ? (
          <Plus size={28} />
        ) : image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="bg-teal-500 text-white w-full h-full flex items-center justify-center">
            <Sparkles size={24} />
          </div>
        )}
      </div>

      <div className="flex-1">
        <h4 className="font-black text-gray-900 text-lg mb-1 tracking-tight group-hover:text-teal-700 transition-colors">{title}</h4>
        <p className="text-gray-400 text-xs leading-relaxed font-medium line-clamp-2">{description}</p>
      </div>

      {!isCreator && (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); /* Future pencil logic */ }}
            className="p-2 text-gray-300 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
            title="Edit metadata"
          >
            <Pencil size={18} />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (onDelete) onDelete(); 
            }}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Delete book"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC<{ 
  books: BookMetadata[],
  onCreateBook: () => void, 
  onSelectBook: (id: string) => void,
  onDeleteBook: (id: string) => void
}> = ({ books, onCreateBook, onSelectBook, onDeleteBook }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-3xl mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">My Library</h2>
          <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-widest">Manage your transformations</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-xs font-black text-teal-600 uppercase">
          {books.length} Active Books
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full items-center pb-24">
        <BookCard 
          isCreator 
          title="Create New Book" 
          description="Transform any document into specialized Hinglish, deep explanations, or summaries." 
          onClick={onCreateBook}
        />
        
        {books.map(book => (
          <BookCard 
            key={book.id}
            image={book.image}
            title={book.title} 
            description={book.description} 
            onClick={() => onSelectBook(book.id)}
            onDelete={() => onDeleteBook(book.id)}
          />
        ))}
      </div>
    </div>
  );
};
