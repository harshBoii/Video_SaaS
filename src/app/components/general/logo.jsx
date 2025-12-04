'use client';

import { motion } from 'framer-motion';

export default function Logo({ className = '' }) {
  const parentStyle = {
    backgroundImage:
      'linear-gradient(90deg, #1e1b4b 0%, #312e81 20%, #4c1d95 40%, #7e22ce 60%, #9333ea 80%, #ec4899 100%)',
    backgroundSize: '300% 300%',
    WebkitBackgroundClip: 'text',
  };

  const letterStyle = {
    background: 'inherit',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    display: 'inline-block',
  };

  return (
    <>
      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          animation: gradientMove 8s ease-in-out infinite;
        }
        .animate-gradient:hover {
          animation-duration: 4s;
        }
      `}</style>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        aria-label="CreateOS"
        className={`text-3xl md:text-5xl font-extrabold tracking-tight select-none ${className} animate-gradient text-center`}
        style={parentStyle}
      >
        <span style={{ ...letterStyle }} className="-rotate-2">
          C
        </span>
        <span style={letterStyle} className="-rotate-6">
          l
        </span>
        <span style={letterStyle}>i</span>
        <span style={letterStyle} className="rotate-3">
          p
        </span>
        <br />
        <span style={letterStyle} className='rotate-6'>F</span>
        <span style={letterStyle} className="-rotate-2">
          o
        </span>
        <span style={{ ...letterStyle, marginLeft: '0.35rem' }}>x</span>
      </motion.h1>
    </>
  );
}
