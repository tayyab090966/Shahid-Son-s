import React, { useState } from 'react';
import { ShopTransaction } from '../types';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  BookOpen, 
  Printer,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface OfflineReportsViewProps {
  transactions: ShopTransaction[];
  books: string[];
  businessLogo?: string;
}

export default function OfflineReportsView({ transactions, books, businessLogo }: OfflineReportsViewProps) {
  const [selectedBook, setSelectedBook] = useState('All');
  const [dateRange, setDateRange] = useState<'All' | 'Today' | 'Month'>('All');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const filterTransactions = () => {
    return transactions.filter(t => {
      const matchBook = selectedBook === 'All' || t.book === selectedBook;
      
      if (dateRange === 'Today') {
        const todayStr = new Date().toISOString().split('T')[0];
        const tDateStr = new Date(t.date).toISOString().split('T')[0];
        return matchBook && tDateStr === todayStr;
      }
      
      if (dateRange === 'Month') {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const tDate = new Date(t.date);
        return matchBook && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      }

      return matchBook;
    });
  };

  const filtered = filterTransactions();

  const totalIncome = filtered.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const closingBalance = totalIncome - totalExpense;

  const countIncome = filtered.filter(t => t.isIncome).length;
  const countExpense = filtered.filter(t => !t.isIncome).length;

  const triggerDownloadNotification = (fileName: string) => {
    setDownloadSuccess(fileName);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4500);
  };

  // 1. Genuine CSV Generation for Excel Download Option
  const handleDownloadCSV = () => {
    if (filtered.length === 0) {
      alert('No database ledger records to download. Add some transactions first!');
      return;
    }

    const headers = ['Serial No.', 'Date', 'Description / Title', 'Book Name', 'Amount (PKR)', 'Type'];
    const rows = filtered.map((t, idx) => [
      idx + 1,
      new Date(t.date).toLocaleDateString('en-GB'),
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.book.replace(/"/g, '""')}"`,
      t.amount,
      t.isIncome ? 'INCOME' : 'EXPENSE'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const formattedDate = new Date().toISOString().split('T')[0];
    const fileName = `Shahid_Sons_Cashbook_${selectedBook}_${formattedDate}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerDownloadNotification(fileName);
  };

  // 2. Custom Browser Print Layout mimicking PDF download / compilation
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Download Alert Toast */}
      {downloadSuccess && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-800 border border-emerald-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Download Successful</p>
              <p className="text-xs text-emerald-150 font-mono">{downloadSuccess}</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-700 px-2 py-1 rounded-md uppercase font-bold text-emerald-100">
            Local Saved
          </span>
        </motion.div>
      )}

      {/* Report Customizer panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
        <h3 className="font-sans font-bold text-zinc-900 text-base mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          General Store Compiled Reports
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Generate, filter & compile pristine physical cashbook logs off device memory without the need for active cellular internet connections.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Ledger Book Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-550 uppercase">Target Ledger Book</label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-805 text-sm cursor-pointer"
            >
              <option value="All">All Register Books (مسلسل تمام کھاتے)</option>
              {books.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Temporal Period Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-550 uppercase">Reporting Scope Period</label>
            <div className="grid grid-cols-3 gap-2">
              {(['All', 'Today', 'Month'] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setDateRange(scope)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    dateRange === scope 
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' 
                      : 'bg-white text-gray-600 border-gray-250 hover:bg-gray-50'
                  }`}
                >
                  {scope === 'All' ? 'All Ledger Time' : scope === 'Today' ? 'Today Only' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 shadow-xs">
        <div className="p-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Metric breakdown for period
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Income Transactions</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">{countIncome} items</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Expense Outflows</span>
              <span className="text-xl font-bold text-rose-600 mt-1 block">{countExpense} items</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Closing Cash Reserve</span>
              <span className={`text-xl font-bold mt-1 block ${closingBalance >= 0 ? 'text-zinc-800' : 'text-rose-600'}`}>
                PKR {closingBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Visual progress bar representation client-side */}
        <div className="p-6">
          <h5 className="text-xs font-bold text-zinc-700 mb-2">Cash Flow Distribution (آمدنی اور خرچ کا تناسب)</h5>
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400">Add transactions to view proportion visualizer</p>
          ) : (
            <div>
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${(totalIncome / (totalIncome + totalExpense || 1)) * 100}%` }}
                  className="bg-emerald-600 transition-all duration-500"
                  title="Income %"
                />
                <div 
                  style={{ width: `${(totalExpense / (totalIncome + totalExpense || 1)) * 100}%` }}
                  className="bg-rose-600 transition-all duration-500"
                  title="Expense %"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-mono">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
                  Cash IN: {Math.round((totalIncome / (totalIncome + totalExpense || 1)) * 100)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600 inline-block" />
                  Cash OUT: {Math.round((totalExpense / (totalIncome + totalExpense || 1)) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Beautiful Print Preview Statement */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6 print:border-none print:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 print:hidden">
          <div>
            <h4 className="font-sans font-bold text-zinc-900 text-sm">Ledger Statement Preview (کھاتہ اسٹیٹمنٹ)</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">This layout is optimized for high-contrast thermal & physical printers</p>
          </div>
          <span className="text-[10px] bg-sky-50 text-sky-700 px-2.5 py-1 rounded font-bold uppercase">
            {filtered.length} entries shown
          </span>
        </div>

        <div className="p-6 border border-zinc-200 rounded-2xl bg-zinc-50/50 print:bg-white print:border-none print:p-0 space-y-6">
          {/* Statement Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#196F3D]">Shahid &amp; Sons General Store</h3>
              <p className="text-xs text-gray-500">Premium Cashbook Ledger Report</p>
              <div className="text-[11px] text-gray-400 space-y-0.5 font-mono">
                <div>Ledger Book: <strong className="text-zinc-700">{selectedBook}</strong></div>
                <div>Filter Period: <strong className="text-zinc-700">{dateRange === 'All' ? 'All Ledger Time' : dateRange === 'Today' ? 'Today Only' : 'This Month'}</strong></div>
              </div>
            </div>

            {businessLogo ? (
              <img 
                src={businessLogo} 
                alt="Store Logo" 
                className="w-16 h-16 rounded-xl object-contain border border-gray-200 bg-white p-1 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-100 text-gray-400 flex flex-col items-center justify-center border border-gray-200 shrink-0 text-[10px] font-bold uppercase print:hidden">
                No Logo
              </div>
            )}
          </div>

          {/* Statement Calculations Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-white border border-gray-150 rounded-xl font-sans text-center print:border-zinc-350">
            <div>
              <span className="text-[9px] text-gray-400 font-bold uppercase block">Cash IN (+)</span>
              <span className="text-xs sm:text-sm font-black text-emerald-600">PKR {totalIncome.toLocaleString()}</span>
            </div>
            <div className="border-x border-gray-150 print:border-zinc-350">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">Cash OUT (-)</span>
              <span className="text-xs sm:text-sm font-black text-rose-600">PKR {totalExpense.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold uppercase block">Net Balance</span>
              <span className={`text-xs sm:text-sm font-black ${closingBalance >= 0 ? 'text-[#1F618D]' : 'text-rose-650'}`}>PKR {closingBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase text-[9px] font-bold tracking-wider">
                  <th className="py-2.5 w-8">#</th>
                  <th className="py-2.5 w-24">Date</th>
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5 w-20">Book</th>
                  <th className="py-2.5 text-right w-24">Cash IN</th>
                  <th className="py-2.5 text-right w-24">Cash OUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-zinc-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No matching records found for this period filter
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => {
                    const itemDate = new Date(item.date);
                    const formattedDate = itemDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                    });
                    
                    return (
                      <tr key={item.id} className="hover:bg-white/50 print:hover:bg-transparent">
                        <td className="py-2.5 font-mono text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="py-2.5 font-mono text-gray-500">{formattedDate}</td>
                        <td className="py-2.5 text-[#2C3E50]">{item.title}</td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-gray-100 border border-gray-200 text-gray-600">
                            {item.book}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-emerald-600">
                          {item.isIncome ? `PKR ${item.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-rose-600">
                          {!item.isIncome ? `PKR ${item.amount.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print PDF and CSV Downloads action panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800 shrink-0">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-zinc-900 text-sm">Download offline files (آف لائن فائلیں ڈاؤن لوڈ کریں)</h4>
            <p className="text-xs text-gray-500 mt-1">Export transaction summaries directly with zero mobile carrier internet usage.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button
            id="download-excel-btn"
            onClick={handleDownloadCSV}
            className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-rose-100 hover:shadow-lg"
          >
            <Download className="h-4 w-4" />
            Download Excel (.CSV)
          </button>
          
          <button
            id="download-pdf-btn"
            onClick={handlePrintPDF}
            className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-100 hover:shadow-lg"
          >
            <Printer className="h-4 w-4" />
            Print Ledger Register (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
