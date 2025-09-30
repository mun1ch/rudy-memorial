"use client";

import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Palette, Check } from 'lucide-react';

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
        <CardDescription>
          Choose a color scheme that honors your father's memory
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableThemes.map((theme) => (
            <div
              key={theme.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                currentTheme.id === theme.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setTheme(theme)}
            >
              {currentTheme.id === theme.id && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: theme.colors.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                </div>
                
                <div>
                  <h3 className="font-medium text-sm">{theme.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {theme.description}
                  </p>
                </div>
                
                <div
                  className="h-8 rounded"
                  style={{ backgroundColor: theme.colors.background }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: currentTheme.colors.muted }}>
          <p className="text-sm text-muted-foreground">
            <strong>Current theme:</strong> {currentTheme.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {currentTheme.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

