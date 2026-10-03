import React from 'react';
import {
  Check,
  CheckCheck,
  Compass,
  ExternalLink,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Pin,
  Bookmark,
  Reply,
  ThumbsUp,
  Trash2,
  Headphones,
  Mic,
  Play
} from 'lucide-react';
import {
  ChatMessage,
  LinkedPortalObject,
  MessageTaskPayload
} from '../../services/centralMessagingService';
import { SecurityUser } from '../../types/security';

interface MessageBubbleItemProps {
  message: ChatMessage;
  currentUser: SecurityUser;
  onReply: (msg: ChatMessage) => void;
  onTogglePin: (messageId: string) => void;
  onToggleBookmark: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onConvertToTask: (msg: ChatMessage) => void;
  onDelete: (messageId: string) => void;
  onAcknowledge: (messageId: string) => void;
  onUpdateTaskStatus: (messageId: string, status: MessageTaskPayload['status']) => void;
  onUpdateApprovalStatus: (messageId: string, decision: 'approved' | 'rejected' | 'revision_requested') => void;
  onOpenPortalLink: (portal: LinkedPortalObject) => void;
  onQuickReplyText: (text: string) => void;
}

export const MessageBubbleItem: React.FC<MessageBubbleItemProps> = ({
  message,
  currentUser,
  onReply,
  onTogglePin,
  onToggleBookmark,
  onToggleReaction,
  onConvertToTask,
  onDelete,
  onAcknowledge,
  onUpdateTaskStatus,
  onUpdateApprovalStatus,
  onOpenPortalLink,
  onQuickReplyText
}) => {
  // System event center banner (matching "Chat got taken over by customer service" in screenshot)
  if (message.contentType === 'system_event') {
    return (
      <div className="flex justify-center my-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 text-slate-700 text-xs font-medium">
          <Headphones className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  const isOutgoing =
    message.senderId === currentUser.id || message.senderId === 'usr-superadmin';

  const hasAcknowledged = (message.acknowledgedByUserIds || []).includes(currentUser.id);

  return (
    <div
      className={`group flex flex-col ${
        isOutgoing ? 'items-end' : 'items-start'
      } my-2.5`}
    >
      <div className={`flex items-end gap-2.5 max-w-[82%] ${isOutgoing ? 'flex-row' : 'flex-row'}`}>
        {/* Main Message Bubble */}
        <div className="flex flex-col space-y-1.5 min-w-[200px]">
          {/* Reply Quote Context if replying */}
          {message.replyToSnippet && (
            <div
              className={`px-3 py-1.5 rounded-lg text-[11px] border-l-2 ${
                isOutgoing
                  ? 'bg-blue-700/40 border-white/70 text-blue-50'
                  : 'bg-slate-200/70 border-slate-400 text-slate-600'
              }`}
            >
              <span className="font-semibold">{message.replyToSenderName}: </span>
              <span className="opacity-90">{message.replyToSnippet}</span>
            </div>
          )}

          {/* Bubble Body */}
          <div
            className={`relative px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${
              isOutgoing
                ? 'bg-[#0070F3] text-white rounded-br-md'
                : 'bg-[#F1F3F5] text-slate-800 rounded-bl-md'
            }`}
          >
            {/* Sender Name & Role header for non-outgoing or group clarity */}
            <div className="flex items-center justify-between gap-3 mb-1">
              <span
                className={`text-[11px] font-semibold ${
                  isOutgoing ? 'text-blue-100' : 'text-slate-600'
                }`}
              >
                {message.senderName} · {message.senderRole}
              </span>
              <div className="flex items-center gap-1.5">
                {message.priority !== 'normal' && (
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isOutgoing ? 'text-amber-200' : 'text-orange-600'
                    }`}
                  >
                    {message.priority}
                  </span>
                )}
                {message.isPinned && (
                  <Pin className={`w-3 h-3 ${isOutgoing ? 'text-amber-200' : 'text-orange-500'}`} />
                )}
                {message.isBookmarked && (
                  <Bookmark className={`w-3 h-3 ${isOutgoing ? 'text-amber-200' : 'text-blue-600'}`} />
                )}
              </div>
            </div>

            {/* Message Text */}
            <p className="whitespace-pre-wrap break-words">{message.content}</p>

            {/* Embedded Task Card */}
            {message.taskPayload && (
              <div
                className={`mt-3 p-3 rounded-xl border ${
                  isOutgoing
                    ? 'bg-blue-800/50 border-blue-400/40 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>{message.taskPayload.taskCode}</span>
                  </span>
                  <span className="text-[11px] font-semibold capitalize">
                    Status: {message.taskPayload.status.replace('_', ' ')} ({message.taskPayload.progressPercent}%)
                  </span>
                </div>
                <p className="text-xs font-bold mt-1">{message.taskPayload.title}</p>
                <p className={`text-[11px] mt-0.5 ${isOutgoing ? 'text-blue-100' : 'text-slate-500'}`}>
                  Assigned to: {message.taskPayload.assignedToName} ({message.taskPayload.assignedToRole}) · Due {message.taskPayload.dueDate}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {message.taskPayload.status !== 'completed' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateTaskStatus(message.id, 'in_progress')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          isOutgoing
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                        }`}
                      >
                        Accept & Start
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateTaskStatus(message.id, 'completed')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors"
                      >
                        Mark Complete
                      </button>
                    </>
                  )}
                  {message.taskPayload.linkedPortal && (
                    <button
                      type="button"
                      onClick={() => onOpenPortalLink(message.taskPayload!.linkedPortal!)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 ${
                        isOutgoing
                          ? 'bg-white text-blue-700 hover:bg-blue-50'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>Open {message.taskPayload.linkedPortal.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Embedded Approval Request Card */}
            {message.approvalPayload && (
              <div
                className={`mt-3 p-3 rounded-xl border ${
                  isOutgoing
                    ? 'bg-blue-800/50 border-blue-400/40 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold">
                    {message.approvalPayload.referenceCode} · {message.approvalPayload.requestType}
                  </span>
                  <span className="text-[11px] font-semibold capitalize">
                    {message.approvalPayload.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs font-bold mt-1">{message.approvalPayload.title}</p>
                <p className={`text-[11px] mt-0.5 ${isOutgoing ? 'text-blue-100' : 'text-slate-600'}`}>
                  Scope / Value: {message.approvalPayload.amountOrScope}
                </p>
                {message.approvalPayload.status === 'pending' ? (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <button
                      type="button"
                      onClick={() => onUpdateApprovalStatus(message.id, 'approved')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateApprovalStatus(message.id, 'revision_requested')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Request Revision</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateApprovalStatus(message.id, 'rejected')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] mt-2 font-medium">
                    Decision by {message.approvalPayload.decidedBy} at {message.approvalPayload.decidedAt}
                  </p>
                )}
              </div>
            )}

            {/* Embedded Portal / Function Deep-Link Card */}
            {message.linkedPortal && !message.taskPayload && (
              <div
                onClick={() => onOpenPortalLink(message.linkedPortal!)}
                className={`mt-2.5 p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isOutgoing
                    ? 'bg-blue-700/60 hover:bg-blue-700/80 border-blue-400/40 text-white'
                    : 'bg-white hover:bg-blue-50/40 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isOutgoing ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{message.linkedPortal.title}</p>
                    <p className={`text-[11px] truncate ${isOutgoing ? 'text-blue-100' : 'text-slate-500'}`}>
                      {message.linkedPortal.subtitle}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
                    isOutgoing ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                  }`}
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            )}

            {/* Attachments (Drawings, PDFs, Voice notes) */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {message.attachments.map(att => (
                  <div
                    key={att.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 text-xs ${
                      isOutgoing
                        ? 'bg-blue-800/40 border-blue-400/30 text-white'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {att.fileType === 'voice' ? (
                        <Mic className="w-4 h-4 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{att.name}</p>
                        <p className={`text-[10px] ${isOutgoing ? 'text-blue-100' : 'text-slate-400'}`}>
                          {att.sizeLabel} {att.previewText ? `· ${att.previewText}` : ''}
                        </p>
                      </div>
                    </div>
                    {att.fileType === 'voice' && (
                      <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-mono flex items-center gap-1">
                        <Play className="w-2.5 h-2.5" /> {att.durationLabel || '0:24'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mandatory Acknowledgement Bar */}
            {message.requiresAcknowledgement && (
              <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between gap-2 text-[11px]">
                <span>
                  Confirmed by {(message.acknowledgedByUserIds || []).length} user(s)
                </span>
                {!hasAcknowledged ? (
                  <button
                    type="button"
                    onClick={() => onAcknowledge(message.id)}
                    className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-bold"
                  >
                    Confirm & Acknowledge
                  </button>
                ) : (
                  <span className="font-semibold">✓ Acknowledged</span>
                )}
              </div>
            )}

            {/* Timestamp & Read Status in bottom right of bubble (matching "13.34" in screenshot) */}
            <div
              className={`flex items-center justify-end gap-1 mt-1 text-[11px] font-mono tabular-nums ${
                isOutgoing ? 'text-blue-100' : 'text-slate-400'
              }`}
            >
              <span>{message.timestamp}</span>
              {isOutgoing && (
                message.deliveryStatus === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-100" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-blue-200" />
                )
              )}
            </div>
          </div>

          {/* Quick-Action Blue Pill Buttons directly below the bubble (matching "Retry Checking the Balance" | "Speak to a Representative" in screenshot) */}
          {message.quickActions && message.quickActions.length > 0 && (
            <div className={`flex flex-wrap items-center gap-2 pt-0.5 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
              {message.quickActions.map(qa => (
                <button
                  key={qa.id}
                  type="button"
                  onClick={() => {
                    if (qa.actionType === 'open_portal' && qa.linkedPortal) {
                      onOpenPortalLink(qa.linkedPortal);
                    } else {
                      onQuickReplyText(qa.label);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0070F3] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{qa.label}</span>
                  {qa.actionType === 'open_portal' && <ExternalLink className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}

          {/* Reactions Bar */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
              {message.reactions.map(r => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onToggleReaction(message.id, r.emoji)}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 flex items-center gap-1"
                >
                  <span>{r.emoji}</span>
                  <span className="text-[10px] font-semibold">{r.userIds.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Hover Message Actions Toolbar */}
          <div
            className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-slate-400 ${
              isOutgoing ? 'justify-end' : 'justify-start'
            }`}
          >
            <button
              type="button"
              onClick={() => onReply(message)}
              title="Reply / Quote"
              className="p-1 rounded hover:bg-slate-100 hover:text-slate-700"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleReaction(message.id, '👍')}
              title="React 👍"
              className="p-1 rounded hover:bg-slate-100 hover:text-slate-700"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onTogglePin(message.id)}
              title="Pin Message"
              className="p-1 rounded hover:bg-slate-100 hover:text-slate-700"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleBookmark(message.id)}
              title="Save / Bookmark"
              className="p-1 rounded hover:bg-slate-100 hover:text-slate-700"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onConvertToTask(message)}
              title="Convert Message to Task"
              className="p-1 rounded hover:bg-slate-100 hover:text-blue-600 text-[10px] font-semibold flex items-center gap-0.5"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Task</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              title="Delete Message"
              className="p-1 rounded hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Avatar Badge on Outgoing Messages (matching orange bot/agent icon and user avatar on the right of outgoing blue bubbles in screenshot) */}
        {isOutgoing && (
          <div
            className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-2xs ${
              message.contentType === 'portal_link' || message.contentType === 'task'
                ? 'bg-amber-500'
                : 'bg-slate-800'
            }`}
            title={`${message.senderName} (${message.senderRole})`}
          >
            {message.senderAvatarInitials}
          </div>
        )}
      </div>
    </div>
  );
};
