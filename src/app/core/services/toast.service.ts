import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
    message: string;
    type: ToastType;
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toast = signal<Toast | null>(null);
    private timeoutId: any;
    private counter = 0;

    show(message: string, type: ToastType = 'info', duration: number = 3000): void {
        const id = ++this.counter;
        this.toast.set({ message, type, id });

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        if (duration > 0) {
            this.timeoutId = setTimeout(() => {
                if (this.toast()?.id === id) {
                    this.hide();
                }
            }, duration);
        }
    }

    hide(): void {
        this.toast.set(null);
    }
}
