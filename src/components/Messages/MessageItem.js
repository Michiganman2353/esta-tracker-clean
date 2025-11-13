// src/components/messages/messageitem.js
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const MessageItem = ({ authUser, message, onEditMessage, onRemoveMessage }) => {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [loading, setLoading] = useState(false);

  const isOwner = authUser?.uid === message.userId;

  const handleToggleEdit = () => {
    setEditMode(!editMode);
    setEditText(message.text);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onEditMessage(message, editText);
      setEditMode(false);
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      setLoading(true);
      try {
        await onRemoveMessage(message.uid);
      } catch (error) {
        console.error('Delete failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const timeAgo = message.editedAt
    ? formatDistanceToNow(message.editedAt.toDate(), { addSuffix: true })
    : formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true });

  return (
    <li className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editMode ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows="3"
              aria-label="Edit message"
            />
          ) : (
            <p className="text-gray-900 dark:text-gray-100 text-lg">
              {message.text}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">{message.userId}</span>
            <span>·</span>
            <span>{timeAgo}</span>
            {message.editedAt && <span className="italic">(edited)</span>}
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2 ml-4">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading || editText.trim() === ''}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                  aria-label="Save edit"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleToggleEdit}
                  className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm font-medium"
                  aria-label="Cancel edit"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleToggleEdit}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                  aria-label="Edit message"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                  aria-label="Delete message"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
};

export default MessageItem;