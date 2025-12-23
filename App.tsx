
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EditorView } from './components/EditorView';
import { ApiSettings } from './components/ApiSettings';

export type View = 'dashboard' | 'editor';

export interface BookMetadata {
  id: string;
  title: string;
  description: string;
  image?: string;
  createdAt: number;
}

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [selectedBook, setSelectedBook] = useState<BookMetadata | null>(null);
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [customApiKeys, setCustomApiKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('muai_custom_keys');
    return saved ? JSON.parse(saved) : [];
  });

  // Load book list from localStorage on mount
  useEffect(() => {
    const savedBooks = localStorage.getItem('muai_books_list');
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    } else {
      const initialBooks: BookMetadata[] = [
        { id: '1', title: 'TalentTalker', description: 'Chatbot for Human Resources with a playful twist', image: 'https://picsum.photos/seed/talent/200/200', createdAt: Date.now() },
        { id: '2', title: 'MarketBot', description: 'Provide comprehensive assistance in the field of market research', image: 'https://picsum.photos/seed/market/200/200', createdAt: Date.now() },
        { id: '3', title: 'ProMark', description: 'Cater to the needs of marketers', image: 'https://picsum.photos/seed/pro/200/200', createdAt: Date.now() },
      ];
      setBooks(initialBooks);
      localStorage.setItem('muai_books_list', JSON.stringify(initialBooks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('muai_custom_keys', JSON.stringify(customApiKeys));
  }, [customApiKeys]);

  const handleCreateBook = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newBook: BookMetadata = {
      id: newId,
      title: 'New Custom Book',
      description: 'A newly created AI-powered book transformation.',
      createdAt: Date.now()
    };
    setSelectedBook(newBook);
    setView('editor');
  };

  const handleSelectBook = (id: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      setSelectedBook(book);
      setView('editor');
    }
  };

  const handleDeleteBook = (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this book?");
    if (!confirmed) return;
    const newList = books.filter(b => b.id !== id);
    setBooks(newList);
    localStorage.setItem('muai_books_list', JSON.stringify(newList));
    localStorage.removeItem(`muai_book_data_${id}`);
  };

  const handleBack = () => {
    const savedBooks = localStorage.getItem('muai_books_list');
    if (savedBooks) setBooks(JSON.parse(savedBooks));
    setView('dashboard');
    setSelectedBook(null);
  };

  const handleSaveBookList = (updatedMetadata: BookMetadata) => {
    const exists = books.find(b => b.id === updatedMetadata.id);
    let newList;
    if (exists) {
      newList = books.map(b => b.id === updatedMetadata.id ? updatedMetadata : b);
    } else {
      newList = [updatedMetadata, ...books];
    }
    setBooks(newList);
    localStorage.setItem('muai_books_list', JSON.stringify(newList));
  };

  return (
    <div className="flex min-h-screen bg-white">
      {view === 'dashboard' && (
        <Sidebar 
          books={books} 
          onSelectBook={handleSelectBook} 
          onOpenSettings={() => setIsApiSettingsOpen(true)}
        />
      )}

      <div className="flex-1 flex flex-col">
        {view === 'dashboard' ? (
          <>
            <Header onCreateBook={handleCreateBook} />
            <main className="flex-1 px-8 pb-8">
              <div className="bg-[#f2f4f7] rounded-[32px] min-h-[calc(100vh-100px)] p-12 relative overflow-hidden">
                <Dashboard 
                  books={books}
                  onCreateBook={handleCreateBook} 
                  onSelectBook={handleSelectBook}
                  onDeleteBook={handleDeleteBook}
                />
              </div>
            </main>
          </>
        ) : (
          selectedBook && (
            <EditorView 
              onBack={handleBack} 
              bookId={selectedBook.id}
              initialTitle={selectedBook.title}
              onMetadataUpdate={handleSaveBookList}
              customKeys={customApiKeys}
            />
          )
        )}
      </div>

      <ApiSettings 
        isOpen={isApiSettingsOpen} 
        onClose={() => setIsApiSettingsOpen(false)} 
        keys={customApiKeys}
        setKeys={setCustomApiKeys}
      />
    </div>
  );
};

export default App;
