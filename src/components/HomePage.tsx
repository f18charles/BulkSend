import React, { useState } from 'react';
import { 
  Smartphone, 
  Sparkles, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  QrCode,
  Info,
  Layers,
  CheckCircle,
  X,
  Trash2
} from 'lucide-react';
import { Recipient, Page } from '../types';

interface HomePageProps {
  recipients: Recipient[];
  template: string;
  onNavigate: (page: Page) => void;
  onResetBroadcast: () => void;
  onShowQR: () => void;
}

export default function HomePage({ 
  recipients, 
  template, 
  onNavigate, 
  onResetBroadcast,
  onShowQR
}: HomePageProps) {
  
  const totalContacts = recipients.length;
  const sentCount = recipients.filter(r => r.sent).length;
  const pendingCount = totalContacts - sentCount;
  
  // Custom Modal States (Replaces window.confirm)
  const [showConfirmNewModal, setShowConfirmNewModal] = useState<boolean>(false);
  const [showConfirmResetModal, setShowConfirmResetModal] = useState<boolean>(false);

  const handleStartFreshClick = () => {
    if (totalContacts > 0) {
      setShowConfirmNewModal(true);
    } else {
      onNavigate('add-recipients');
    }
  };

  const handleConfirmNewBroadcast = () => {
    onResetBroadcast();
    setShowConfirmNewModal(false);
    onNavigate('add-recipients');
  };

  const handleConfirmReset = () => {
    onResetBroadcast();
    setShowConfirmResetModal(false);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-4">
      {/* Visual Identity & Display Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-indigo-950 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        
        {/* Subtle glowing mesh backgrounds */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex-1 space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Carrier-Linked Local Dispatch</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Bulk SMS broadcast lists, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-100">
              powered by your own SIM.
            </span>
          </h1>
          
          <p className="text-sm text-indigo-200/90 leading-relaxed max-w-xl">
            Orchestrate personalized SMS broadcasts directly from spreadsheets fully inside your browser. No monthly fees, no centralized cloud databases, and no credit requirements. All dispatches run through your phone’s carrier subscription.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleStartFreshClick}
              className="px-6 py-3 font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 cursor-pointer group border border-transparent"
            >
              <Plus className="h-4.5 w-4.5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Create New Broadcast List</span>
              <ArrowRight className="h-4 w-4 ml-1 opacity-60" />
            </button>

            {totalContacts > 0 && (
              <button
                onClick={() => onNavigate('add-recipients')}
                className="px-6 py-3 font-bold text-sm bg-white/10 hover:bg-white/15 text-white rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <span>Resume Draft Broadcast</span>
                <span className="px-2 py-0.5 text-xs bg-indigo-600 rounded-full font-bold">
                  {totalContacts}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-3 bg-white/5 border border-white/10 p-5 rounded-2xl w-full md:w-auto relative z-10 md:min-w-[200px]">
          <Smartphone className="h-10 w-10 text-indigo-400" />
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-300">Run on Mobile</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Quick Broadcast Sync</span>
          </div>
          <button
            onClick={onShowQR}
            className="w-full mt-2 py-2 px-3 text-xs font-bold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Open QR Code</span>
          </button>
        </div>
      </div>

      {/* Broadcast Draft Tracker Banner */}
      {totalContacts > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Active Broadcast Status</span>
              <span className="text-sm font-extrabold text-slate-900">
                {totalContacts} Contacts • {sentCount} Sent • {pendingCount} Pending
              </span>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                Template: "{template}"
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onNavigate('confirmation')}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition cursor-pointer"
            >
              Go to Delivery Center
            </button>
            <button
              onClick={() => setShowConfirmResetModal(true)}
              className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer font-bold"
            >
              Reset All
            </button>
          </div>
        </div>
      )}

      {/* Feature Value Props Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-3">
          <div className="bg-emerald-50 text-emerald-700 h-10 w-10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">100% Local & Private</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your contact numbers and custom text bodies stay purely in your own device browser. There are no server databases logging or tracking your clients.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-3">
          <div className="bg-amber-50 text-amber-700 h-10 w-10 rounded-xl flex items-center justify-center">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">No Third Party Fees</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Stop paying expensive per-SMS API gateways like Twilio or Vonage. BulkSend utilizes your existing carrier bundle subscription entirely.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-3">
          <div className="bg-indigo-50 text-indigo-700 h-10 w-10 rounded-xl flex items-center justify-center">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Pre-fill Native Dispatch</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Triggers system deep-links to launch native carrier messaging clients on iOS and Android devices dynamically with one simple click.
            </p>
          </div>
        </div>
      </div>

      {/* Concept Instructions Block */}
      <div className="bg-slate-100 border border-slate-200/60 p-5 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Quick Tutorial</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-slate-600 leading-relaxed">
          <div>
            <span className="font-bold text-indigo-600 block mb-0.5">Step 1</span>
            Import spreadsheet columns (names, phone numbers) or paste simple table data.
          </div>
          <div>
            <span className="font-bold text-indigo-600 block mb-0.5">Step 2</span>
            Compose text template. Use tag brackets like <code className="font-bold font-mono text-[10px] bg-white border px-1 rounded">{"{Name}"}</code>.
          </div>
          <div>
            <span className="font-bold text-indigo-600 block mb-0.5">Step 3</span>
            Open the broadcast on your mobile phone instantly by scanning the secure QR code.
          </div>
          <div>
            <span className="font-bold text-indigo-600 block mb-0.5">Step 4</span>
            Tap single SMS items in the checklists to trigger native client SMS, then press send!
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modals (Fixes the IFrame window.confirm block) */}
      {showConfirmNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center flex flex-col items-center gap-4 animate-in zoom-in duration-200">
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Layers className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">Create New Broadcast List</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-4">
                Are you sure you want to discard your current broadcast draft and start a completely new one? This action is irreversible.
              </p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowConfirmNewModal(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Keep Draft
              </button>
              <button
                onClick={handleConfirmNewBroadcast}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Yes, Start New
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center flex flex-col items-center gap-4 animate-in zoom-in duration-200">
            <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">Reset Broadcast Database</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-4">
                Are you sure you want to wipe out your entire loaded contacts draft? All stored information in your local browser cache will be cleared.
              </p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowConfirmResetModal(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
