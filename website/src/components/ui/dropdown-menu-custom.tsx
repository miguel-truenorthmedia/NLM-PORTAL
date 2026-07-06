import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface DropdownMenuProps {
  trigger: string;
  items: DropdownItem[];
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        className="flex items-center space-x-1 text-foreground hover:text-accent transition-colors group"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        <span>{trigger}</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen ? "rotate-180" : ""
        )} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="py-2">
            {items.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="block px-4 py-3 hover:bg-surface-elevated transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div className="font-medium text-foreground group-hover:text-accent transition-colors">
                  {item.label}
                </div>
                {item.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};