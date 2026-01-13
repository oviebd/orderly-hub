import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    all: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    today: number;
  };
}

const tabs = [
  { id: 'all', label: 'All Orders' },
  { id: 'today', label: 'Today' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function StatusTabs({ activeTab, onTabChange, counts }: StatusTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "shrink-0 gap-2 transition-all",
            activeTab === tab.id && "shadow-sm"
          )}
        >
          {tab.label}
          <span
            className={cn(
              "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
              activeTab === tab.id
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {counts[tab.id as keyof typeof counts]}
          </span>
        </Button>
      ))}
    </div>
  );
}
