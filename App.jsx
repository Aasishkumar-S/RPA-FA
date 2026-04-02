import React, { useState } from 'react';
import { Search, Download, Table, AlertCircle, Loader2, ChevronRight, Check } from 'lucide-react';
import axios from 'axios';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedTable, setSelectedTable] = useState(0);

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);
    setSelectedTable(0);

    try {
      // Connect to local python backend
      const response = await axios.post('http://localhost:8000/extract', { url });
      
      if (response.data.success) {
        setData(response.data);
      } else {
        setError(response.data.message || 'Failed to extract tables.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!data || !data.tables[selectedTable]) return;
    
    const tableData = data.tables[selectedTable];
    
    try {
      const response = await axios.post(
        'http://localhost:8000/download', 
        { data: tableData.data, columns: tableData.columns },
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `extracted_table_${selectedTable + 1}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download CSV.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-royalblue-950 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Header Section */}
      <div className="max-w-3xl w-full text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-royalblue-500/10 rounded-2xl mb-4 border border-royalblue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <Table className="w-8 h-8 text-royalblue-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Table Extractor <span className="text-transparent bg-clip-text bg-gradient-to-r from-royalblue-400 to-cyan-300">AI</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
          Instantly grab tabular data from any website. Cleaned, structured, and ready for CSV download.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="max-w-3xl w-full glass-card rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-royalblue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <form onSubmit={handleExtract} className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://en.wikipedia.org/wiki/List_of_countries_by_GDP"
                className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-royalblue-500 focus:border-royalblue-500 transition-all duration-300 shadow-inner"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              className="px-8 py-4 bg-gradient-to-r from-royalblue-600 to-royalblue-500 hover:from-royalblue-500 hover:to-royalblue-400 text-white rounded-2xl font-semibold shadow-lg shadow-royalblue-500/25 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  Extract Tables
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {data && data.tables && data.tables.length > 0 && (
        <div className="max-w-5xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
              {data.tables.map((table, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTable(idx)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    selectedTable === idx 
                      ? 'bg-royalblue-500 text-white shadow-md shadow-royalblue-500/20' 
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {selectedTable === idx && <Check className="w-4 h-4" />}
                  Table {idx + 1}
                  <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs opacity-80">
                    {table.row_count} rows
                  </span>
                </button>
              ))}
            </div>
            
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden border border-slate-700/50">
            <div className="p-4 bg-slate-900/40 border-b border-slate-700/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <Table className="w-4 h-4" />
                Previewing top 10 rows
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {data.tables[selectedTable].col_count} columns
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900/60 text-slate-300/80 uppercase text-xs font-semibold">
                  <tr>
                    {data.tables[selectedTable].columns.map((col, i) => (
                      <th key={i} className="px-6 py-4 border-b border-slate-700/50">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {data.tables[selectedTable].preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      {data.tables[selectedTable].columns.map((col, j) => (
                        <td key={j} className="px-6 py-3">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data.tables[selectedTable].row_count > 10 && (
              <div className="p-3 text-center text-xs text-slate-500 bg-slate-900/20">
                Showing 10 of {data.tables[selectedTable].row_count} rows. Download CSV to see all data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State / Success No Data */}
      {data && data.tables && data.tables.length === 0 && (
        <div className="max-w-3xl w-full glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-slate-700/50 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">No Tables Found</h3>
          <p className="text-slate-400 max-w-md">
             We couldn't detect any structured &lt;table&gt; data on this page. The site may be heavily JavaScript-rendered or use CSS grid layouts instead of traditional HTML tables.
          </p>
        </div>
      )}

    </div>
  );
}

export default App;
