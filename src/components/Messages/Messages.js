// src/components/messages/messages.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  collection,
  query,
  orderBy,
  limitToLast,
  startAfter,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { AuthUserContext } from '../Session';
import { db } from '../firebase';
import MessageList from './MessageList';

const PAGE_SIZE = 20;

const Messages = () => {
  const authUser = useContext(AuthUserContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const unsubscribeRef = useRef(null);
  const listRef = useRef(null);

  // Real-time listener
  useEffect(() => {
    if (!authUser) return;

    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limitToLast(PAGE_SIZE));

    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));
      setMessages(newMessages.reverse());
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    });

    unsubscribeRef.current = unsubscribe;
    return () => unsubscribeRef.current?.();
  }, [authUser]);

  // Load more
  const loadMore = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limitToLast(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newMessages = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));

      setMessages((prev) => [...prev, ...newMessages.reverse()]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Send message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !authUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: text.trim(),
        userId: authUser.uid,
        createdAt: serverTimestamp(),
      });
      setText('');
      // Scroll to bottom
      setTimeout(() => {
        listRef.current?.scrollToItem(messages.length, 'end');
      }, 100);
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  // Edit message
  const handleEdit = async (message, newText) => {
    try {
      await updateDoc(doc(db, 'messages', message.uid), {
        text: newText,
        editedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  // Delete message
  const handleDelete = async (uid) => {
    try {
      await deleteDoc(doc(db, 'messages', uid));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={5} />;
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          ref={listRef}
          authUser={authUser}
          messages={messages}
          onEditMessage={handleEdit}
          onRemoveMessage={handleDelete}
          loadMore={loadMore}
          hasMore={hasMore}
          isLoading={loadingMore}
        />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

const LoadingSkeleton = ({ count = 3 }) => (
  <div className="space-y-4 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

export default Messages;