
// hooks/useToast.ts - Version moderne avec Sonner
import { toast } from 'sonner';

export interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
}

export const useToast = () => {
    const showToast = ({ title, description, variant = 'default', duration = 3000 }: ToastOptions) => {
        const message = description ? `${title}: ${description}` : title;

        if (variant === 'destructive') {
            toast.error(message, {
                duration,
                style: {
                    background: '#1f2937',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                },
            });
        } else {
            toast.success(message, {
                duration,
                style: {
                    background: '#1f2937',
                    border: '1px solid #10b981',
                    color: '#34d399',
                },
            });
        }
    };

    return {
        toast: showToast,
        dismiss: toast.dismiss,
    };
};

// Export du toast direct pour compatibilité
export { toast };