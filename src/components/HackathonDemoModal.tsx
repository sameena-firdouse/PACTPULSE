import React, { useState } from 'react';
import { User, Task } from '../types.js';
import {
  createTask,
  reportTaskDelay,
  generateTomorrowSchedule,
  approveProposal,
  testHindsightRecall,
  fetchTasks
} from '../api.js';
import {
  X,
  Play,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Database,
  Calendar,
  ShieldAlert,
  RotateCcw,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HackathonDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onRefreshData: () => void;
}

export const HackathonDemoModal: React.FC<HackathonDemoModalProps> = ({
  isOpen,
  onClose,
  users,
  onRefreshData
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const alex = users.find((u) => u.name.includes('Alex')) || users[1];
  const sarah = users.find((u) => u.role === 'employer') || users[0];

  const steps = [
    {
      num: 1,
      title: 'Employer Creates & Assigns Task',
      actor: `${sarah?.name || 'Sarah'} (Employer)`,
      desc: 'Sarah assigns "Client Wireframe & Branding Design" to Alex Morgan with a 3-hour estimate.',
      actionLabel: 'Execute Step 1: Assign Task',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage('Creating task for Alex Morgan...');
        const today = new Date().toISOString().split('T')[0];
        const task = await createTask({
          title: 'Client Wireframe & Branding Design',
          description: 'Deliver initial wireframe prototypes and review branding tokens with client.',
          assigned_to_id: alex.id,
          priority: 'high',
          date: today,
          start_time: '09:00',
          end_time: '12:00',
          estimated_hours: 3.0,
          deadline: `${today} 16:00`,
          dependencies: JSON.stringify(['Design Tokens'])
        });
        setStepData((prev) => ({ ...prev, taskStep1: task }));
        setStatusMessage(`Task created successfully (ID: ${task.id}).`);
        setIsLoading(false);
        setCurrentStep(2);
        onRefreshData();
      }
    },
    {
      num: 2,
      title: 'Employee Reports Delay & Explains Reason',
      actor: `${alex?.name || 'Alex'} (Employee)`,
      desc: 'Alex reports that the task took 5 hours instead of 3 because client stakeholder approvals took 2 extra hours.',
      actionLabel: 'Execute Step 2: Report Delay',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage('Alex reporting delay and blocker...');
        const taskId = stepData.taskStep1?.id || 'task-today-01';
        const delayRes = await reportTaskDelay(taskId, {
          delay_reason: 'Customer approval delayed by 2 hours due to pending CEO review on branding colors.',
          actual_hours: 5.0,
          blockers: 'External executive approval bottleneck'
        });
        setStepData((prev) => ({ ...prev, delayRes }));
        setStatusMessage('Delay reported! Ready for Hindsight ingestion.');
        setIsLoading(false);
        setCurrentStep(3);
        onRefreshData();
      }
    },
    {
      num: 3,
      title: 'Experience Retained in Hindsight Memory',
      actor: 'Vectorize Hindsight Engine',
      desc: 'The delay reason, actual duration (5h vs 3h), and root cause entities are retained into the long-term memory bank "pactpulse-demo".',
      actionLabel: 'Inspect Step 3: Verify Retain Ingestion',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage('Inspecting Hindsight memory retain log...');
        await new Promise((r) => setTimeout(r, 600));
        setStatusMessage('Experience safely retained into Hindsight memory bank.');
        setIsLoading(false);
        setCurrentStep(4);
      }
    },
    {
      num: 4,
      title: 'Employer Schedules Similar Task Next Day',
      actor: `${sarah?.name || 'Sarah'} (Employer)`,
      desc: 'Sarah plans tomorrow\'s schedule including "Website Redesign Phase 2 & Stakeholder Review".',
      actionLabel: 'Execute Step 4: Schedule Tomorrow Task',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage('Scheduling tomorrow\'s task...');
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const taskTomo = await createTask({
          title: 'Website Redesign Phase 2 & Stakeholder Review',
          description: 'Follow-up interactive prototype review with marketing and legal stakeholders.',
          assigned_to_id: alex.id,
          priority: 'high',
          date: tomorrow,
          start_time: '09:00',
          end_time: '12:00',
          estimated_hours: 3.0,
          deadline: `${tomorrow} 15:00`
        });
        setStepData((prev) => ({ ...prev, taskStep4: taskTomo }));
        setStatusMessage('Tomorrow task added to team plan.');
        setIsLoading(false);
        setCurrentStep(5);
        onRefreshData();
      }
    },
    {
      num: 5,
      title: 'AI Recalls Past Experience from Hindsight',
      actor: 'PactPulse AI + Hindsight Recall',
      desc: 'Gemini queries Hindsight memory for "website redesign stakeholder approval delay" and retrieves yesterday\'s recorded 2h approval bottleneck.',
      actionLabel: 'Execute Step 5: Recall Memories',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage('Querying Hindsight long-term memory bank via TEMPR search...');
        const recallRes = await testHindsightRecall('website redesign client approval bottleneck delay');
        setStepData((prev) => ({ ...prev, recallRes }));
        setStatusMessage('Recalled relevant past experience from Hindsight!');
        setIsLoading(false);
        setCurrentStep(6);
      }
    },
    {
      num: 6,
      title: 'AI Recommends Improved Protected Schedule',
      actor: 'Gemini Reasoning Agent',
      desc: 'Based on recalled Hindsight memory, AI recommends adding a 1.5h buffer, shifting start times earlier, and requiring client signoff earlier.',
      actionLabel: 'Execute Step 6: Generate Smarter Schedule',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage('Gemini reasoning with Hindsight memory context...');
        const planRes = await generateTomorrowSchedule();
        setStepData((prev) => ({ ...prev, tomorrowProposal: planRes }));
        setStatusMessage('Smarter schedule proposal generated with Hindsight citations!');
        setIsLoading(false);
        setCurrentStep(7);
        onRefreshData();
      }
    },
    {
      num: 7,
      title: 'Employer Approves Recommendation',
      actor: `${sarah?.name || 'Sarah'} (Employer)`,
      desc: 'Sarah reviews the proposed buffer and Hindsight rationale, then approves the schedule with 1 click.',
      actionLabel: 'Execute Step 7: One-Click Approve',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage('Employer approving schedule proposal...');
        const proposalId = stepData.tomorrowProposal?.proposalId;
        if (proposalId) {
          await approveProposal(proposalId);
        }
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setStatusMessage('Proposal approved and schedule updated!');
        setIsLoading(false);
        setCurrentStep(8);
        onRefreshData();
      }
    },
    {
      num: 8,
      title: 'New Outcome Retained for Future Learning',
      actor: 'Continuous Hindsight Learning Loop',
      desc: 'The approval decision and revised buffer configuration are stored back in Hindsight, making future scheduling cycles even smarter.',
      actionLabel: 'Finish Walkthrough',
      execute: async () => {
        setIsLoading(true);
        await new Promise((r) => setTimeout(r, 500));
        confetti({ particleCount: 120, spread: 90 });
        setIsLoading(false);
        setStatusMessage('🎉 Complete 60-Second Hackathon Walkthrough Finished!');
      }
    }
  ];

  const currentStepObj = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Zap className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  60-Second Hackathon Walkthrough
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  8-Step Story
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Demonstrating "AI Agents That Learn Using Hindsight"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
          {steps.map((s) => {
            const isDone = currentStep > s.num;
            const isCurr = currentStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  isCurr
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : isDone
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span>#{s.num}</span>
                )}
                <span className="hidden sm:inline text-[11px] font-sans">
                  {s.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Active Step Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                Step {currentStepObj.num} of 8
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                Actor: {currentStepObj.actor}
              </span>
            </div>

            <h4 className="text-lg font-bold text-white leading-tight">
              {currentStepObj.title}
            </h4>

            <p className="text-sm text-slate-300 leading-relaxed">
              {currentStepObj.desc}
            </p>

            {/* Dynamic Step Results & Explanations */}
            {currentStep === 2 && stepData.delayRes && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-mono">
                ✓ Recorded delay: actual 5.0h vs estimated 3.0h (+2.0h variance)
              </div>
            )}

            {currentStep === 3 && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1.5">
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  Vectorize Hindsight Memory Bank: "pactpulse-demo"
                </div>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded-lg">
                  RETAIN: "Task 'Client Wireframe & Branding Design' took 5h instead of estimated 3h. Reason: Customer approval delayed by 2 hours due to pending CEO review on branding colors."
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-1.5">
                <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Hindsight Recall Query:
                </div>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded-lg">
                  RECALL: "website redesign stakeholder approval bottleneck" → Retrieved memory: Alex Morgan experienced 2h approval delay on previous website review.
                </div>
              </div>
            )}

            {currentStep === 6 && stepData.tomorrowProposal && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1.5">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  AI Protective Adjustments:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  {stepData.tomorrowProposal.tomorrowPlan?.improvementsApplied?.map((imp: string, i: number) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentStep === 8 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/30 text-center space-y-2">
                <div className="text-emerald-400 font-bold text-base">
                  🎉 Continuous Hindsight Loop Completed!
                </div>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  The schedule is protected against recurring delays. Tomorrow's workday starts with full historical awareness!
                </p>
              </div>
            )}
          </div>

          {statusMessage && (
            <div className="text-xs text-indigo-300 font-mono flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(1)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart from Step 1
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-white"
            >
              Exit Tour
            </button>

            {currentStep < 8 ? (
              <button
                onClick={currentStepObj.execute}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{currentStepObj.actionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Explore PactPulse Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
