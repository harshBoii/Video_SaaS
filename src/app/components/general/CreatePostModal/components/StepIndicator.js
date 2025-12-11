import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;

        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center gap-2 flex-1">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isActive
                    ? '#ffffff'
                    : isCompleted
                    ? '#10b981'
                    : 'rgba(255,255,255,0.3)',
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-white'
                }`}
              >
                {isCompleted ? (
                  <FaCheck className="text-sm" />
                ) : (
                  <Icon className="text-sm" />
                )}
              </motion.div>
              <span className="text-xs font-medium text-center hidden lg:block">
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: currentStep > step.number ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-green-400"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
