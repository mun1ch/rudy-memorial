"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Eye, 
  EyeOff,
  Trash2,
  Calendar,
  User,
  ArrowLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { getMemories, hideMemory, unhideMemory, deleteMemory } from "@/lib/admin-actions";
import Link from "next/link";

interface Memory {
  id: string;
  message: string;
  contributorName: string | null;
  submittedAt: string;
  approved: boolean;
  hidden?: boolean;
}

export default function AdminMemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const result = await getMemories();
      if (result.success) {
        setMemories(result.tributes);
      }
    } catch (error) {
      console.error("Error loading memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHideMemory = async (memoryId: string) => {
    setActionLoading(memoryId);
    try {
      const result = await hideMemory(memoryId);
      if (result.success) {
        setMemories(prev => prev.map(memory => 
          memory.id === memoryId ? { ...memory, hidden: true } : memory
        ));
      }
    } catch (error) {
      console.error("Error hiding memory:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhideMemory = async (memoryId: string) => {
    setActionLoading(memoryId);
    try {
      const result = await unhideMemory(memoryId);
      if (result.success) {
        setMemories(prev => prev.map(memory => 
          memory.id === memoryId ? { ...memory, hidden: false } : memory
        ));
      }
    } catch (error) {
      console.error("Error unhiding memory:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm("Are you sure you want to permanently delete this memory?")) {
      return;
    }
    
    setActionLoading(memoryId);
    try {
      const result = await deleteMemory(memoryId);
      if (result.success) {
        setMemories(prev => prev.filter(memory => memory.id !== memoryId));
      }
    } catch (error) {
      console.error("Error deleting memory:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading memories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Memories Management</h1>
            <p className="text-muted-foreground">
              Manage all shared memories - hide, unhide, or delete content
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memories.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible Memories</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memories.filter(m => !m.hidden).length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hidden Memories</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memories.filter(m => m.hidden).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Memories List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              All Memories
            </CardTitle>
            <CardDescription>
              Manage shared memories - hide or delete inappropriate content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {memories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No memories shared yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {memories.map((memory) => (
                  <div key={memory.id} className={`rounded-lg border p-4 ${memory.hidden ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">
                            {memory.contributorName || "Anonymous"}
                          </p>
                          {memory.hidden && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          {memory.message}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(memory.submittedAt)}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {memory.hidden ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUnhideMemory(memory.id)}
                            disabled={actionLoading === memory.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleHideMemory(memory.id)}
                            disabled={actionLoading === memory.id}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteMemory(memory.id)}
                          disabled={actionLoading === memory.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
