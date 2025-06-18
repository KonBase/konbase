import React from 'react';
import NextLink from 'next/link';
import { cn } from '@/lib/utils';

export interface LinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  replace?: boolean;
  onClick?: () => void;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, href, replace, onClick, ...props }, ref) => {
    return (
      <NextLink
        href={href}
        className={cn(
          'text-primary underline-offset-4 hover:underline',
          className,
        )}
        replace={replace}
        onClick={onClick}
        ref={ref}
        {...props}
      >
        {children}
      </NextLink>
    );
  },
);
Link.displayName = 'Link';

export { Link };

// Create aliases for backward compatibility with React Router
export const RouterLink = Link;
