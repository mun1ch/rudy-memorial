"use client";

import { usePathname } from "next/navigation";
import { ConditionalHeader } from "./conditional-header";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <>
      {!isHomePage && <ConditionalHeader />}
      {children}
    </>
  );
}

export function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (isHomePage) return null;
  
  return <>{children}</>;
}
