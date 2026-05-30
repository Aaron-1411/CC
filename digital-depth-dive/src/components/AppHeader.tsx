import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAnalysisStore } from '@/hooks/useAnalysisStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Wrench, BarChart3, Users, LayoutDashboard, Menu, ArrowRight, Megaphone, FileCode, Moon, Sun, Activity } from 'lucide-react';

// 4 Suite entry points + Activity
const navLinks = [
  { to: '/analyze', icon: BarChart3, label: 'SEO & Visibility' },
  { to: '/ads', icon: Megaphone, label: 'Ads & Content' },
  { to: '/landing-page', icon: FileCode, label: 'Page Building' },
  { to: '/leads', icon: Users, label: 'Lead Finder' },
  { to: '/activity', icon: Activity, label: 'Activity' },
];

export const AppHeader = () => {
  const { user, loading, signOut } = useAuth();
  const { hasUnsavedAnalysis } = useAnalysisStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const showAnalysisNotification = hasUnsavedAnalysis && location.pathname !== '/analyze';

  const handleViewReport = () => {
    navigate('/analyze');
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container py-3">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Wrench className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">Toolbox</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg flex items-center gap-2 ${
                      isActive 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Analysis Notification */}
            {showAnalysisNotification && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewReport}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Report
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            
            {!loading && (
              user ? (
                <>
                  <Link 
                    to="/dashboard"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {showAnalysisNotification && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewReport}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            )}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="font-bold gradient-text">Toolbox</span>
                    </div>
                  </div>
                  
                  {/* Mobile Navigation Links */}
                  <div className="flex-1 py-4">
                    <div className="space-y-1 px-2">
                      {navLinks.map(({ to, icon: Icon, label }) => {
                        const isActive = location.pathname === to;
                        return (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                              isActive 
                                ? 'text-primary bg-primary/10' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{label}</span>
                          </Link>
                        );
                      })}
                      
                      {user && (
                        <Link
                          to="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            location.pathname === '/dashboard'
                              ? 'text-primary bg-primary/10' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                      )}
                    </div>
                    
                    {/* Analysis Notification in Mobile */}
                    {showAnalysisNotification && (
                      <div className="px-4 mt-4">
                        <Button
                          variant="outline"
                          className="w-full border-primary/50 text-primary hover:bg-primary/10"
                          onClick={handleViewReport}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Report
                          <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Menu Footer */}
                  <div className="p-4 border-t border-border">
                    {!loading && (
                      user ? (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                        >
                          Sign Out
                        </Button>
                      ) : (
                        <Button className="w-full" asChild>
                          <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                            Sign In
                          </Link>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};