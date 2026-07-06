import React from 'react';
import { Users, MessageSquare, CheckSquare, ChevronRight } from 'lucide-react';
import { Page } from '../types';

interface StepperProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  canNavigateTo: (page: Page) => boolean;
}

export default function Stepper({ currentPage, onNavigate, canNavigateTo }: StepperProps) {
  const steps = [
    { id: 'add-recipients' as Page, label: 'Add Contacts', icon: Users, desc: 'Import list or enter rows' },
    { id: 'compose' as Page, label: 'Compose Template', icon: MessageSquare, desc: 'Design your custom message' },
    { id: 'confirmation' as Page, label: 'Delivery Center', icon: CheckSquare, desc: 'Dispatch & track campaign' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 mb-6">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentPage === step.id;
          const isCompleted = 
            (step.id === 'add-recipients' && (currentPage === 'compose' || currentPage === 'confirmation')) ||
            (step.id === 'compose' && currentPage === 'confirmation');
          const isClickable = canNavigateTo(step.id);

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <button
                type="button"
                onClick={() => isClickable && onNavigate(step.id)}
                disabled={!isClickable}
                className={`flex-1 flex items-center gap-3 text-left p-2.5 rounded-xl transition w-full md:w-auto ${
                  isActive 
                    ? 'bg-indigo-50/70 border border-indigo-100' 
                    : isClickable 
                      ? 'hover:bg-slate-50 cursor-pointer border border-transparent' 
                      : 'opacity-50 cursor-not-allowed border border-transparent'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : isCompleted 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' 
                      : 'bg-slate-100 text-slate-500'
                }`}>
                  {isCompleted ? (
                    <span className="font-bold text-xs">✓</span>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className={`block text-xs font-bold ${isActive ? 'text-indigo-900' : isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {step.desc}
                  </span>
                </div>
              </button>

              {/* Connector line between steps */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center text-slate-300 px-2 shrink-0">
                  <ChevronRight className="h-5 w-5 stroke-[1.5]" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
