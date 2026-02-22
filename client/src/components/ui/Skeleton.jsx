import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className, ...props }) => (
  <div
    className={`bg-bg-muted rounded animate-pulse ${className}`}
    {...props}
  />
);

const PlayerCardSkeleton = () => (
  <motion.div
    className="bg-bg-card border border-border rounded-xl p-6 shadow-sm"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  </motion.div>
);

const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
    <div className="bg-bg-muted border-b border-border p-4">
      <Skeleton className="h-6 w-1/4" />
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          className="p-4 flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
        </motion.div>
      ))}
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <motion.div
    className="bg-bg-card border border-border rounded-xl p-6 shadow-sm"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="w-12 h-12 rounded-lg" />
    </div>
  </motion.div>
);

const FormSkeleton = () => (
  <motion.div
    className="bg-bg-card border border-border rounded-xl p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-2/3 rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </motion.div>
);

export { 
  Skeleton, 
  PlayerCardSkeleton, 
  TableSkeleton, 
  StatCardSkeleton, 
  FormSkeleton 
};