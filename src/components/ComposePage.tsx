import React, { useRef, useState } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Recipient, Page } from '../types';

interface ComposePageProps {
  recipients: Recipient[];
  template: string;
  onSetTemplate: (text: string) => void;
  onNavigate: (page: Page) => void;
}

export default function ComposePage({
  recipients,
  template,
  onSetTemplate,
  onNavigate
}: ComposePageProps) {
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  // Insert template variable placeholder at text cursor position
  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onSetTemplate(template + placeholder);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const updatedText = before + placeholder + after;
    onSetTemplate(updatedText);

    // Reposition cursor after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 50);
  };

  // Helper to generate a personalized preview
  const getPersonalizedMessage = (name: string, phone: string) => {
    let msg = template;
    msg = msg.replace(/{Name}/gi, name);
    msg = msg.replace(/{Phone}/gi, phone);
    return msg;
  };

  // Current recipient preview selector
  const activePreviewRecipient = recipients[previewIndex] || { name: 'Recipient Name', phone: '+15550000000' };

  const handlePrevPreview = () => {
    if (recipients.length === 0) return;
    setPreviewIndex(prev => (prev - 1 + recipients.length) % recipients.length);
  };

  const handleNextPreview = () => {
    if (recipients.length === 0) return;
    setPreviewIndex(prev => (prev + 1) % recipients.length);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Template Composer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Composer Left Card (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col gap-4 shadow-xs">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Compose Message Template</h2>
            <p className="text-xs text-slate-500 mt-0.5">Use tags to dynamically customize message segments for each phone recipient</p>
          </div>

          <div className="flex items-center justify-between mt-1">
            <label className="text-xs font-bold text-slate-600">Your SMS Text body</label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dynamic tags:</span>
              <button
                type="button"
                onClick={() => insertPlaceholder('{Name}')}
                className="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition cursor-pointer flex items-center gap-1"
                title="Inserts name tag"
              >
                <span>👤 Name</span>
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder('{Phone}')}
                className="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition cursor-pointer flex items-center gap-1"
                title="Inserts phone tag"
              >
                <span>📞 Phone</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={template}
              onChange={(e) => onSetTemplate(e.target.value)}
              placeholder="Type your message text. Use {Name} and {Phone} to inject custom recipient metadata."
              rows={6}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition leading-relaxed text-slate-800"
            ></textarea>
          </div>

          {/* Counters banner */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Character count</span>
              <span className="text-sm font-extrabold text-slate-800">{template.length} Chars</span>
            </div>
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">SMS messages parts</span>
              <span className="text-sm font-extrabold text-slate-800">
                {Math.ceil(template.length / 160) || 1} {Math.ceil(template.length / 160) === 1 ? 'part' : 'parts'}
                <span className="text-slate-400 font-normal text-xs ml-1">(160/part)</span>
              </span>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/60 flex items-start gap-2.5 text-xs">
            <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-indigo-950 leading-relaxed">
              <span className="font-bold block">Why use variable tags?</span>
              Tags allow you to personalize each client's message. BulkSend replaces <code className="font-mono bg-white px-1 border rounded text-[10px]">{"{Name}"}</code> with the client's name cell and <code className="font-mono bg-white px-1 border rounded text-[10px]">{"{Phone}"}</code> with their phone number dynamically.
            </div>
          </div>
        </div>

        {/* Live Preview Card Right (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-4 shadow-xs sticky top-24">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Dynamic Message Preview</h3>
            <p className="text-[11px] text-slate-400">See how messages render before you dispatch your carrier queue</p>
          </div>

          {/* iOS / Android simulated chat bubble */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200/60 min-h-[160px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">To: {activePreviewRecipient.name}</span>
              <span className="text-[10px] font-mono text-slate-400">{activePreviewRecipient.phone}</span>
            </div>

            <div className="flex-1 flex items-end justify-start">
              <div className="bg-indigo-600 text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-bl-none max-w-[85%] shadow-xs leading-relaxed animate-in fade-in duration-100">
                {getPersonalizedMessage(activePreviewRecipient.name, activePreviewRecipient.phone) || <em className="opacity-50">Empty Template message</em>}
              </div>
            </div>

            <div className="text-[9px] text-slate-400 text-right mt-3">
              SIM Network Carrier Preview
            </div>
          </div>

          {/* Preview Navigation */}
          {recipients.length > 1 && (
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <button
                onClick={handlePrevPreview}
                className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                title="Previous contact preview"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-[11px] font-bold text-slate-600">
                Contact {previewIndex + 1} of {recipients.length}
              </span>

              <button
                onClick={handleNextPreview}
                className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                title="Next contact preview"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('add-recipients')}
          className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Recipients</span>
        </button>

        <button
          disabled={!template.trim()}
          onClick={() => onNavigate('confirmation')}
          className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition flex items-center gap-2 ${
            !template.trim()
              ? 'bg-slate-300 cursor-not-allowed opacity-80' 
              : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm shadow-indigo-100'
          }`}
        >
          <span>Go to Delivery Center</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
