import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  Trash2, 
  Plus, 
  CheckCircle, 
  X, 
  Info, 
  BookOpen,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Recipient, Page } from '../types';

interface AddRecipientsPageProps {
  recipients: Recipient[];
  onSetRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  onNavigate: (page: Page) => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  addBlankRow: () => void;
  deleteRecipient: (id: string) => void;
}

export default function AddRecipientsPage({
  recipients,
  onSetRecipients,
  onNavigate,
  updateRecipient,
  addBlankRow,
  deleteRecipient
}: AddRecipientsPageProps) {
  
  const [pastedData, setPastedData] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'paste' | 'manual'>('paste');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccessCount, setParseSuccessCount] = useState<number | null>(null);

  // File uploader handler for both Excel (.xlsx, .xls) and CSV/text files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          // Parse sheet as 2D array of rows
          const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
          
          // Map to TSV format for the clipboard/pastedData textarea
          const tsvText = rows
            .map(row => 
              row.map(cell => (cell === null || cell === undefined) ? '' : String(cell).replace(/\t|\r|\n/g, ' ')).join('\t')
            )
            .join('\n');

          setPastedData(tsvText);
          setActiveTab('paste');
          setParseError(null);
        } catch (err) {
          setParseError('Error reading Excel spreadsheet. Please verify the file is not corrupted.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setPastedData(text);
          setActiveTab('paste');
          setParseError(null);
        }
      };
      reader.readAsText(file);
    }
  };

  // Parse pasted table / CSV data
  const handleImportPastedData = () => {
    if (!pastedData.trim()) {
      setParseError('Please paste spreadsheet columns or CSV text first.');
      return;
    }

    setParseError(null);
    const lines = pastedData.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParseError('No text lines found to parse.');
      return;
    }

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(';')) {
      delimiter = ';';
    } else if (firstLine.includes(',')) {
      delimiter = ',';
    }

    const parsedLines = lines.map(line => {
      let cols: string[] = [];
      if (delimiter === ',') {
        cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      } else {
        cols = line.split(delimiter);
      }
      return cols.map(c => c.replace(/^["']|["']$/g, '').trim());
    });

    let startIndex = 0;
    let nameColIndex = 0;
    let phoneColIndex = 1;

    // Detect header row
    if (parsedLines.length > 0) {
      const headers = parsedLines[0].map(h => h.toLowerCase());
      const hasHeader = headers.some(h => 
        h.includes('name') || h.includes('phone') || h.includes('number') || h.includes('tel') || h.includes('contact') || h.includes('recipient')
      );

      if (hasHeader) {
        startIndex = 1;
        const foundName = headers.findIndex(h => h.includes('name') || h.includes('contact') || h.includes('recipient'));
        if (foundName !== -1) nameColIndex = foundName;

        const foundPhone = headers.findIndex(h => h.includes('phone') || h.includes('number') || h.includes('tel') || h.includes('mobile'));
        if (foundPhone !== -1) phoneColIndex = foundPhone;
      } else {
        // Auto-guess columns based on content
        const firstRow = parsedLines[0];
        if (firstRow.length >= 2) {
          const col0Phone = /^[+\d\s()-]{5,}$/.test(firstRow[0]);
          const col1Phone = /^[+\d\s()-]{5,}$/.test(firstRow[1]);
          if (col0Phone && !col1Phone) {
            phoneColIndex = 0;
            nameColIndex = 1;
          } else {
            nameColIndex = 0;
            phoneColIndex = 1;
          }
        }
      }
    }

    const newRecipients: Recipient[] = [];
    parsedLines.slice(startIndex).forEach((row, i) => {
      const name = row[nameColIndex] || `Recipient ${recipients.length + newRecipients.length + 1}`;
      let rawPhone = row[phoneColIndex] || '';
      
      const phone = rawPhone.replace(/[^\d+]/g, '');

      if (phone) {
        newRecipients.push({
          id: `pasted-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: name,
          phone: phone,
          sent: false
        });
      }
    });

    if (newRecipients.length === 0) {
      setParseError('Could not extract any valid phone numbers. Make sure numbers contain digits.');
    } else {
      onSetRecipients(prev => [...prev, ...newRecipients]);
      setPastedData('');
      setParseSuccessCount(newRecipients.length);
      setTimeout(() => setParseSuccessCount(null), 4000);
      setActiveTab('manual'); // Toggle to table editor tab to view results
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Step Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Add Recipients</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload a file, copy-paste rows, or build manually</p>
          </div>
          
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('paste'); setParseError(null); }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Spreadsheet Paste / File
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('manual'); setParseError(null); }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Manual Spreadsheet Grid ({recipients.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {parseError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <X className="h-4 w-4 mt-0.5 text-rose-500 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parseSuccessCount !== null && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Successfully added {parseSuccessCount} recipients to the grid!</span>
            </div>
          )}

          {activeTab === 'paste' ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-600">Copy & Paste columns directly from Excel or Google Sheets</label>
                <label className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Upload Excel (.xlsx/.xls) or CSV</span>
                  <input 
                    type="file" 
                    accept=".csv,.txt,.xlsx,.xls" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              <textarea
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Name&#9;Phone Number&#10;John Smith&#9;+15551234567&#10;Alice Wright&#9;+15559876543&#10;&#10;Or paste standard comma/semicolon CSV data here..."
                rows={8}
                className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition leading-relaxed"
              ></textarea>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-3">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span>Columns automatically structured. Numbers formatted instantly.</span>
                </span>
                <button
                  onClick={handleImportPastedData}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shrink-0 shadow-sm cursor-pointer"
                  id="btn_import_submit"
                >
                  Parse & Load Contacts
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-600 block">
                    Interactive Grid Editor
                  </span>
                  <span className="text-[10px] text-slate-400">Values are updated in real-time. Feel free to edit cell text!</span>
                </div>
                
                {/* EXACTLY ONE Add Row button here, as requested */}
                <button
                  type="button"
                  onClick={addBlankRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
                  id="btn_add_blank_row_top"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Blank Row</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3 w-12 text-center">#</th>
                        <th className="px-4 py-3">Recipient Name</th>
                        <th className="px-4 py-3">Phone Number</th>
                        <th className="px-4 py-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recipients.length > 0 ? (
                        recipients.map((recipient, index) => (
                          <tr key={recipient.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-2 text-xs font-mono text-slate-400 text-center">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={recipient.name}
                                onChange={(e) => updateRecipient(recipient.id, { name: e.target.value })}
                                placeholder="Recipient Name (e.g. Alice)"
                                className="w-full text-xs bg-slate-50/50 border border-slate-200/80 rounded px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition font-medium text-slate-800"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="tel"
                                value={recipient.phone}
                                onChange={(e) => updateRecipient(recipient.id, { phone: e.target.value.replace(/[^\d+]/g, '') })}
                                placeholder="Phone (e.g. +15551234567)"
                                className="w-full text-xs bg-slate-50/50 border border-slate-200/80 rounded px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition font-mono text-slate-700"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => deleteRecipient(recipient.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-400">
                            <p className="font-bold">No contacts currently loaded</p>
                            <p className="text-[10px] mt-1">Click "Add Blank Row" above or paste spreadsheet rows to get started!</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-[11px] text-slate-500">
                  All changes are auto-saved. Click on any text cell to edit names and telephone inputs directly.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>

        <button
          disabled={recipients.length === 0}
          onClick={() => onNavigate('compose')}
          className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition flex items-center gap-2 ${
            recipients.length === 0 
              ? 'bg-slate-300 cursor-not-allowed opacity-80' 
              : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm shadow-indigo-100'
          }`}
        >
          <span>Continue to Compose</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
