import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Archive, Check } from 'lucide-react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  className?: string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <Archive className="w-5 h-5" />,
    color: 'bg-blue-500',
    label: 'Archive'
  },
  rightAction = {
    icon: <Trash2 className="w-5 h-5" />,
    color: 'bg-red-500',
    label: 'Delete'
  },
  className = ''
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const offset = eventData.deltaX;
      const maxOffset = 100;
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
      setSwipeOffset(clampedOffset);
      setIsSwipeActive(Math.abs(clampedOffset) > 20);
    },
    onSwipedLeft: () => {
      if (Math.abs(swipeOffset) > 50 && onSwipeLeft) {
        onSwipeLeft();
      }
      setSwipeOffset(0);
      setIsSwipeActive(false);
    },
    onSwipedRight: () => {
      if (Math.abs(swipeOffset) > 50 && onSwipeRight) {
        onSwipeRight();
      }
      setSwipeOffset(0);
      setIsSwipeActive(false);
    },
    onSwiped: () => {
      setSwipeOffset(0);
      setIsSwipeActive(false);
    },
    trackMouse: true,
    trackTouch: true
  });

  return (
    <div className={`relative overflow-hidden ${className}`} {...handlers}>
      {/* Left action background */}
      <AnimatePresence>
        {swipeOffset > 20 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute left-0 top-0 h-full flex items-center px-4 ${rightAction.color}`}
            style={{ width: Math.abs(swipeOffset) }}
          >
            <div className="flex items-center space-x-2 text-white">
              {rightAction.icon}
              {Math.abs(swipeOffset) > 60 && (
                <span className="text-sm font-medium">{rightAction.label}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right action background */}
      <AnimatePresence>
        {swipeOffset < -20 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute right-0 top-0 h-full flex items-center justify-end px-4 ${leftAction.color}`}
            style={{ width: Math.abs(swipeOffset) }}
          >
            <div className="flex items-center space-x-2 text-white">
              {Math.abs(swipeOffset) > 60 && (
                <span className="text-sm font-medium">{leftAction.label}</span>
              )}
              {leftAction.icon}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        animate={{ x: swipeOffset }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`relative z-10 ${isSwipeActive ? 'shadow-lg' : ''}`}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableItem;