
import React from 'react';
import { Plus, Pencil, MoreHorizontal } from 'lucide-react';

interface BookCardProps {
  isCreator?: boolean;
  image?: string;
  title: string;
  description: string;
}

const BookCard: React.FC<BookCardProps> = ({ isCreator, image, title, description }) => {
  return (
    <div className="bg-white rounded-[24px] p-6 flex items-center gap-6 group hover:shadow-md transition-all border border-transparent hover:border-gray-100 max-w-3xl w-full">
      {/* Icon Area */}
      <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${isCreator ? 'border-2 border-dashed border-gray-200 text-gray-400' : ''}`}>
        {isCreator ? (
          <Plus size={24} />
        ) : (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 text-base mb-1">{title}</h4>
        <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
      </div>

      {/* Actions */}
      {!isCreator && (
        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-gray-600 transition-colors">
            <Pencil size={18} />
          </button>
          <button className="hover:text-gray-600 transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export const MainContent: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-3xl mb-10">
        <h2 className="text-3xl font-bold text-gray-900">My Books</h2>
      </div>

      <div className="flex flex-col gap-4 w-full items-center">
        <BookCard 
          isCreator 
          title="Create Books" 
          description="Create a version of Books for specific purpose" 
        />
        
        <BookCard 
          image="https://picsum.photos/seed/talent/200/200"
          title="TalentTalker" 
          description="Chatbot for or Human Resources with a playful twist" 
        />

        <BookCard 
          image="https://picsum.photos/seed/market/200/200"
          title="MarketBot" 
          description="Provide comprehensive assistance in the field of market research" 
        />

        <BookCard 
          image="https://picsum.photos/seed/pro/200/200"
          title="ProMark" 
          description="Cater to the needs of marketers" 
        />
      </div>
    </div>
  );
};
