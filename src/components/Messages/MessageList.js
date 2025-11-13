// src/components/messages/messagelist.js
import React, { useRef, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import MessageItem from './MessageItem';
import { useInView } from 'react-intersection-observer';

const ITEM_HEIGHT = 120;
const OVERS CAN = 5;

const MessageList = ({
  authUser,
  messages = [],
  onEditMessage,
  onRemoveMessage,
  loadMore,
  hasMore,
  isLoading,
}) => {
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const infiniteLoaderRef = useRef(null);
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const isItemLoaded = (index) => !!messages[index];

  const loadMoreItems = async (startIndex, stopIndex) => {
    if (isNextPageLoading || !hasMore) return;
    setIsNextPageLoading(true);
    try {
      await loadMore(startIndex, stopIndex);
    } finally {
      setIsNextPageLoading(false);
    }
  };

  const MessageRow = ({ index, style }) => {
    const message = messages[index];
    if (!message) {
      return (
        <div style={style} className="p-4">
          <SkeletonMessage />
        </div>
      );
    }

    return (
      <div style={style} className="px-4">
        <MessageItem
          authUser={authUser}
          message={message}
          onEditMessage={onEditMessage}
          onRemoveMessage={onRemoveMessage}
        />
      </div>
    );
  };

  if (messages.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <div className="h-full">
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={hasMore ? messages.length + 1 : messages.length}
        loadMoreItems={loadMoreItems}
        ref={infiniteLoaderRef}
      >
        {({ onItemsRendered, ref }) => (
          <List
            height={600}
            itemCount={hasMore ? messages.length + 1 : messages.length}
            itemSize={ITEM_HEIGHT}
            onItemsRendered={onItemsRendered}
            ref={ref}
            overscanCount={OVERSCAN}
            className="scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
          >
            {MessageRow}
          </List>
        )}
      </InfiniteLoader>

      {isNextPageLoading && <LoadingSkeleton count={3} />}

      {hasMore && (
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      )}
    </div>
  );
};

const SkeletonMessage = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
  </div>
);

const LoadingSkeleton = ({ count = 3 }) => (
  <div className="space-y-4 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonMessage key={i} />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">💬</div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      No messages yet
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      Be the first to send a message!
    </p>
  </div>
);

export default MessageList;