import { Check } from 'lucide-react';

const steps = [
    { number: 1, label: 'Sign Up' },
    { number: 2, label: 'Configure' },
    { number: 3, label: 'Branding' },
    { number: 4, label: 'Payment' },
    { number: 5, label: 'Launch' },
];

export default function StepIndicator({ currentStep }) {
    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = step.number < currentStep;
                    const isCurrent = step.number === currentStep;
                    const isFuture = step.number > currentStep;

                    return (
                        <div key={step.number} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                        isCompleted
                                            ? 'bg-primary-500 text-white'
                                            : isCurrent
                                            ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        step.number
                                    )}
                                </div>
                                <span
                                    className={`mt-2 text-xs font-medium ${
                                        isCompleted || isCurrent
                                            ? 'text-primary-600'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-0.5 mx-3 mt-[-1rem] ${
                                        step.number < currentStep
                                            ? 'bg-primary-500'
                                            : 'bg-gray-200'
                                    }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
