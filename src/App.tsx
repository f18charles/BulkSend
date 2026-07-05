/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Trash2, 
  Plus, 
  Smartphone, 
  MessageSquare, 
  CheckCircle, 
  X, 
  HelpCircle, 
  Info, 
  Copy, 
  Check, 
  QrCode, 
  RotateCcw, 
  RefreshCw,
  Search,
  ArrowRight,
  Sparkles,
  PhoneCall,
  UserPlus,
  Moon,
  Sun,
  BookOpen
} from 'lucide-react';

// Interfaces
interface Recipient {
  id: string;
  name: string;
  phone: string;
  sent: boolean;
  notes?: string;
}

export default function App() {
  // Persistence state
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    try {
      const saved = localStorage.getItem('bulk_sms_recipients');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'John Doe', phone: '+15551234567', sent: false },
        { id: '2', name: 'Jane Smith', phone: '+15557654321', sent: false },
        { id: '3', name: 'Robert Johnson', phone: '+15559876543', sent: false }
      ];
    } catch {
      return [];
    }
  });

  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
    return localStorage.getItem('bulk_sms_template') || 'Hello {Name}, this is a personalized carrier message from our local SIM campaign!';
  });

  const [deviceOS, setDeviceOS] = useState<'android' | 'ios'>(() => {
    // Basic detection
    if (typeof window !== 'undefined' && window.navigator) {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('macintosh')) {
        return 'ios';
      }
    }
    return 'android';
  });

  // UI state
  const [pastedData, setPastedData] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedNumbers, setCopiedNumbers] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'paste' | 'manual'>('paste');
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccessCount, setParseSuccessCount] = useState<number | null>(null);
  
  // Custom cursor insertion for textareas
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem('bulk_sms_recipients', JSON.stringify(recipients));
  }, [recipients]);

  useEffect(() => {
    localStorage.setItem('bulk_sms_template', messageTemplate);
  }, [messageTemplate]);

  // Handle URL short share (pack state into hash so users can scan to load on phone)
  const generateShareURL = () => {
    try {
      const payload = {
        r: recipients.map(rec => [rec.name, rec.phone, rec.sent ? 1 : 0]),
        t: messageTemplate
      };
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}#data=${serialized}`;
    } catch (e) {
      return window.location.href;
    }
  };

  // Check if hash data exists on mount
  useEffect(() => {
    const handleHashLoad = () => {
      try {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#data=')) {
          const serialized = hash.substring(6);
          const decoded = JSON.parse(decodeURIComponent(escape(atob(serialized))));
          if (decoded && Array.isArray(decoded.r)) {
            const loadedRecipients: Recipient[] = decoded.r.map((row: any, idx: number) => ({
              id: `hash-${idx}-${Date.now()}`,
              name: row[0] || 'Recipient',
              phone: row[1] || '',
              sent: !!row[2]
            }));
            if (loadedRecipients.length > 0) {
              setRecipients(loadedRecipients);
            }
            if (decoded.t) {
              setMessageTemplate(decoded.t);
            }
            // Clear hash so it doesn't stay forever
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } catch (e) {
        console.error('Error loading shared hash data', e);
      }
    };

    handleHashLoad();
  }, []);

  // Personalized Message Generator
  const getPersonalizedMessage = (name: string, phone: string) => {
    let msg = messageTemplate;
    msg = msg.replace(/{Name}/gi, name);
    msg = msg.replace(/{Phone}/gi, phone);
    return msg;
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
        // Basic CSV field parser respecting quotes
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
      
      // Clean up phone number: keep only + and digits
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
      setRecipients(prev => [...prev, ...newRecipients]);
      setPastedData('');
      setParseSuccessCount(newRecipients.length);
      setTimeout(() => setParseSuccessCount(null), 4000);
    }
  };

  // Add individual manual recipient
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone.trim()) return;

    const cleanedPhone = manualPhone.replace(/[^\d+]/g, '');
    if (!cleanedPhone) {
      setParseError('Please enter a valid numeric phone number.');
      return;
    }

    const newRec: Recipient = {
      id: `manual-${Date.now()}`,
      name: manualName.trim() || `Recipient ${recipients.length + 1}`,
      phone: cleanedPhone,
      sent: false
    };

    setRecipients(prev => [...prev, newRec]);
    setManualName('');
    setManualPhone('');
  };

  // Insert template variable placeholder at text cursor position
  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const updatedText = before + placeholder + after;
    setMessageTemplate(updatedText);

    // Reposition cursor after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 50);
  };

  // CSV file uploader handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPastedData(text);
        setActiveTab('paste');
      }
    };
    reader.readAsText(file);
  };

  // Clear or reset status
  const clearAllRecipients = () => {
    if (window.confirm('Are you sure you want to delete all recipients from the campaign?')) {
      setRecipients([]);
    }
  };

  const markAllSentStatus = (status: boolean) => {
    setRecipients(prev => prev.map(r => ({ ...r, sent: status })));
  };

  const deleteRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const toggleSentStatus = (id: string) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, sent: !r.sent } : r));
  };

  // Load sample contacts
  const loadSampleCampaign = () => {
    const sample = [
      { id: 's1', name: 'Alice Smith', phone: '+15550199283', sent: false },
      { id: 's2', name: 'Bob Sterling', phone: '+15550148492', sent: false },
      { id: 's3', name: 'Charlie Dean', phone: '+15550172834', sent: true },
      { id: 's4', name: 'Diana Prince', phone: '+15550123948', sent: false },
      { id: 's5', name: 'Evan Wright', phone: '+15550157584', sent: false }
    ];
    setRecipients(sample);
    setMessageTemplate('Hi {Name}, quick update! Your appointment confirmation number is {Phone}. Have a great week!');
  };

  // Search & Filter
  const filteredRecipients = recipients.filter(r => {
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.phone.includes(q);
  });

  // Calculate stats
  const totalCount = recipients.length;
  const sentCount = recipients.filter(r => r.sent).length;
  const pendingCount = totalCount - sentCount;
  const progressPercent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  // SMS Deep Link Generation
  // Trigger single SMS message (Personalized)
  const getSingleSMSLink = (recipient: Recipient) => {
    const encodedBody = encodeURIComponent(getPersonalizedMessage(recipient.name, recipient.phone));
    // Correct query parameter indicator based on OS selection
    if (deviceOS === 'ios') {
      return `sms:${recipient.phone}&body=${encodedBody}`;
    }
    return `sms:${recipient.phone}?body=${encodedBody}`;
  };

  // Trigger group SMS message (Generic/Template)
  // Combines all recipient numbers together
  const getGroupSMSLink = () => {
    const numbers = recipients.map(r => r.phone).join(deviceOS === 'ios' ? ';' : ',');
    const encodedBody = encodeURIComponent(messageTemplate.replace(/{Name}/gi, 'there'));
    if (deviceOS === 'ios') {
      return `sms:${numbers}&body=${encodedBody}`;
    }
    return `sms:${numbers}?body=${encodedBody}`;
  };

  // Copy raw phone numbers to clipboard
  const handleCopyNumbersString = () => {
    const separator = deviceOS === 'ios' ? ';' : ',';
    const numString = recipients.map(r => r.phone).join(separator);
    navigator.clipboard.writeText(numString);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  // Copy responsive app link for mobile usage
  const handleCopyShareLink = () => {
    const shareUrl = generateShareURL();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // QR Code Image link
  const currentAppShareURL = generateShareURL();
  const qrCodeImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentAppShareURL)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Upper Navigation / App Brand */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100">
              <Smartphone className="h-6 w-6" id="logo_icon" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900" id="app_title">BulkSend</h1>
              <p className="text-xs text-slate-500 font-medium">100% Free Carrier-Based Messaging Tool</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            <button
              onClick={loadSampleCampaign}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition cursor-pointer"
              id="btn_load_sample"
            >
              ✨ Try Demo Campaign
            </button>
            
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer"
              id="btn_open_on_mobile"
            >
              <QrCode className="h-4 w-4 text-indigo-500" />
              <span>📱 Open on Mobile Phone</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Concept Explainer Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="explainer_card">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 mb-3 border border-indigo-500/30">
              <Sparkles className="h-3 w-3" />
              <span>How it works</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-2">Send Bulk SMS directly with your local Phone SIM</h2>
            <p className="text-sm text-indigo-200 leading-relaxed">
              This tool helps you import client contacts from Excel spreadsheets/CSVs, customize a personalized template with variable tags, and launch carrier messages. Since it uses deep <code className="text-indigo-300 font-mono text-xs bg-indigo-950/60 px-1 rounded">sms:</code> integration, all SMS messages are sent through your device's native messaging app, covered 100% by your carrier's native SIM card limits!
            </p>
          </div>
          
          <div className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-500/20 text-xs text-indigo-100 flex flex-col gap-2 w-full md:w-auto md:min-w-[240px]">
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <Info className="h-4 w-4 text-indigo-400" />
              <span>Carrier-Friendly Setup</span>
            </div>
            <p>1. Upload file or copy-paste columns.</p>
            <p>2. Set variable tags like <span className="font-mono text-indigo-300 font-semibold">{"{Name}"}</span>.</p>
            <p>3. Tap individual send links below to pre-populate messages instantly.</p>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Step 1 & 2: Creator & Composer Dashboard (8 Columns on desktop) */}
          <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">
            
            {/* Step 1: Add / Load Contacts */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="card_step1">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                  <h3 className="font-bold text-slate-900">Add Recipients</h3>
                </div>
                
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => { setActiveTab('paste'); setParseError(null); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${activeTab === 'paste' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Spreadsheet Paste / File
                  </button>
                  <button
                    onClick={() => { setActiveTab('manual'); setParseError(null); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${activeTab === 'manual' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Manual Row
                  </button>
                </div>
              </div>

              <div className="p-5">
                {parseError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                    <X className="h-4 w-4 mt-0.5 text-rose-500 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}

                {parseSuccessCount !== null && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Successfully added {parseSuccessCount} recipients from spreadsheet!</span>
                  </div>
                )}

                {activeTab === 'paste' ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600">Copy & Paste from Excel, Google Sheets, or CSV</label>
                      <label className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer">
                        <Upload className="h-3 w-3" />
                        <span>Upload CSV File Instead</span>
                        <input 
                          type="file" 
                          accept=".csv,.txt" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    <textarea
                      value={pastedData}
                      onChange={(e) => setPastedData(e.target.value)}
                      placeholder="Name&#9;Phone Number&#10;Alice Smith&#9;+15551234567&#10;Bob Taylor&#9;+15557654321&#10;&#10;Or paste standard comma/semicolon CSV data here..."
                      rows={6}
                      className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    ></textarea>

                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        <span>Supports tabular copy pasting directly. Columns auto-guessed!</span>
                      </span>
                      <button
                        onClick={handleImportPastedData}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shrink-0 shadow-xs cursor-pointer"
                        id="btn_import_submit"
                      >
                        Parse & Add Recipients
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAddManual} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Full Name</label>
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="John Doe (Optional)"
                        className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                    <div className="flex-1 w-full flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Phone Number</label>
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="+15551234567"
                        required
                        className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-850 rounded-lg transition flex items-center gap-1.5 shrink-0 h-10 cursor-pointer"
                      id="btn_add_manual_submit"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Step 2: Compose Message Template */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="card_step2">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                  <h3 className="font-bold text-slate-900">Compose Message Template</h3>
                </div>
                
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Personalize dynamically</span>
                </span>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Your SMS Text Campaign</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Insert dynamic tag:</span>
                    <button
                      type="button"
                      onClick={() => insertPlaceholder('{Name}')}
                      className="px-2 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition"
                      title="Inserts name tag"
                    >
                      👤 {"{Name}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertPlaceholder('{Phone}')}
                      className="px-2 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition"
                      title="Inserts phone tag"
                    >
                      📞 {"{Phone}"}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    placeholder="Type your text template here. Use {Name} to personalize each SMS."
                    rows={4}
                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3.5 pr-10 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition leading-relaxed"
                  ></textarea>
                </div>

                {/* Counter & Carrier Meta */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div>
                      Character count: <span className="font-bold text-slate-900">{messageTemplate.length}</span>
                    </div>
                    <div className="h-3.5 w-px bg-slate-200"></div>
                    <div>
                      Estimated SMS count: <span className="font-bold text-slate-900">{Math.ceil(messageTemplate.length / 160) || 1}</span>
                      <span className="text-slate-400"> (160 chars/part)</span>
                    </div>
                  </div>

                  <div className="text-slate-500 font-medium text-right flex items-center gap-1 justify-end">
                    <span className="text-indigo-600">🔒 Zero tracking:</span>
                    <span>All rendering remains local on your device.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Guide Card */}
            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100/70 p-5 flex items-start gap-3">
              <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs text-indigo-950">
                <span className="font-bold">Important Carrier Information</span>
                <p className="leading-relaxed">
                  Mobile web browsers have certain protection standards. If you are launching multiple messages, clicking the individual <strong>📱 Send SMS</strong> action tags in the checklist is the most reliable way. It pre-populates your native carrier app instantly for each person, and you can simply press 'Send' on your phone with zero setup!
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Campaign Delivery Center (5 Columns on desktop) */}
          <div className="col-span-1 lg:col-span-5 flex flex-col gap-6">
            
            {/* Step 3: Send & Manage Dashboard */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="card_step3">
              
              {/* Card Header & Global Status */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                    <h3 className="font-bold text-slate-900">Campaign Overview</h3>
                  </div>
                  
                  {/* Total Recipients Count Badge */}
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {totalCount} {totalCount === 1 ? 'Contact' : 'Contacts'}
                  </span>
                </div>

                {/* Progress Indicators */}
                {totalCount > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Delivery progress</span>
                      <span>{sentCount} of {totalCount} sent ({progressPercent}%)</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic mt-1">
                    Add or paste recipients to start your messaging tracker.
                  </div>
                )}
              </div>

              {/* Toolbar Actions */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex flex-wrap items-center justify-between gap-3">
                
                {/* OS Target Config */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Device OS:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white shadow-xs">
                    <button
                      onClick={() => setDeviceOS('android')}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md transition cursor-pointer ${deviceOS === 'android' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Android
                    </button>
                    <button
                      onClick={() => setDeviceOS('ios')}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md transition cursor-pointer ${deviceOS === 'ios' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      iOS
                    </button>
                  </div>
                </div>

                {/* Global reset & action buttons */}
                {totalCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => markAllSentStatus(false)}
                      className="p-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition flex items-center gap-1"
                      title="Reset all to Pending"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      onClick={clearAllRecipients}
                      className="p-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition flex items-center gap-1"
                      title="Clear contact list"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete All</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Group Trigger Option Panel */}
              {totalCount > 0 && (
                <div className="p-4 bg-indigo-50/40 border-b border-slate-100 text-xs">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start gap-1.5 text-indigo-950 font-medium">
                      <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>Launch Group Message Options</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Opens your mobile carrier app with <strong>all recipients pre-added</strong> to a single group thread:
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <a
                        href={getGroupSMSLink()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs"
                        id="btn_launch_group_sms"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>📱 Send Group SMS</span>
                      </a>

                      <button
                        onClick={handleCopyNumbersString}
                        className="inline-flex items-center gap-1 px-3 py-1.5 font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-xs cursor-pointer"
                        title="Copies all telephone numbers to paste inside your phone client"
                      >
                        {copiedNumbers ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>Copy Numbers List</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient Search Filter */}
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/20">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or number..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Recipients Checklist Area */}
              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                {filteredRecipients.length > 0 ? (
                  filteredRecipients.map((recipient) => {
                    const personalizedText = getPersonalizedMessage(recipient.name, recipient.phone);
                    
                    return (
                      <div 
                        key={recipient.id} 
                        className={`p-4 transition flex flex-col gap-2.5 ${recipient.sent ? 'bg-slate-50/60 opacity-75' : 'bg-white hover:bg-slate-50/30'}`}
                      >
                        {/* Recipient Meta Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Sent Status Toggle Checkbox */}
                            <button
                              onClick={() => toggleSentStatus(recipient.id)}
                              className={`h-5 w-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${recipient.sent ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 hover:border-indigo-400 bg-white'}`}
                              title={recipient.sent ? "Mark as Pending" : "Mark as Sent"}
                            >
                              {recipient.sent && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                            </button>

                            <div className="flex flex-col">
                              <span className={`text-xs font-bold text-slate-900 ${recipient.sent ? 'line-through text-slate-400' : ''}`}>
                                {recipient.name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
                                {recipient.phone}
                              </span>
                            </div>
                          </div>

                          {/* Delete Item action */}
                          <button
                            onClick={() => deleteRecipient(recipient.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Delete contact"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Personalized Preview Message */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[11px] text-slate-600 leading-relaxed font-sans relative group">
                          <span className="absolute -top-2 right-2 bg-indigo-50 text-indigo-600 text-[9px] px-1.5 py-0.5 rounded-full border border-indigo-100 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Preview
                          </span>
                          {personalizedText}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          {/* Quick indicator label */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${recipient.sent ? 'text-emerald-600' : 'text-amber-600'}`}>
                            ● {recipient.sent ? 'Sent' : 'Pending'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Instant Trigger Link */}
                            <a
                              href={getSingleSMSLink(recipient)}
                              onClick={() => {
                                // Automatically mark as sent when they click to trigger native app
                                if (!recipient.sent) {
                                  toggleSentStatus(recipient.id);
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition shadow-xs ${recipient.sent ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                              title="Opens SMS carrier application pre-filled"
                            >
                              <Smartphone className="h-3 w-3" />
                              <span>📱 Send SMS</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="h-8 w-8 text-slate-300" />
                    <div>
                      <p className="text-xs font-bold text-slate-500">No contacts loaded</p>
                      <p className="text-[11px]">Use Step 1 or click "Try Demo Campaign" above to test!</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* QR Code / Share Campaign Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-600" />
                <span className="font-bold text-slate-900 text-sm">Transfer Campaign to Mobile Phone</span>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center gap-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan this QR code with your mobile phone's camera. It will instantly open this application on your device with your active template and recipient numbers fully pre-loaded!
              </p>

              {/* Generated QR Code Image */}
              <div className="p-4 bg-white border-2 border-indigo-100 rounded-2xl shadow-xs">
                <img 
                  src={qrCodeImageURL} 
                  alt="Campaign QR Code" 
                  className="w-48 h-48 block"
                />
              </div>

              {/* Share url action block */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 text-left uppercase">Direct Campaign link:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentAppShareURL}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 font-mono select-all focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shrink-0 flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100/60 p-2.5 rounded-lg w-full">
                🔒 Private Serverless Transfer: Data encoded entirely within the QR URL parameters. No server databases are involved.
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer className="bg-slate-100 border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            BulkSend — Crafted for browser-to-native local carrier orchestration.
          </div>
          <div className="flex items-center gap-4">
            <span>No data logs</span>
            <span>•</span>
            <span>Offline-capable</span>
            <span>•</span>
            <span>SIM cost covered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
