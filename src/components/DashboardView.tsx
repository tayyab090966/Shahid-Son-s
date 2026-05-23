import React, { useState } from 'react';
import { ShopTransaction } from '../types';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  BookOpen, 
  Briefcase,
  X,
  Sparkles,
  Calendar,
  AlertCircle,
  Smartphone,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
  transactions: ShopTransaction[];
  onAddTransaction: (t: Omit<ShopTransaction, 'id' | 'date'> & { date?: string }) => void;
  onDeleteTransaction: (id: string) => void;
  books: string[];
  onAddBook: (name: string) => void;
  onRenameBook: (oldName: string, newName: string) => void;
  onNavigateToInstall: () => void;
}

export default function DashboardView({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  books,
  onAddBook,
  onRenameBook,
  onNavigateToInstall,
}: DashboardViewProps) {
  const [search, setSearch] = useState('');
  const [selectedBookFilter, setSelectedBookFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | 'IN' | 'OUT'>('All');
  
  // Custom states for renaming/managing books
  const [isManageBooksOpen, setIsManageBooksOpen] = useState(false);
  const [editingBookName, setEditingBookName] = useState<string | null>(null);
  const [tempBookName, setTempBookName] = useState('');

  // Custom transaction modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'IN' | 'OUT'>('IN');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedBook, setSelectedBook] = useState(books[0] || 'Book A');
  const [customBookName, setCustomBookName] = useState('');
  const [isAddingNewBook, setIsAddingNewBook] = useState(false);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  // Toast / Status state local to action trigger
  const [quickToast, setQuickToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'danger') => {
    setQuickToast({ message, type });
    setTimeout(() => {
      setQuickToast(null);
    }, 3000);
  };

  // Math totals
  const totalIncome = transactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Handler for quick buttons
  const handleQuickAdd = (isIncome: boolean) => {
    if (isIncome) {
      onAddTransaction({
        title: 'Counter Sale',
        book: 'Book A',
        amount: 1000.0,
        isIncome: true,
      });
      triggerToast('Rs. 1000 Added as Cash IN (آمدنی)', 'success');
    } else {
      onAddTransaction({
        title: 'Misc Expense',
        book: 'Book A',
        amount: 500.0,
        isIncome: false,
      });
      triggerToast('Rs. 500 Logged as Cash OUT (خرچ)', 'danger');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      alert('Please enter a valid business title / description.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid positive numeric amount.');
      return;
    }

    let finalBook = selectedBook;
    if (isAddingNewBook && customBookName.trim()) {
      const newBook = customBookName.trim();
      onAddBook(newBook);
      finalBook = newBook;
      setIsAddingNewBook(false);
      setCustomBookName('');
    }

    onAddTransaction({
      title: title.trim(),
      book: finalBook,
      amount: parsedAmount,
      isIncome: modalType === 'IN',
      date: new Date(transactionDate).toISOString()
    });

    triggerToast(
      `Rs. ${parsedAmount.toLocaleString()} logged as ${modalType === 'IN' ? 'Cash IN (آمدنی)' : 'Cash OUT (خرچ)'}`,
      modalType === 'IN' ? 'success' : 'danger'
    );

    // Reset fields & close
    setTitle('');
    setAmount('');
    setIsModalOpen(false);
  };

  // Filter & Search
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.book.toLowerCase().includes(search.toLowerCase());
    const matchesBook = selectedBookFilter === 'All' || t.book === selectedBookFilter;
    const matchesType = selectedTypeFilter === 'All' || 
                        (selectedTypeFilter === 'IN' && t.isIncome) || 
                        (selectedTypeFilter === 'OUT' && !t.isIncome);
    return matchesSearch && matchesBook && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Action Toast Alert inside App View */}
      <AnimatePresence>
        {quickToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border text-white ${
              quickToast.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500' 
                : 'bg-rose-600 border-rose-500'
            }`}
          >
            {quickToast.type === 'success' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            <span className="font-medium text-sm">{quickToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Mobile App CTA Banner (موبائل ایپ انسٹالر) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#EBF5FB] border border-[#AED6F1] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-2.5 bg-[#D4E6F1] text-[#2980B9] rounded-xl shrink-0 hidden sm:block">
            <Smartphone className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-extrabold text-[#2C3E50]">Download Shahid &amp; Sons Mobile App</h4>
            <p className="text-[11px] text-gray-500 leading-none">روزانہ کھاتہ موبائل پر چلائیں • 100% مفت اور محفوظ</p>
          </div>
        </div>
        <button
          onClick={onNavigateToInstall}
          className="w-full sm:w-auto shrink-0 bg-[#2980B9] hover:bg-[#2471A3] text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Download className="h-4 w-4" />
          INSTALL PHONE APP (ڈاؤن لوڈ کریں)
        </button>
      </motion.div>

      {/* 1. Daily Summary Card */}
      <div id="summary-card" className="bg-white rounded-2xl border border-[#E5E7E9] shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#196F3D]" />
              Daily Summary &bull; روزانہ کا خلاصہ
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
              Book-Level Storage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
            {/* Total Income */}
            <div className="p-5 bg-[#F1F9F4] rounded-xl border border-[#D5F5E3] flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#196F3D] uppercase tracking-wider mb-1">
                  TOTAL INCOME (آمدنی)
                </p>
                <p className="text-2xl font-black text-[#196F3D] font-sans">
                  PKR {totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[#196F3D]/80 text-xs font-medium">آمدنی کا کل گنتی</span>
                <div className="h-7 w-7 rounded-lg bg-[#D5F5E3] flex items-center justify-center text-[#196F3D]">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="p-5 bg-[#FDF2F1] rounded-xl border border-[#FADBD8] flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#CB4335] uppercase tracking-wider mb-1">
                  TOTAL EXPENSE (اخراجات / خرچ)
                </p>
                <p className="text-2xl font-black text-[#CB4335] font-sans">
                  PKR {totalExpense.toLocaleString()}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[#CB4335]/80 text-xs font-medium">اخراجات کا کل کٹاوُ</span>
                <div className="h-7 w-7 rounded-lg bg-[#FADBD8] flex items-center justify-center text-[#CB4335]">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Closing Balance */}
          <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
            <div>
              <p className="text-[11px] font-bold text-gray-450 uppercase tracking-wider">Closing Balance</p>
              <p className="text-3xl font-black text-[#1F618D] font-sans">
                PKR {balance.toLocaleString()}
              </p>
              <span className="text-xs text-gray-400">بقیہ بیلنس</span>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-mono">CASH IN HAND</span>
              <span className={`inline-block w-3 h-3 rounded-full animate-pulse mt-1 ${balance >= 0 ? 'bg-[#27AE60]' : 'bg-[#CB4335]'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Quick & Custom Billing Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash In Button Block */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7E9] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-[#196F3D] tracking-wider uppercase">CASH IN &bull; آمدنی</h4>
            <span className="inline-flex w-1.5 h-1.5 bg-[#27AE60] rounded-full"></span>
          </div>
          
          <button 
            id="custom-cash-in-trigger"
            onClick={() => {
              setModalType('IN');
              setIsModalOpen(true);
            }}
            className="w-full flex flex-col items-center justify-center p-4 bg-[#27AE60] text-white rounded-xl shadow-md hover:shadow-lg transition-all border-b-4 border-[#196F3D] cursor-pointer"
          >
            <ArrowUpRight className="h-6 w-6 mb-1 text-[#D5F5E3]" />
            <span className="font-extrabold text-sm tracking-wide">CASH IN (آمدنی داخل کریں)</span>
            <span className="text-[10px] opacity-80 animate-pulse">Add custom sales & receipts</span>
          </button>

          <button 
            id="quick-cash-in"
            onClick={() => handleQuickAdd(true)}
            className="w-full py-2 bg-[#F1F9F4] hover:bg-[#D5F5E3] text-[#196F3D] font-bold rounded-lg border border-[#D5F5E3] transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Quick Add +Rs. 1,000 Sales
          </button>
        </div>

        {/* Cash Out Button Block */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7E9] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-[#CB4335] tracking-wider uppercase">CASH OUT &bull; خرچ</h4>
            <span className="inline-flex w-1.5 h-1.5 bg-[#CB4335] rounded-full"></span>
          </div>

          <button 
            id="custom-cash-out-trigger"
            onClick={() => {
              setModalType('OUT');
              setIsModalOpen(true);
            }}
            className="w-full flex flex-col items-center justify-center p-4 bg-[#CB4335] text-white rounded-xl shadow-md hover:shadow-lg transition-all border-b-4 border-[#943126] cursor-pointer"
          >
            <ArrowDownRight className="h-6 w-6 mb-1 text-[#FADBD8]" />
            <span className="font-extrabold text-sm tracking-wide">CASH OUT (اخراجات کا اندراج)</span>
            <span className="text-[10px] opacity-80 animate-pulse">Log custom stock purchases & bills</span>
          </button>

          <button 
            id="quick-cash-out"
            onClick={() => handleQuickAdd(false)}
            className="w-full py-2 bg-[#FDF2F1] hover:bg-[#FADBD8] text-[#CB4335] font-bold rounded-lg border border-[#FADBD8] transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 text-[#CB4335]" />
            Quick Log -Rs. 500 Expense
          </button>
        </div>
      </div>

      {/* 3. Realtime Transaction List & Advanced Filter Module */}
      <div className="bg-white rounded-2xl border border-[#E5E7E9] shadow-sm overflow-hidden flex flex-col">
        {/* Header toolbar */}
        <div className="p-6 border-b border-gray-100 bg-[#FAFBFB] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#2C3E50]">Recent Transactions</h3>
              <p className="text-xs text-gray-400 mt-0.5">All recorded entries sorted by time</p>
            </div>

            {/* Search input to keep it powerful */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-450" />
              <input
                id="tx-search-input"
                type="text"
                placeholder="Search description, book..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm bg-white border border-[#E5E7E9] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#196F3D] focus:border-[#196F3D] transition-all text-[#2C3E50]"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            {/* Book Filter */}
            <div className="flex items-center gap-1.5 mr-1.5 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <BookOpen className="h-3.5 w-3.5 text-gray-400" />
              <span>Book:</span>
            </div>
            <button
              onClick={() => setSelectedBookFilter('All')}
              className={`px-3 py-1 rounded-lg border font-bold cursor-pointer transition-all ${
                selectedBookFilter === 'All'
                  ? 'bg-[#196F3D] border-[#196F3D] text-white'
                  : 'bg-white border-[#E5E7E9] text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Books
            </button>
            {books.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBookFilter(b)}
                className={`px-3 py-1 rounded-lg border font-bold cursor-pointer transition-all ${
                  selectedBookFilter === b
                    ? 'bg-[#196F3D] border-[#196F3D] text-white'
                    : 'bg-white border-[#E5E7E9] text-gray-600 hover:bg-gray-50'
                }`}
              >
                {b}
              </button>
            ))}

            <button
              onClick={() => setIsManageBooksOpen(true)}
              className="px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:text-[#196F3D] hover:border-[#196F3D] hover:bg-emerald-50/50 flex items-center gap-1 font-bold text-[10px] cursor-pointer transition-all shrink-0"
              title="Manage & Rename Books"
              type="button"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename (نام بدلیں)
            </button>

            <div className="w-px h-4 bg-gray-200 mx-2 self-center" />

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 mr-1.5 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <Filter className="h-3.5 w-3.5 text-gray-450" />
              <span>Type:</span>
            </div>
            {['All', 'IN', 'OUT'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTypeFilter(t as any)}
                className={`px-3 py-1 rounded-lg border font-bold cursor-pointer transition-all ${
                  selectedTypeFilter === t
                    ? 'bg-[#2C3E50] border-[#2C3E50] text-white'
                    : 'bg-white border-[#E5E7E9] text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'All' ? 'In & Out' : t === 'IN' ? 'Rs. IN (آمدنی)' : 'Rs. OUT (خرچ)'}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions list view */}
        <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium">No transactions matched your filter</p>
              <p className="text-xs text-gray-400 mt-1">Try resetting search or filters using selectors above</p>
            </div>
          ) : (
            filteredTransactions.map((item, idx) => {
              const itemDate = new Date(item.date);
              const formattedDate = itemDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
              const formattedTime = itemDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={item.id}
                  className="px-6 py-4 hover:bg-gray-50/50 flex justify-between items-center transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs font-bold text-gray-350 w-6">
                      {String(idx + 1).padStart(2, '0')}.
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#2C3E50] text-sm">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                          {item.book}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formattedDate}
                        </span>
                        <span>&bull;</span>
                        <span>{formattedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right min-w-[120px]">
                      <span className={`font-sans font-black text-sm block ${
                        item.isIncome ? 'text-[#196F3D]' : 'text-[#CB4335]'
                      }`}>
                        {item.isIncome ? 'PKR +' : 'PKR -'}{item.amount.toLocaleString()}
                      </span>
                      <span className={`text-[10px] font-bold block ${
                        item.isIncome ? 'text-[#27AE60]' : 'text-[#CB4335]'
                      }`}>
                        {item.isIncome ? 'CASH IN (آمدنی)' : 'CASH OUT (خرچ)'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onDeleteTransaction(item.id);
                        triggerToast('Transaction removed successfully', 'danger');
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Elegant Custom Transaction Entry Dialog (Modal Backdrop) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop animation */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 relative z-10"
            >
              <div className={`p-6 text-white flex justify-between items-center ${
                modalType === 'IN' ? 'bg-emerald-700' : 'bg-rose-700'
              }`}>
                <div>
                  <h3 className="font-sans font-bold text-lg flex items-center gap-2">
                    {modalType === 'IN' ? (
                      <>
                        <ArrowUpRight className="h-5 w-5 bg-white/20 p-0.5 rounded-full" />
                        Add New Cash IN Entry
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-5 w-5 bg-white/20 p-0.5 rounded-full" />
                        Add New Cash OUT Entry
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    {modalType === 'IN' ? 'آمدنی کا اندراج کریں' : 'اخراجات کا اندراج کریں'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCustomSubmit} className="p-6 space-y-4">
                {/* Amount input block with high prominence */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-550 uppercase block">Amount (رقم) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-sm">
                      PKR
                    </span>
                    <input
                      id="tx-amount-input"
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-lg font-bold text-zinc-900"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-550 uppercase block">Description / Customer Name *</label>
                  <input
                    id="tx-title-input"
                    type="text"
                    required
                    placeholder="e.g. Customer Payment, Stock Purchase"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-800 text-sm"
                  />
                </div>

                {/* Ledger / Book Selection */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-550 uppercase block">Select Ledger Book (کھاتہ بک)</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewBook(!isAddingNewBook)}
                      className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      {isAddingNewBook ? 'Use Existing Book' : '+ Add New Book'}
                    </button>
                  </div>

                  {!isAddingNewBook ? (
                    <select
                      id="tx-book-select"
                      value={selectedBook}
                      onChange={(e) => setSelectedBook(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-800 text-sm cursor-pointer"
                    >
                      {books.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="tx-new-book-input"
                      type="text"
                      required={isAddingNewBook}
                      placeholder="e.g. Book C, Wholesale Book"
                      value={customBookName}
                      onChange={(e) => setCustomBookName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-emerald-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-800 text-sm animate-fade-in"
                    />
                  )}
                </div>

                {/* Custom transaction date & time for ledger convenience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-550 uppercase block flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    Entry Date (تاریخ)
                  </label>
                  <input
                    id="tx-date-input"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-800 text-sm cursor-pointer"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-custom-tx"
                    type="submit"
                    className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer ${
                      modalType === 'IN' 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                    }`}
                  >
                    Save Entry (محفوظ کریں)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Manage Books Modal */}
      <AnimatePresence>
        {isManageBooksOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsManageBooksOpen(false);
                setEditingBookName(null);
              }}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xs animate-none"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 relative z-10"
            >
              <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-sans font-bold text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                    Manage Books (کھاتہ بک)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    بک کا نام تبدیل کریں یا ترمیم کریں
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsManageBooksOpen(false);
                    setEditingBookName(null);
                  }}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-400">
                  Select a book and click **Rename** to change its name. All entries belonging to this book will auto-update to the new name.
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {books.map((book) => {
                    const count = transactions.filter(t => t.book === book).length;
                    
                    return (
                      <div 
                        key={book} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 gap-2"
                      >
                        {editingBookName === book ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const cleanName = tempBookName.trim();
                              if (!cleanName) return;
                              if (cleanName === book) {
                                setEditingBookName(null);
                                return;
                              }
                              if (books.includes(cleanName)) {
                                alert("Book with this name already exists!");
                                return;
                              }
                              onRenameBook(book, cleanName);
                              setEditingBookName(null);
                              triggerToast(`Book renamed to "${cleanName}" successfully`, 'success');
                            }}
                            className="flex items-center gap-2 w-full"
                          >
                            <input 
                              type="text" 
                              value={tempBookName} 
                              onChange={(e) => setTempBookName(e.target.value)} 
                              className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-[#196F3D]"
                              maxLength={32}
                              required
                              autoFocus
                            />
                            <button 
                              type="submit" 
                              className="px-2.5 py-1.5 bg-[#196F3D] text-white text-[10px] font-black rounded-lg cursor-pointer"
                            >
                              Save
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingBookName(null)} 
                              className="px-2.5 py-1.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#196F3D]" />
                              <div className="flex flex-col">
                                <span className="font-extrabold text-xs text-[#2C3E50]">{book}</span>
                                <span className="text-[10px] text-gray-400">({count} records)</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBookName(book);
                                setTempBookName(book);
                              }}
                              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-[#1F618D] font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                            >
                              Rename (نام بدلیں)
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsManageBooksOpen(false);
                      setEditingBookName(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-zinc-650 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all cursor-pointer"
                  >
                    Done (مکمل)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
