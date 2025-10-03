'use client';

import { motion } from "framer-motion";

export default function Logo() {
  return (
    <motion.h1
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-3xl md:text-3xl font-extrabold tracking-wide"
    >
      <span className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
        C
      </span>
      <span className="inline-block -rotate-6 bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
        r
      </span>
      <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
        e
      </span>
      <span className="inline-block rotate-3 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        a
      </span>
      <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
        t
      </span>
      <span className="inline-block -rotate-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 bg-clip-text text-transparent">
        e
      </span>
      <span className="ml-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
        OS
      </span>
    </motion.h1>
  );
}
