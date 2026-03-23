import React from 'react';
import { X } from 'lucide-react';
import { ExerciseInstruction } from '../../types';

interface ExerciseInstructionsModalProps {
  isOpen: boolean;
  instruction: ExerciseInstruction | null;
  onClose: () => void;
}

const ExerciseInstructionsModal: React.FC<ExerciseInstructionsModalProps> = ({ isOpen, instruction, onClose }) => {
  if (!isOpen || !instruction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{instruction.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-deep-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-500 dark:text-deep-300 text-lg">{instruction.description}</p>

          <div>
            <h4 className="text-white font-semibold mb-3">Instructions:</h4>
            <ol className="space-y-2">
              {instruction.steps.map((step: string, index: number) => (
                <li key={index} className="text-gray-500 dark:text-deep-300 flex">
                  <span className="text-ocean-400 font-semibold mr-2">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseInstructionsModal;
