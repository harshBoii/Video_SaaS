"use client"
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SortAsc, SortDesc, ChevronDown, Check } from 'lucide-react';

export default function SortDropdown({ sortBy, sortOrder, options, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options.find(opt => opt.value === sortBy);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm font-medium transition-all"
      >
        {sortOrder === 'asc' ? (
          <SortAsc className="w-4 h-4" />
        ) : (
          <SortDesc className="w-4 h-4" />
        )}
        <span>{currentOption?.label || 'Sort'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
          >
            {/* Sort Options */}
            <div className="p-2">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2 py-1 mb-1">
                Sort By
              </div>
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value, sortOrder);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    sortBy === option.value
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Sort Order */}
            <div className="border-t border-white/10 p-2">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2 py-1 mb-1">
                Order
              </div>
              <button
                onClick={() => {
                  onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  {sortOrder === 'asc' ? (
                    <>
                      <SortAsc className="w-4 h-4" />
                      <span>Ascending</span>
                    </>
                  ) : (
                    <>
                      <SortDesc className="w-4 h-4" />
                      <span>Descending</span>
                    </>
                  )}
                </div>
                <Check className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
