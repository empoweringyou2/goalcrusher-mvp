import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Upload, 
  Camera, 
  MessageCircle, 
  Users, 
  UserCheck, 
  Clock, 
  AlertCircle,
  Loader2,
  X,
  Send,
  Bell
} from 'lucide-react';
import { markTaskComplete } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  xp_reward: number;
}

interface UserSettings {
  accountability_type: 'self' | 'ai' | 'partner' | 'group';
  completion_method_setting: 'user' | 'ai' | 'external';
  default_proof_time_minutes: number;
}

interface TaskCompletionModalProps {
  task: Task;
  userSettings: UserSettings;
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted: (taskId: string, xpGained: number) => void;
  userId: string;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  task,
  userSettings,
  isOpen,
  onClose,
  onTaskCompleted,
  userId
}) => {
  const [reflection, setReflection] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiReviewStatus, setAiReviewStatus] = useState<'reviewing' | 'approved' | 'needs_more' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nudgeSent, setNudgeSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setReflection('');
      setUploadedFile(null);
      setIsSubmitting(false);
      setAiReviewStatus(null);
      setError(null);
      setNudgeSent(false);
    }
  }, [isOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleUserConfirmation = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error } = await markTaskComplete(task.id);
      
      if (error) {
        setError(error.message || 'Failed to complete task');
        return;
      }

      onTaskCompleted(task.id, data?.xp_gained || task.xp_reward);
      onClose();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiSubmission = async () => {
    setIsSubmitting(true);
    setAiReviewStatus('reviewing');
    setError(null);

    try {
      // Simulate AI review process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AI decision (in real implementation, this would call an AI service)
      const hasProof = uploadedFile || reflection.length > 20;
      const random = Math.random();
      
      if (hasProof && random > 0.3) {
        setAiReviewStatus('approved');
        
        // Complete the task
        const { data, error } = await markTaskComplete(task.id);
        
        if (error) {
          setError(error.message || 'Failed to complete task');
          setAiReviewStatus(null);
          return;
        }

        setTimeout(() => {
          onTaskCompleted(task.id, data?.xp_gained || task.xp_reward);
          onClose();
        }, 1500);
      } else {
        setAiReviewStatus('needs_more');
      }
    } catch (err) {
      setError('AI review failed. Please try again.');
      setAiReviewStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExternalSubmission = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // In a real implementation, this would notify the partner/group leader
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message and close
      onClose();
    } catch (err) {
      setError('Failed to send notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNudge = async () => {
    setIsSubmitting(true);
    try {
      // Simulate sending nudge
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNudgeSent(true);
    } catch (err) {
      setError('Failed to send nudge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUserCompletionModal = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Complete Task</h3>
        <p className="text-gray-400">Mark "{task.title}" as complete</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Reflection (Optional)
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How did this task go? Any insights or challenges?"
          className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none resize-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Proof/Evidence (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center">
          <input
            type="file"
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx"
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {uploadedFile ? uploadedFile.name : 'Click to upload file or drag and drop'}
            </p>
          </label>
        </div>
      </div>

      <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
        <p className="text-yellow-400 text-sm">
          💰 You'll earn {task.xp_reward} XP for completing this task!
        </p>
      </div>

      <button
        onClick={handleUserConfirmation}
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CheckCircle className="w-5 h-5" />
        )}
        {isSubmitting ? 'Completing...' : 'Confirm Task Complete'}
      </button>
    </div>
  );

  const renderAiCompletionModal = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Submit to Crushion</h3>
        <p className="text-gray-400">Crushion will verify your task completion</p>
      </div>

      {aiReviewStatus === 'reviewing' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
          <p className="text-blue-400 font-medium">Crushion is reviewing your submission...</p>
          <p className="text-gray-400 text-sm mt-1">This usually takes a few seconds</p>
        </div>
      )}

      {aiReviewStatus === 'approved' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-medium">Task approved by Crushion!</p>
          <p className="text-gray-400 text-sm mt-1">Great work! Your task has been completed.</p>
        </div>
      )}

      {aiReviewStatus === 'needs_more' && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-orange-400 mb-2" />
          <p className="text-orange-400 font-medium mb-2">Crushion needs more evidence</p>
          <p className="text-gray-400 text-sm">
            Please provide more details about your task completion or upload additional proof.
          </p>
        </div>
      )}

      {!aiReviewStatus && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Task Reflection <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Describe what you accomplished and how you completed this task..."
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none resize-none"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proof/Evidence
            </label>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                  id="ai-file-upload"
                />
                <label htmlFor="ai-file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    {uploadedFile ? uploadedFile.name : 'Upload photo, video, or document'}
                  </p>
                </label>
              </div>
              
              <button
                disabled
                className="w-full bg-gray-700 text-gray-400 py-2 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Photo (Coming Soon)
              </button>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              🤖 Crushion will review your submission and automatically complete the task if verified.
            </p>
          </div>
        </>
      )}

      {!aiReviewStatus && (
        <button
          onClick={handleAiSubmission}
          disabled={isSubmitting || !reflection.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MessageCircle className="w-5 h-5" />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit to Crushion'}
        </button>
      )}

      {aiReviewStatus === 'needs_more' && (
        <button
          onClick={() => setAiReviewStatus(null)}
          className="w-full bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
        >
          Add More Evidence
        </button>
      )}
    </div>
  );

  const renderExternalCompletionModal = () => {
    const isPartner = userSettings.accountability_type === 'partner';
    const isGroup = userSettings.accountability_type === 'group';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            {isPartner ? <UserCheck className="w-8 h-8 text-white" /> : <Users className="w-8 h-8 text-white" />}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">External Verification</h3>
          <p className="text-gray-400">
            {isPartner 
              ? 'Your accountability partner will verify this task'
              : 'Your group leader will review and verify this task'
            }
          </p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-purple-400 font-medium mb-1">Verification Process</p>
              <p className="text-gray-400 text-sm">
                {isPartner 
                  ? 'Your partner will receive a notification and can verify this task from their dashboard.'
                  : 'Your group leader will see this in the group dashboard and can approve or request more information.'
                }
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes for {isPartner ? 'Partner' : 'Group Leader'} (Optional)
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder={`Add any context or notes for your ${isPartner ? 'partner' : 'group leader'}...`}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Proof/Evidence (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center">
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="hidden"
              id="external-file-upload"
            />
            <label htmlFor="external-file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                {uploadedFile ? uploadedFile.name : 'Upload proof to help with verification'}
              </p>
            </label>
          </div>
        </div>

        {isGroup && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-yellow-400 inline mr-2" />
            <span className="text-yellow-400 text-sm">
              This task will be visible to your group members in the group feed.
            </span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleExternalSubmission}
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isSubmitting ? 'Submitting...' : `Submit for ${isPartner ? 'Partner' : 'Leader'} Review`}
          </button>

          <button
            onClick={handleSendNudge}
            disabled={isSubmitting || nudgeSent}
            className="w-full bg-gray-700 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {nudgeSent ? 'Nudge Sent!' : `Nudge ${isPartner ? 'Partner' : 'Leader'}`}
          </button>
        </div>

        {nudgeSent && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <p className="text-green-400 text-sm">
              ✅ Nudge sent! Your {isPartner ? 'partner' : 'group leader'} has been notified.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Complete Task</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {userSettings.completion_method_setting === 'user' && renderUserCompletionModal()}
          {userSettings.completion_method_setting === 'ai' && renderAiCompletionModal()}
          {userSettings.completion_method_setting === 'external' && renderExternalCompletionModal()}
        </div>
      </div>
    </div>
  );
};