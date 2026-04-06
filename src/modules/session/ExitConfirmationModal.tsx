import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ExitConfirmationModalProps {
    onSaveAndEnd: () => void;
    onDiscard: () => void;
    onResume: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
    onSaveAndEnd,
    onDiscard,
    onResume,
}) => {
    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(8px)' }}
        >
            <div
                className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-scale"
                style={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                <div className="flex flex-col items-center gap-4 text-center">
                    {/* Warning icon */}
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                        style={{ background: 'rgba(234, 179, 8, 0.1)', color: 'var(--color-warning)' }}
                    >
                        <AlertTriangle size={24} />
                    </div>

                    <div className="space-y-1">
                        <h3
                            className="text-lg font-bold text-tight"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            End Workout?
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Are you sure you want to end this workout?
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full mt-4">
                        <button
                            onClick={onSaveAndEnd}
                            className="w-full font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
                            style={{
                                background: 'var(--color-accent-primary)',
                                color: '#fff',
                            }}
                        >
                            End & Save
                        </button>

                        <button
                            onClick={onDiscard}
                            className="w-full font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
                            style={{
                                background: 'var(--color-surface-card)',
                                color: 'var(--color-text-secondary)',
                                border: '1px solid var(--color-border-subtle)',
                            }}
                            onPointerEnter={(e) => {
                                e.currentTarget.style.background = 'var(--color-danger-muted)';
                                e.currentTarget.style.color = 'var(--color-danger)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                            onPointerLeave={(e) => {
                                e.currentTarget.style.background = 'var(--color-surface-card)';
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                            }}
                        >
                            Discard Workout
                        </button>

                        <button
                            onClick={onResume}
                            className="w-full font-medium py-2 text-sm transition-colors mt-2"
                            style={{ color: 'var(--color-text-muted)' }}
                            onPointerEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                            onPointerLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                        >
                            Resume
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
