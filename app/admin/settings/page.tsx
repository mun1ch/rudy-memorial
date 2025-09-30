"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Mail, Plus, X, Save, Bell, BellOff } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmailSettings, updateEmailSettings } from "@/lib/admin-actions";

interface EmailSettings {
  notificationEmails: string[];
  notificationsEnabled: boolean;
}

export default function AdminSettings() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    notificationEmails: [],
    notificationsEnabled: false
  });
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      const result = await getEmailSettings();
      if (result.success) {
        setEmailSettings(result.settings);
      }
    } catch (error) {
      console.error("Error loading email settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = () => {
    if (newEmail.trim() && !emailSettings.notificationEmails.includes(newEmail.trim())) {
      setEmailSettings(prev => ({
        ...prev,
        notificationEmails: [...prev.notificationEmails, newEmail.trim()]
      }));
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailSettings(prev => ({
      ...prev,
      notificationEmails: prev.notificationEmails.filter(email => email !== emailToRemove)
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const result = await updateEmailSettings(
        emailSettings.notificationEmails,
        emailSettings.notificationsEnabled
      );
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Email settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save email settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save email settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure site settings and appearance
          </p>
        </div>


        {/* Email Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Configure email notifications for new memories and photo uploads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Enable Email Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Send email alerts when new memories or photos are added
                </p>
              </div>
              <Button
                variant={emailSettings.notificationsEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setEmailSettings(prev => ({ 
                  ...prev, 
                  notificationsEnabled: !prev.notificationsEnabled 
                }))}
                className="flex items-center gap-2"
              >
                {emailSettings.notificationsEnabled ? (
                  <>
                    <Bell className="h-4 w-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4" />
                    Disabled
                  </>
                )}
              </Button>
            </div>

            {/* Email Addresses */}
            {emailSettings.notificationsEnabled && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Notification Email Addresses</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add email addresses that should receive notifications
                  </p>
                  
                  {/* Add Email Input */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={handleAddEmail} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Email List */}
                  {emailSettings.notificationEmails.length > 0 ? (
                    <div className="space-y-2">
                      {emailSettings.notificationEmails.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                          <span className="text-sm font-medium">{email}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveEmail(email)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No email addresses configured</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {emailSettings.notificationsEnabled 
                  ? `${emailSettings.notificationEmails.length} email${emailSettings.notificationEmails.length !== 1 ? 's' : ''} configured`
                  : 'Notifications disabled'
                }
              </div>
              <Button 
                onClick={handleSaveSettings} 
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
