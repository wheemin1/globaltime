import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Clock, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./language-switcher";

// ─── Theme hook ──────────────────────────────────────────────────────────────

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}

// ─── Standalone theme toggle button ─────────────────────────────────────────

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/features", label: t('nav.features') },
    { href: "/how-it-works", label: t('nav.howItWorks') },
    { href: "/help/share", label: t('nav.help') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-base group">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Clock className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-foreground tracking-tight">TimeSync</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  location === link.href
                    ? "text-foreground font-medium bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/create-room" className="hidden sm:block">
              <Button size="sm" className="h-8 text-sm font-medium">
                {t('common.newMeeting')}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-border py-3 space-y-1 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex px-2 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/create-room" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full mt-2">
                {t('common.newMeeting')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>TimeSync — {t('footer.tagline')}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/features" className="hover:text-foreground transition-colors">
              {t('nav.features')}
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">
              {t('nav.howItWorks')}
            </Link>
            <Link href="/help/share" className="hover:text-foreground transition-colors">
              {t('nav.help')}
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t('common.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Layout wrapper ──────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
