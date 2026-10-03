import React, { useState } from 'react';
import {
  Edit3,
  Hash,
  MessageSquare,
  Phone,
  MapPin,
  Plus,
  Paperclip,
  Smile,
  MoreHorizontal,
  Compass,
  ExternalLink,
  Building2,
  ClipboardList
} from 'lucide-react';
import {
  ConversationThread,
  ChatMessage,
  LinkedPortalObject
} from '../../services/centralMessagingService';

interface RightContextInspectorProps {
  thread: ConversationThread | null;
  threadMessages: ChatMessage[];
  onAddNote: (content: string) => void;
  onAddAttribute: (label: string, value: string) => void;
  onOpenPortalLink: (portal: LinkedPortalObject) => void;
  onOpenPortalPicker: () => void;
  onOpenTaskModal: () => void;
}

export const RightContextInspector: React.FC<RightContextInspectorProps> = ({
  thread,
  threadMessages,
  onAddNote,
  onAddAttribute,
  onOpenPortalLink,
  onOpenPortalPicker,
  onOpenTaskModal
}) => {
  const [noteInput, setNoteInput] = useState('');
  const [isAddingAttr, setIsAddingAttr] = useState(false);
  const [attrLabel, setAttrLabel] = useState('');
  const [attrValue, setAttrValue] = useState('');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'notes' | 'tasks_objects'>('notes');

  if (!thread) {
    return (
      <aside className="w-80 border-l border-slate-200 bg-white p-6 hidden xl:flex flex-col items-center justify-center text-center">
        <p className="text-xs text-slate-400">Select a conversation to inspect participant details, linked portals, and team notes.</p>
      </aside>
    );
  }

  const sharedTasksAndApprovals = threadMessages.filter(
    m => m.taskPayload || m.approvalPayload || m.linkedPortal
  );

  const handleNoteSubmit = () => {
    if (!noteInput.trim()) return;
    onAddNote(noteInput.trim());
    setNoteInput('');
  };

  const handleCreateAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrLabel.trim() || !attrValue.trim()) return;
    onAddAttribute(attrLabel.trim(), attrValue.trim());
    setAttrLabel('');
    setAttrValue('');
    setIsAddingAttr(false);
  };

  return (
    <aside className="w-[315px] shrink-0 border-l border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Top Participant Header matching screenshot */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-full ${thread.avatarColor} text-white font-semibold text-xs flex items-center justify-center shrink-0`}
          >
            {thread.avatarInitials}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate">{thread.title}</h3>
            <p className="text-[11px] text-slate-500 truncate">{thread.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingAttr(!isAddingAttr)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
        >
          <Edit3 className="w-3 h-3 text-slate-500" />
          <span>Edit</span>
        </button>
      </div>

      {/* Scrollable Inspector Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Attributes Table matching Channel, ID, Phone num..., Address */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-[105px_1fr] items-start gap-2">
            <span className="text-slate-400 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Channel</span>
            </span>
            <span className="text-slate-800 font-medium">{thread.channelLabel}</span>
          </div>

          <div className="grid grid-cols-[105px_1fr] items-start gap-2">
            <span className="text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>ID</span>
            </span>
            <span className="text-slate-800 font-mono tabular-nums">{thread.referenceNumber}</span>
          </div>

          <div className="grid grid-cols-[105px_1fr] items-start gap-2">
            <span className="text-slate-400 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Phone num...</span>
            </span>
            <span className="text-slate-800 font-mono tabular-nums">
              {thread.contactPhone || '+94 77 412 8890'}
            </span>
          </div>

          <div className="grid grid-cols-[105px_1fr] items-start gap-2">
            <span className="text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Address</span>
            </span>
            <span className="text-slate-700 leading-relaxed">
              {thread.contactAddress || 'Colombo Industrial Complex, Sri Lanka'}
            </span>
          </div>

          {thread.projectName && (
            <div className="grid grid-cols-[105px_1fr] items-start gap-2">
              <span className="text-slate-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Project</span>
              </span>
              <span className="text-slate-800 font-medium">{thread.projectName}</span>
            </div>
          )}

          {thread.customAttributes.map(attr => (
            <div key={attr.id} className="grid grid-cols-[105px_1fr] items-start gap-2">
              <span className="text-slate-400 truncate">{attr.label}</span>
              <span className="text-slate-800 font-medium">{attr.value}</span>
            </div>
          ))}

          {isAddingAttr ? (
            <form onSubmit={handleCreateAttribute} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <input
                type="text"
                placeholder="Attribute name (e.g. Cost Center)"
                value={attrLabel}
                onChange={e => setAttrLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                placeholder="Attribute value"
                value={attrValue}
                onChange={e => setAttrValue(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingAttr(false)}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingAttr(true)}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 pt-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add new attribute</span>
            </button>
          )}
        </div>

        {/* Direct Linked Portal Card */}
        {thread.defaultLinkedPortal && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400">Primary Linked Portal</span>
              <button
                type="button"
                onClick={onOpenPortalPicker}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                Share Portal
              </button>
            </div>
            <div
              onClick={() => onOpenPortalLink(thread.defaultLinkedPortal!)}
              className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{thread.defaultLinkedPortal.title}</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{thread.defaultLinkedPortal.subtitle}</p>
            </div>
          </div>
        )}

        {/* Section Switcher: Notes vs Shared Tasks & Objects */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveInspectorTab('notes')}
                className={`text-xs font-semibold transition-colors ${
                  activeInspectorTab === 'notes'
                    ? 'text-slate-900'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Notes ({thread.notes.length})
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('tasks_objects')}
                className={`text-xs font-semibold transition-colors ${
                  activeInspectorTab === 'tasks_objects'
                    ? 'text-slate-900'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Tasks & Links ({sharedTasksAndApprovals.length})
              </button>
            </div>
          </div>

          {activeInspectorTab === 'notes' ? (
            <div className="space-y-4">
              {/* Write a note input box matching screenshot */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 focus-within:bg-white focus-within:border-slate-300 transition-colors">
                <textarea
                  rows={2}
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleNoteSubmit();
                    }
                  }}
                  placeholder="Write a note ..."
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent resize-none focus:outline-none"
                />
                <div className="flex items-center justify-between pt-2 mt-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <button
                      type="button"
                      onClick={onOpenPortalPicker}
                      title="Attach Portal Reference"
                      className="hover:text-slate-600 transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteInput(prev => `${prev} ✅ `)}
                      title="Insert Status Marker"
                      className="hover:text-slate-600 transition-colors"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {noteInput.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={handleNoteSubmit}
                      className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold"
                    >
                      Add Note
                    </button>
                  )}
                </div>
              </div>

              {/* Chronological Team Notes list matching screenshot */}
              <div className="space-y-4">
                {thread.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    No internal notes yet. Type above and press Enter to record a note for authorized roles.
                  </p>
                ) : (
                  thread.notes.map(note => (
                    <div key={note.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {note.authorInitials}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">{note.authorName}</p>
                            <p className="text-[10px] text-slate-400">{note.timestamp}</p>
                          </div>
                        </div>
                        <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-9">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onOpenTaskModal}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>+ Assign New Task or Approval</span>
              </button>

              {sharedTasksAndApprovals.map(m => (
                <div key={m.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 text-xs">
                  {m.taskPayload && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-blue-600">
                          {m.taskPayload.taskCode}
                        </span>
                        <span className="text-[11px] text-slate-500 capitalize">
                          {m.taskPayload.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 mt-0.5">{m.taskPayload.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Assignee: {m.taskPayload.assignedToName} · Due {m.taskPayload.dueDate}
                      </p>
                    </div>
                  )}
                  {m.approvalPayload && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-orange-600">
                          {m.approvalPayload.referenceCode}
                        </span>
                        <span className="text-[11px] text-slate-500 capitalize">
                          {m.approvalPayload.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 mt-0.5">{m.approvalPayload.title}</p>
                      <p className="text-[11px] text-slate-500">{m.approvalPayload.amountOrScope}</p>
                    </div>
                  )}
                  {m.linkedPortal && (
                    <button
                      type="button"
                      onClick={() => onOpenPortalLink(m.linkedPortal!)}
                      className="w-full pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <span className="truncate">Open {m.linkedPortal.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
