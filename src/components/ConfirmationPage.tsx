import React, { useState } from 'react';
import { 
  CheckCircle, 
  Trash2, 
  QrCode, 
  RotateCcw, 
  Search, 
  Smartphone, 
  MessageSquare, 
  Check, 
  Copy, 
  ArrowLeft,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { Recipient, Page, DeviceOS } from '../types';

interface ConfirmationPageProps {
  recipients: Recipient[];
  template: string;
  deviceOS: DeviceOS;
  onSetDeviceOS: (os: DeviceOS) => void;
  onNavigate: (page: Page) => void;
  onResetBroadcast: () => void;
  onShowQR: () => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  deleteRecipient: (id: string) => void;
}

export default function ConfirmationPage({
  recipients,
  template,
  deviceOS,
  onSetDeviceOS,
  onNavigate,
  onResetBroadcast,
  onShowQR,
  updateRecipient,
  deleteRecipient
}: ConfirmationPageProps) {
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedNumbers, setCopiedNumbers] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  // Filter list
  const filteredRecipients = recipients.filter(r => {
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.phone.includes(q);
  });

  // Calculations
  const totalCount = recipients.length;
  const sentCount = recipients.filter(r => r.sent).length;
  const pendingCount = totalCount - sentCount;
  const progressPercent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  // Find the first recipient who hasn't been sent yet for sequential fast-sending
  const nextPendingRecipient = recipients.find(r => !r.sent);
  const nextPendingIndex = nextPendingRecipient ? recipients.indexOf(nextPendingRecipient) : -1;

  // Personalized text generator
  const getPersonalizedMessage = (name: string, phone: string) => {
    let msg = template;
    msg = msg.replace(/{Name}/gi, name);
    msg = msg.replace(/{Phone}/gi, phone);
    return msg;
  };

  // SMS single link
  const getSingleSMSLink = (recipient: Recipient) => {
    const encodedBody = encodeURIComponent(getPersonalizedMessage(recipient.name, recipient.phone));
    if (deviceOS === 'ios') {
      return `sms:${recipient.phone}&body=${encodedBody}`;
    }
    return `sms:${recipient.phone}?body=${encodedBody}`;
  };

  // SMS group link
  const getGroupSMSLink = () => {
    const numbers = recipients.map(r => r.phone).join(deviceOS === 'ios' ? ';' : ',');
    const encodedBody = encodeURIComponent(template.replace(/{Name}/gi, 'there'));
    if (deviceOS === 'ios') {
      return `sms:${numbers}&body=${encodedBody}`;
    }
    return `sms:${numbers}?body=${encodedBody}`;
  };

  const handleCopyNumbersString = () => {
    const separator = deviceOS === 'ios' ? ';' : ',';
    const numString = recipients.map(r => r.phone).join(separator);
    navigator.clipboard.writeText(numString);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  const markAllSentStatus = (status: boolean) => {
    recipients.forEach(r => {
      updateRecipient(r.id, { sent: status });
    });
  };

  const toggleSentStatus = (id: string) => {
    const item = recipients.find(r => r.id === id);
    if (item) {
      updateRecipient(id, { sent: !item.sent });
    }
  };

  // Finish actions
  const handleCompleteBroadcast = () => {
    setIsSuccessModalOpen(true);
  };

  const handleFinishSuccess = () => {
    onResetBroadcast(); // Clean database
    setIsSuccessModalOpen(false);
    onNavigate('home'); // Go home successful
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 relative">
      
      {/* Sequential Fast Dispatch Hub (Optimized for Mobile/Phone view) */}
      {nextPendingRecipient ? (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-950 flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-200">
          {/* Subtle glowing mesh backgrounds */}
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="h-3 w-3" />
              <span>Carrier SIM Quick Send Hub</span>
            </div>
            <span className="text-xs font-bold text-indigo-200">
              Contact {nextPendingIndex + 1} of {totalCount}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Smartphone className="h-4.5 w-4.5 text-indigo-400" />
              <span>Send directly to: <span className="text-indigo-200">{nextPendingRecipient.name || 'Anonymous'}</span></span>
            </h3>
            <p className="text-xs font-mono text-indigo-300 font-semibold">{nextPendingRecipient.phone}</p>
          </div>

          {/* Body preview */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-indigo-100/90 leading-relaxed font-sans font-medium max-h-24 overflow-y-auto">
            <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Custom Message Preview:</span>
            {getPersonalizedMessage(nextPendingRecipient.name, nextPendingRecipient.phone)}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
            <a
              href={getSingleSMSLink(nextPendingRecipient)}
              onClick={() => {
                toggleSentStatus(nextPendingRecipient.id);
              }}
              className="flex-1 py-3 px-4 font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 text-center"
            >
              <Smartphone className="h-4 w-4 animate-bounce" />
              <span>📱 Tap to Send SMS Directly</span>
            </a>
            
            <button
              onClick={() => toggleSentStatus(nextPendingRecipient.id)}
              className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition border border-white/10 cursor-pointer"
            >
              Mark Sent (Skip)
            </button>
          </div>
          
          <div className="text-[10px] text-indigo-300/80 leading-normal flex items-start gap-1.5 border-t border-indigo-500/10 pt-2.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>How it works: Tapping the button opens your phone's native carrier SMS app. Press send in your SMS app, then simply switch back here. This controller will automatically update to the next contact!</span>
          </div>
        </div>
      ) : (
        totalCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center flex flex-col items-center gap-3 animate-in fade-in duration-200">
            <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-50">
              <CheckCircle className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-emerald-900 text-sm">All Dispatches Completed!</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Every contact in your active broadcast draft has been successfully marked as sent. Ready to wrap up?
              </p>
            </div>
            <button
              onClick={handleCompleteBroadcast}
              className="mt-1 px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition cursor-pointer"
            >
              Finish & Save Broadcast Report
            </button>
          </div>
        )
      )}

      {/* Overview Delivery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Active Checklist */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* List Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Interactive Dispatch Checklist</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Click "Send SMS" on each item. It will open your native client with the pre-filled text.</p>
            </div>
            
            <button
              onClick={() => markAllSentStatus(false)}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1 cursor-pointer"
              title="Reset all statuses to Pending"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Status</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/20 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient name or telephone..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition font-medium"
              />
            </div>
          </div>

          {/* Checklist Items Container */}
          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {filteredRecipients.length > 0 ? (
              filteredRecipients.map((recipient) => {
                const personalizedText = getPersonalizedMessage(recipient.name, recipient.phone);
                
                return (
                  <div 
                    key={recipient.id} 
                    className={`p-4 transition flex flex-col gap-2.5 ${recipient.sent ? 'bg-slate-50/60 opacity-80' : 'bg-white hover:bg-slate-50/20'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Status Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleSentStatus(recipient.id)}
                          className={`h-5 w-5 rounded-md border flex items-center justify-center transition shrink-0 mt-0.5 cursor-pointer ${
                            recipient.sent 
                              ? 'bg-emerald-500 border-emerald-600 text-white' 
                              : 'border-slate-300 hover:border-indigo-400 bg-white'
                          }`}
                          title={recipient.sent ? "Mark as Pending" : "Mark as Sent"}
                        >
                          {recipient.sent && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                        </button>

                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-xs font-extrabold text-slate-900 truncate ${recipient.sent ? 'line-through text-slate-400' : ''}`}>
                            {recipient.name || 'Anonymous Recipient'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 font-medium">
                            {recipient.phone || 'No phone'}
                          </span>
                        </div>
                      </div>

                      {/* Single Trash */}
                      <button
                        onClick={() => deleteRecipient(recipient.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                        title="Delete contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Renders dynamic customized SMS body preview */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed font-sans font-medium">
                      {personalizedText}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${recipient.sent ? 'text-emerald-600' : 'text-amber-500'}`}>
                        ● {recipient.sent ? 'Sent / Dispatched' : 'Pending Action'}
                      </span>

                      <a
                        href={getSingleSMSLink(recipient)}
                        onClick={() => {
                          if (!recipient.sent) {
                            toggleSentStatus(recipient.id);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shadow-xs ${
                          recipient.sent 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                        title="Opens your smartphone carrier application instantly"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>📱 Send SMS</span>
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-slate-400">
                <p className="font-bold">No contacts match search filter</p>
                <p className="text-[10px] mt-0.5">Try a different query or reload step 1.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Dashboard parameters & Group sends */}
        <div className="md:col-span-5 flex flex-col gap-6 sticky top-24">
          
          {/* Stats Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900">Broadcast Overview</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700">
                {totalCount} Total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispatched</span>
                <span className="text-lg font-extrabold text-emerald-600">{sentCount}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</span>
                <span className="text-lg font-extrabold text-indigo-600">{pendingCount}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Overall Completion</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Group Dispatch Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Group SMS Options</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              If your carrier bundle allows sending group text threads, you can launch a single thread containing all recipients:
            </p>

            <div className="flex flex-col gap-2 mt-1">
              <a
                href={getGroupSMSLink()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-xs text-center"
              >
                <MessageSquare className="h-4 w-4" />
                <span>📱 Launch Group SMS Thread</span>
              </a>

              <button
                onClick={handleCopyNumbersString}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              >
                {copiedNumbers ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copiedNumbers ? 'Phone numbers Copied!' : 'Copy Phone Numbers List'}</span>
              </button>
            </div>

            {/* Target Operating system selector */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
              <span className="text-[11px] font-bold text-slate-500">Your Phone OS:</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 shadow-xs">
                <button
                  onClick={() => onSetDeviceOS('android')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${deviceOS === 'android' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Android
                </button>
                <button
                  onClick={() => onSetDeviceOS('ios')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${deviceOS === 'ios' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  iOS
                </button>
              </div>
            </div>
          </div>

          {/* Quick QR Sync code */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-indigo-950/40 hidden md:flex flex-col gap-2">
            <span className="block text-xs font-extrabold text-indigo-400">Scan to Sync with Mobile Phone</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If you want to complete this checklist on your smartphone touch screen, tap the QR link below. It syncs the entire broadcast database privately through local URL state parameters.
            </p>
            <button
              onClick={onShowQR}
              className="mt-1 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-transparent"
            >
              <QrCode className="h-4 w-4" />
              <span>📱 Open Sync QR Code</span>
            </button>
          </div>

        </div>

      </div>

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => onNavigate('compose')}
          className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Compose</span>
        </button>

        <button
          onClick={handleCompleteBroadcast}
          className="px-6 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-md shadow-emerald-100 flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle className="h-4.5 w-4.5" />
          <span>Complete Broadcast</span>
        </button>
      </div>

      {/* Broadcast Success Celebration Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center flex flex-col items-center gap-4 animate-in zoom-in duration-200">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-50">
              <CheckCircle className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 flex items-center justify-center gap-1.5">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Broadcast Finished!
              </h3>
              <p className="text-xs text-slate-500 px-4">
                You successfully managed and dispatched your client contacts broadcast list using native SIM carrier channels!
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full text-left space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Total Contacts:</span>
                <span>{totalCount}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Dispatched checklist:</span>
                <span className="text-emerald-600">{sentCount} completed</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Local SIM tracking logs:</span>
                <span className="text-indigo-600">Securely Cleared</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full mt-2">
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Modify active list
              </button>
              <button
                onClick={handleFinishSuccess}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-md shadow-indigo-100"
              >
                Back to Home Page
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
