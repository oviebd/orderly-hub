import { Package, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
  businessName?: string;
  onLogout?: () => void;
}

export function DashboardLayout({ children, businessName = 'My Business', onLogout }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon-sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-card">
                <nav className="flex flex-col gap-4 pt-8">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-secondary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="h-5 w-5" />
                    Orders
                  </Link>
                  <Link
                    to="/customers"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-secondary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    Customers
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden font-semibold sm:inline-block">OrderFlow</span>
            </Link>
            <nav className="ml-6 hidden items-center gap-4 md:flex">
              <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">Orders</Link>
              <Link to="/customers" className="text-sm font-medium transition-colors hover:text-primary">Customers</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="hidden text-sm font-medium sm:inline-block">{businessName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{businessName}</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        {children}
      </main>
    </div>
  );
}
