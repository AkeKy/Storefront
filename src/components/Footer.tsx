import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo + Links */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-black text-sm tracking-tighter uppercase text-foreground hidden sm:block">
              Gadget<span className="text-primary">Arena</span>
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/products" className="hover:text-foreground transition-colors">
              Products
            </Link>
            <Link href="/checkout" className="hover:text-foreground transition-colors">
              Checkout
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>

        {/* Right: Social + Copyright */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Twitter"
              className="p-2 rounded-lg border border-border hover:border-primary transition-all group"
            >
              <Icon
                name="GlobeAltIcon"
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            </a>
            <a
              href="#"
              aria-label="Discord"
              className="p-2 rounded-lg border border-border hover:border-primary transition-all group"
            >
              <Icon
                name="ChatBubbleLeftRightIcon"
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            </a>
          </div>
          <span className="text-xs text-muted-foreground">© 2026 GadgetArena</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
