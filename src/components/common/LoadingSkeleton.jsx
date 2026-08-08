import React from "react";

export function LoadingSkeleton({ variant = "dashboard" }) {
  if (variant === "profile" || variant === "form") {
    return (
      <div className="space-y-6 p-6 animate-pulse" id="skeleton-form">
        {/* Header Skeleton */}
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded"></div>
            <div className="h-3 w-32 bg-slate-200 rounded"></div>
          </div>
        </div>
        
        {/* Form Body Skeletons */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-32 bg-slate-200 rounded"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Dashboard / Document list style skeleton
  return (
    <div className="space-y-6 p-6 animate-pulse" id="skeleton-dashboard">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
          <div className="h-3.5 w-72 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-7 w-12 bg-slate-200 rounded-md"></div>
            <div className="h-3 w-28 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-3 items-center">
        <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
        <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
        <div className="h-8 w-40 bg-slate-200 rounded-lg ml-auto"></div>
      </div>

      {/* Table/List Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between space-x-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-2/5 bg-slate-200 rounded"></div>
                <div className="h-3 w-1/4 bg-slate-200 rounded"></div>
              </div>
              <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ message = "Memuat data..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4" id="loading-spinner">
      <div className="relative flex items-center justify-center">
        {/* Decorative background glow */}
        <div className="absolute w-12 h-12 bg-sky-100 rounded-full blur-xl animate-pulse"></div>
        {/* Spinner rings */}
        <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-sm font-semibold text-slate-500 tracking-wide animate-pulse">{message}</p>
    </div>
  );
}
