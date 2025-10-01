// Shared UI components - NO MORE DUPLICATION!

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Camera, Heart, CheckCircle } from "lucide-react";
import Link from "next/link";

// Shared action card component - used everywhere
interface ActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  className?: string;
}

export function ActionCard({ href, icon, title, description, buttonText, className = "" }: ActionCardProps) {
  return (
    <Card className={`h-full overflow-hidden bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] group ${className}`}>
      <CardContent className="p-3 sm:p-6 text-center h-full flex flex-col justify-between">
        <div>
          <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300 ${className.includes('primary') ? 'bg-gradient-to-br from-primary/20 to-primary/10' : className.includes('accent') ? 'bg-gradient-to-br from-accent/20 to-accent/10' : 'bg-gradient-to-br from-secondary/20 to-secondary/10'}`}>
            {icon}
          </div>
          <h3 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 hidden sm:block">{title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{description}</p>
        </div>
        <Button asChild size="sm" className="h-6 sm:h-7 text-xs sm:text-sm">
          <Link href={href}>
            {buttonText}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Shared tab indicator component
interface TabIndicatorProps {
  label: string;
  className?: string;
}

export function TabIndicator({ label, className = "" }: TabIndicatorProps) {
  return (
    <div className={`text-center mb-6 ${className}`}>
      <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="text-primary">{label}</span>
        <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent"></div>
      </div>
    </div>
  );
}

// Shared loading spinner
export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="container py-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Shared empty state
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-6 mx-auto flex items-center justify-center shadow-lg">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

// Common icons
export const Icons = {
  Camera: <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
  MessageCircle: <MessageCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
  Heart: <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
  CheckCircle: <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
};
