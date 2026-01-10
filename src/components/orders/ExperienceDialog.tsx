import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';

interface ExperienceDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (rating: number, comment: string) => void;
    isSubmitting?: boolean;
    targetStatus?: OrderStatus;
    initialRating?: number;
    initialComment?: string;
    isEditing?: boolean;
    customerName?: string;
}

export function ExperienceDialog({
    order,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
    targetStatus,
    initialRating = 0,
    initialComment = '',
    isEditing = false,
    customerName
}: ExperienceDialogProps) {
    const [rating, setRating] = useState(initialRating);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState(initialComment);

    useEffect(() => {
        if (open) {
            setRating(initialRating);
            setComment(initialComment);
        }
    }, [open, initialRating, initialComment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        onSubmit(rating, comment);
    };

    const isCancelled = targetStatus === 'cancelled' || order?.status === 'cancelled';
    const title = isEditing
        ? 'Update Experience'
        : isCancelled
            ? 'Cancellation Feedback'
            : 'Delivery Experience';

    const description = isEditing
        ? `Update your experience for this order.`
        : isCancelled
            ? `We're sorry this order was cancelled. How was the process with ${customerName || 'the customer'}?`
            : `How was the delivery experience with ${customerName || 'the customer'}?`;

    const commentLabel = isCancelled ? 'Cancellation Reason / Comment' : 'Comment';
    const commentPlaceholder = isCancelled
        ? 'Optional: Why was this order cancelled?'
        : 'Optional: Tell us about the delivery experience...';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card">
                <DialogHeader>
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {description}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Rating *</Label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="transition-transform active:scale-95"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={cn(
                                            "h-8 w-8 transition-colors",
                                            (hoveredRating || rating) >= star
                                                ? "fill-primary text-primary"
                                                : "text-muted border-transparent"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating === 0 && (
                            <p className="text-[10px] text-destructive font-medium uppercase tracking-wider">
                                Rating is mandatory
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment" className="text-base font-medium">
                            {commentLabel} <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                        </Label>
                        <Textarea
                            id="comment"
                            placeholder={commentPlaceholder}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        {!isEditing && (
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={rating === 0 || isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Changes' : 'Submit Feedback')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
