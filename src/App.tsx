import React, { useState, useEffect } from 'react';
import { ShopTransaction } from './types';
import DashboardView from './components/DashboardView';
import OfflineReportsView from './components/OfflineReportsView';
import LocalTeamView from './components/LocalTeamView';
import InstallAppView from './components/InstallAppView';
import { 
  BookOpen, 
  FileText, 
  Users, 
  WifiOff,
  Smartphone,
  X
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { 
  performCloudSync, 
  ensureUserDoc, 
  saveTransactionToCloud, 
  deleteTransactionFromCloud, 
  saveBookToCloud,
  renameBookInCloud
} from './lib/syncService';

const LOCAL_STORAGE_TX_KEY = 'shahid_sons_cashbook_tx_v2';
const LOCAL_STORAGE_BOOKS_KEY = 'shahid_sons_cashbook_books_v2';
const LOCAL_STORAGE_LOGO_KEY = 'shahid_sons_business_logo_v2';

const DEFAULTS_TRANSACTIONS: ShopTransaction[] = [
  { 
    id: 'tx-1', 
    title: 'Customer Payment', 
    book: 'Book A', 
    amount: 3500.0, 
    isIncome: true, 
    date: new Date(Date.now() - 4 * 3600 * 1000).toISOString() 
  },
  { 
    id: 'tx-2', 
    title: 'Stock Purchase', 
    book: 'Book B', 
    amount: 5000.0, 
    isIncome: false, 
    date: new Date(Date.now() - 2 * 3600 * 1000).toISOString() 
  },
  { 
    id: 'tx-3', 
    title: 'Daily Sales', 
    book: 'Book A', 
    amount: 8000.0, 
    isIncome: true, 
    date: new Date(Date.now() - 1 * 3600 * 1000).toISOString() 
  }
];

const DEFAULT_BOOKS = ['Book A', 'Book B'];

export default function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [transactions, setTransactions] = useState<ShopTransaction[]>([]);
  const [books, setBooks] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [businessLogo, setBusinessLogo] = useState<string>('');

  // Initialize data from LocalStorage
  useEffect(() => {
    try {
      const savedTx = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
      const savedBooks = localStorage.getItem(LOCAL_STORAGE_BOOKS_KEY);
      const savedLogo = localStorage.getItem(LOCAL_STORAGE_LOGO_KEY);

      if (savedTx) {
        setTransactions(JSON.parse(savedTx));
      } else {
        setTransactions(DEFAULTS_TRANSACTIONS);
        localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(DEFAULTS_TRANSACTIONS));
      }

      if (savedBooks) {
        setBooks(JSON.parse(savedBooks));
      } else {
        setBooks(DEFAULT_BOOKS);
        localStorage.setItem(LOCAL_STORAGE_BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
      }

      if (savedLogo) {
        setBusinessLogo(savedLogo);
      }
    } catch (e) {
      console.error('Failed to load storage state: ', e);
      setTransactions(DEFAULTS_TRANSACTIONS);
      setBooks(DEFAULT_BOOKS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync state with Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          setSyncing(true);
          await ensureUserDoc(currentUser.uid, currentUser.email || '');
          
          // Bidirectional merge of cloud backup on login
          const savedTx = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
          const savedBooks = localStorage.getItem(LOCAL_STORAGE_BOOKS_KEY);
          const startTx = savedTx ? JSON.parse(savedTx) : DEFAULTS_TRANSACTIONS;
          const startBooks = savedBooks ? JSON.parse(savedBooks) : DEFAULT_BOOKS;

          const { mergedTx, mergedBooks } = await performCloudSync(currentUser.uid, startTx, startBooks);
          setTransactions(mergedTx);
          localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(mergedTx));
          setBooks(mergedBooks);
          localStorage.setItem(LOCAL_STORAGE_BOOKS_KEY, JSON.stringify(mergedBooks));
        } catch (err) {
          console.error('Firebase Auth merge failed:', err);
        } finally {
          setSyncing(false);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Force bidirectional synchronization manual trigger
  const handleForceCloudSync = async () => {
    if (!user) return;
    try {
      setSyncing(true);
      await ensureUserDoc(user.uid, user.email || '');
      const { mergedTx, mergedBooks } = await performCloudSync(user.uid, transactions, books);
      setTransactions(mergedTx);
      localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(mergedTx));
      setBooks(mergedBooks);
      localStorage.setItem(LOCAL_STORAGE_BOOKS_KEY, JSON.stringify(mergedBooks));
    } catch (err) {
      console.error('Manual background sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Sync back to localstorage whenever transactions change
  const saveTransactions = (newTxList: ShopTransaction[]) => {
    setTransactions(newTxList);
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(newTxList));
  };

  const handleAddTransaction = async (t: Omit<ShopTransaction, 'id' | 'date'> & { date?: string }) => {
    const newTx: ShopTransaction = {
      ...t,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: t.date || new Date().toISOString()
    };
    const updated = [newTx, ...transactions];
    saveTransactions(updated);

    if (user) {
      try {
        await saveTransactionToCloud(user.uid, newTx);
      } catch (err) {
        console.warn('Queued single record write silently:', err);
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const filtered = transactions.filter(t => t.id !== id);
    saveTransactions(filtered);

    if (user) {
      try {
        await deleteTransactionFromCloud(user.uid, id);
      } catch (err) {
        console.warn('Queued single record deletion silently:', err);
      }
    }
  };

  const handleAddBook = async (name: string) => {
    if (books.includes(name)) return;
    const updatedBooks = [...books, name];
    setBooks(updatedBooks);
    localStorage.setItem(LOCAL_STORAGE_BOOKS_KEY, JSON.stringify(updatedBooks));

    if (user) {
      try {
        await saveBookToCloud(user.uid, name);
      } catch (err) {
        console.warn('Queued book registry write silently:', err);
      }
    }
  };

  const handleRenameBook = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    if (books.includes(newName)) {
      alert("Book with this name already exists!");
      return;
    }

    const updatedBooks = books.map(b => b === oldName ? newName : b);
    setBooks(updatedBooks);
    localStorage.setItem(LOCAL_STORAGE_BOOKS_KEY, JSON.stringify(updatedBooks));

    const updatedTx = transactions.map(t => {
      if (t.book === oldName) {
        return { ...t, book: newName };
      }
      return t;
    });
    saveTransactions(updatedTx);

    if (user) {
      try {
        setSyncing(true);
        const affected = updatedTx.filter(t => t.book === newName);
        await renameBookInCloud(user.uid, oldName, newName, affected);
      } catch (err) {
        console.warn("Cloud rename backup failed:", err);
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleLogoUpload = (base64: string) => {
    setBusinessLogo(base64);
    localStorage.setItem(LOCAL_STORAGE_LOGO_KEY, base64);
  };

  const handleLogoRemove = () => {
    setBusinessLogo('');
    localStorage.removeItem(LOCAL_STORAGE_LOGO_KEY);
  };

  // Restore logic for backend backup voucher codes
  const handleImportBackup = async (importedData: ShopTransaction[]) => {
    saveTransactions(importedData);
    // Find unique book names contained in this import structure to append to list of books
    const importedBooks = Array.from(new Set(importedData.map(t => t.book)));
    const mergedBooks = Array.from(new Set([...books, ...importedBooks]));
    setBooks(mergedBooks);
    localStorage.setItem(LOCAL_STORAGE_BOOKS_KEY, JSON.stringify(mergedBooks));

    if (user) {
      try {
        setSyncing(true);
        const { mergedTx, mergedBooks: syncedBooks } = await performCloudSync(user.uid, importedData, mergedBooks);
        setTransactions(mergedTx);
        localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(mergedTx));
        setBooks(syncedBooks);
        localStorage.setItem(LOCAL_STORAGE_BOOKS_KEY, JSON.stringify(syncedBooks));
      } catch (err) {
        console.error('Import sync error:', err);
      } finally {
        setSyncing(false);
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F6F7]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto" />
          <p className="text-xs text-sans text-gray-400">Loading Shahid & Sons Cashbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F7] text-[#2C3E50] flex flex-col font-sans selection:bg-[#D5F5E3] selection:text-[#196F3D]">
      
      {/* 1. Header - Clean minimalism style solid card */}
      <header className="bg-[#196F3D] text-white py-6 px-4 md:px-8 border-b border-[#145A32] relative shrink-0">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10 space-y-3">
          {/* Top Info pill header */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#145A32] text-[#D5F5E3] rounded-md text-[10px] font-bold tracking-widest uppercase transition-all">
            {user ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-ping" />
                Cloud Connected &bull; Realtime Auto-Save
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 inline text-[#D5F5E3]" />
                Offline Mode &bull; Sign in to Backup
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            {/* Logo area */}
            <div className="relative group cursor-pointer shrink-0">
              {businessLogo ? (
                <div className="relative">
                  <img 
                    src={businessLogo} 
                    alt="Business Logo" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-white font-extrabold tracking-wider bg-[#196F3D] px-1.5 py-0.5 rounded uppercase">Edit</span>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#145A32] text-[#D5F5E3] border-2 border-[#D5F5E3] flex flex-col items-center justify-center shadow-md hover:bg-[#114B21] transition-colors relative">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">Logo</span>
                </div>
              )}
              {/* Invisible File Input */}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      alert("Image size should be less than 2MB");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') {
                        handleLogoUpload(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
              {businessLogo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogoRemove();
                  }}
                  className="absolute -top-1 -right-1 bg-rose-650 hover:bg-rose-700 text-white p-0.5 rounded-full shadow-xs cursor-pointer z-20"
                  title="Remove Logo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight font-sans">
                Shahid & Sons
              </h1>
              <h2 className="text-xs font-bold text-[#D5F5E3] tracking-widest uppercase mt-0.5">
                Premium CashBook Ledger
              </h2>
              <div className="text-[11px] text-[#D5F5E3]/90 font-medium mt-1 flex items-center justify-center sm:justify-start gap-3">
                <span>روزانہ کی آمدنی اور خرچ کا کچا کھاتہ</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Module Wrapper */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 md:py-8 space-y-6 pb-24">
        {selectedTab === 0 && (
          <DashboardView
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            books={books}
            onAddBook={handleAddBook}
            onRenameBook={handleRenameBook}
            onNavigateToInstall={() => setSelectedTab(3)}
          />
        )}

        {selectedTab === 1 && (
          <OfflineReportsView 
            transactions={transactions}
            books={books}
            businessLogo={businessLogo}
          />
        )}

        {selectedTab === 2 && (
          <LocalTeamView 
            transactions={transactions}
            onImportBackup={handleImportBackup}
            user={user}
            onForceCloudSync={handleForceCloudSync}
            syncing={syncing}
          />
        )}

        {selectedTab === 3 && (
          <InstallAppView />
        )}
      </main>

      {/* 3. Floating Bottom Navigation - Sleek, flat white line */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7E9] py-2 px-2 shadow-sm z-40">
        <div className="max-w-xl mx-auto flex justify-around items-center">
          
          {/* Books Tab */}
          <button 
            id="tab-books"
            onClick={() => setSelectedTab(0)}
            className={`flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl cursor-pointer ${
              selectedTab === 0 
                ? 'text-[#196F3D]' 
                : 'text-gray-400 hover:text-zinc-700'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              selectedTab === 0 ? 'bg-[#F1F9F4] text-[#196F3D]' : 'bg-transparent'
            }`}>
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wider uppercase">Books (بک)</span>
          </button>

          {/* Reports Tab */}
          <button 
            id="tab-reports"
            onClick={() => setSelectedTab(1)}
            className={`flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl cursor-pointer ${
              selectedTab === 1 
                ? 'text-[#196F3D]' 
                : 'text-gray-400 hover:text-zinc-700'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              selectedTab === 1 ? 'bg-[#F1F9F4] text-[#196F3D]' : 'bg-transparent'
            }`}>
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wider uppercase">Reports (رپورٹ)</span>
          </button>

          {/* Team Sync Tab */}
          <button 
            id="tab-team"
            onClick={() => setSelectedTab(2)}
            className={`flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl cursor-pointer ${
              selectedTab === 2 
                ? 'text-[#196F3D]' 
                : 'text-gray-400 hover:text-zinc-700'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              selectedTab === 2 ? 'bg-[#F1F9F4] text-[#196F3D]' : 'bg-transparent'
            }`}>
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wider uppercase">Team (ٹیم)</span>
          </button>

          {/* Install App Tab */}
          <button 
            id="tab-install"
            onClick={() => setSelectedTab(3)}
            className={`flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl cursor-pointer ${
              selectedTab === 3 
                ? 'text-[#196F3D]' 
                : 'text-gray-400 hover:text-zinc-700'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              selectedTab === 3 ? 'bg-[#F1F9F4] text-[#196F3D]' : 'bg-transparent'
            }`}>
              <Smartphone className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wider uppercase">Install App (ایپ)</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
