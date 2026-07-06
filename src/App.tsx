/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  QrCode, 
  X, 
  Copy, 
  Check, 
  Home,
  Info
} from 'lucide-react';

// Modules & Components
import { Recipient, Page, DeviceOS } from './types';
import Stepper from './components/Stepper';
import HomePage from './components/HomePage';
import AddRecipientsPage from './components/AddRecipientsPage';
import ComposePage from './components/ComposePage';
import ConfirmationPage from './components/ConfirmationPage';

export default function App() {
  // Page Navigation State
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Broadcast List State
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    try {
      const saved = localStorage.getItem('bulk_sms_recipients');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If it contains the old default dummy array, clear it so the user starts with a clean slate
        const isDummy = Array.isArray(parsed) && parsed.length === 3 && 
          parsed[0]?.name === 'John Doe' && 
          parsed[1]?.name === 'Jane Smith' && 
          parsed[2]?.name === 'Robert Johnson';
        if (isDummy) return [];
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
    return localStorage.getItem('bulk_sms_template') || 'Hello {Name}, this is a personalized carrier message from our local SIM broadcast!';
  });

  const [deviceOS, setDeviceOS] = useState<DeviceOS>(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('macintosh')) {
        return 'ios';
      }
    }
    return 'android';
  });

  // UI status modals
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('bulk_sms_recipients', JSON.stringify(recipients));
  }, [recipients]);

  useEffect(() => {
    localStorage.setItem('bulk_sms_template', messageTemplate);
  }, [messageTemplate]);

  // Load URL-shared broadcast on mount
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
            // Clear hash so it doesn't linger
            window.history.replaceState(null, '', window.location.pathname);
            // Navigate straight to the confirmation view if a loaded broadcast list was shared
            setCurrentPage('confirmation');
          }
        }
      } catch (e) {
        console.error('Error loading shared hash data', e);
      }
    };

    handleHashLoad();
  }, []);

  // Sync database state serializer for QR transfers
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

  const handleCopyShareLink = () => {
    const shareUrl = generateShareURL();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Recipient database updates
  const updateRecipient = (id: string, updates: Partial<Recipient>) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addBlankRow = () => {
    const newRec: Recipient = {
      id: `manual-blank-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: '',
      phone: '',
      sent: false
    };
    setRecipients(prev => [...prev, newRec]);
  };

  const deleteRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const handleResetBroadcast = () => {
    setRecipients([]);
  };

  // Safe navigation controller
  const canNavigateTo = (page: Page): boolean => {
    if (page === 'home') return true;
    if (page === 'add-recipients') return true;
    if (page === 'compose') return recipients.length > 0;
    if (page === 'confirmation') return recipients.length > 0 && !!messageTemplate.trim();
    return false;
  };

  // QR rendering parameters
  const currentAppShareURL = generateShareURL();
  const qrCodeImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentAppShareURL)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo / Brand */}
          <button 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3 text-left focus:outline-hidden group border border-transparent bg-transparent cursor-pointer"
          >
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Smartphone className="h-6 w-6" id="logo_icon" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5" id="app_title">
                BulkSend
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Local SIM carrier orchestration</p>
            </div>
          </button>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            {currentPage !== 'home' && (
              <button
                onClick={() => setCurrentPage('home')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-transparent cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home Dashboard</span>
              </button>
            )}

            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs cursor-pointer"
              id="btn_open_on_mobile"
            >
              <QrCode className="h-4 w-4 text-indigo-500" />
              <span>📱 Open on Phone</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Campaign Stage Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        
        {/* progressive steps tracking indicator (Only shown when not on landing screen) */}
        {currentPage !== 'home' && (
          <Stepper 
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            canNavigateTo={canNavigateTo}
          />
        )}

        {/* Dynamic Page Router */}
        <div className="flex-1">
          {currentPage === 'home' && (
            <HomePage 
              recipients={recipients}
              template={messageTemplate}
              onNavigate={setCurrentPage}
              onResetBroadcast={handleResetBroadcast}
              onShowQR={() => setShowQRModal(true)}
            />
          )}

          {currentPage === 'add-recipients' && (
            <AddRecipientsPage 
              recipients={recipients}
              onSetRecipients={setRecipients}
              onNavigate={setCurrentPage}
              updateRecipient={updateRecipient}
              addBlankRow={addBlankRow}
              deleteRecipient={deleteRecipient}
            />
          )}

          {currentPage === 'compose' && (
            <ComposePage 
              recipients={recipients}
              template={messageTemplate}
              onSetTemplate={setMessageTemplate}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'confirmation' && (
            <ConfirmationPage 
              recipients={recipients}
              template={messageTemplate}
              deviceOS={deviceOS}
              onSetDeviceOS={setDeviceOS}
              onNavigate={setCurrentPage}
              onResetBroadcast={handleResetBroadcast}
              onShowQR={() => setShowQRModal(true)}
              updateRecipient={updateRecipient}
              deleteRecipient={deleteRecipient}
            />
          )}
        </div>
      </main>

      {/* Campaign sync modal / QR sync overlay */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-600" />
                <span className="font-extrabold text-slate-900 text-sm">Transfer Broadcast to Mobile</span>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center gap-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Scan this QR code with your mobile camera. It will securely copy the active contacts and template variables straight to your phone's browser so you can trigger carrier messages easily.
              </p>

              <div className="p-4 bg-white border-2 border-indigo-100 rounded-2xl shadow-xs">
                <img 
                  src={qrCodeImageURL} 
                  alt="Broadcast QR Sync" 
                  className="w-44 h-44 block"
                />
              </div>

              <div className="w-full flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct browser Link:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentAppShareURL}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 font-mono select-all focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100/60 p-2.5 rounded-lg w-full text-left flex items-start gap-1.5">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Zero Database Server tracking: All payload data is compiled directly in the hash parameters. No cloud storage is ever involved.</span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer"
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
          <div className="font-medium">
            BulkSend — Crafted for browser-to-native local carrier orchestration.
          </div>
          <div className="flex items-center gap-4 font-semibold text-slate-400">
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
