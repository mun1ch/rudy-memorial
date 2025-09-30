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
  ArrowLeft,
  CheckSquare,
  Square,
  Edit3,
  Save,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { getMemories, hideMemory, unhideMemory, deleteMemory } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ message: '', contributorName: '' });

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

  const getFilteredMemories = () => {
    switch (filter) {
      case 'visible':
        return memories.filter(memory => !memory.hidden);
      case 'hidden':
        return memories.filter(memory => memory.hidden);
      default:
        return memories;
    }
  };

  const startEditing = (memory: Memory) => {
    setEditingMemory(memory.id);
    setEditForm({
      message: memory.message || '',
      contributorName: memory.contributorName || ''
    });
  };

  const cancelEditing = () => {
    setEditingMemory(null);
    setEditForm({ message: '', contributorName: '' });
  };

  const saveEdit = async (memoryId: string) => {
    setActionLoading(memoryId);
    try {
      // Update the memory in the JSON file
      const fs = await import('fs/promises');
      const path = await import('path');

      const tributesFile = path.join(process.cwd(), 'public', 'tributes.json');
      let tributes = [];

      try {
        const data = await fs.readFile(tributesFile, 'utf-8');
        tributes = JSON.parse(data);
      } catch (error) {
        console.error('Error reading tributes file:', error);
        return;
      }

      // Find and update the memory
      const memoryIndex = tributes.findIndex((tribute: any) => tribute.id === memoryId);
      if (memoryIndex === -1) {
        console.error('Memory not found');
        return;
      }

      tributes[memoryIndex].message = editForm.message || '';
      tributes[memoryIndex].contributorName = editForm.contributorName || null;

      await fs.writeFile(tributesFile, JSON.stringify(tributes, null, 2));

      // Update local state
      setMemories(prev => prev.map(memory => 
        memory.id === memoryId 
          ? { ...memory, message: editForm.message || '', contributorName: editForm.contributorName || null }
          : memory
      ));

      setEditingMemory(null);
      setEditForm({ message: '', contributorName: '' });
    } catch (error) {
      console.error('Error saving memory edit:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleMemorySelection = (memoryId: string) => {
    setSelectedMemories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memoryId)) {
        newSet.delete(memoryId);
      } else {
        newSet.add(memoryId);
      }
      return newSet;
    });
  };

  const selectAllMemories = () => {
    setSelectedMemories(new Set(memories.map(memory => memory.id)));
  };

  const clearSelection = () => {
    setSelectedMemories(new Set());
  };

  const handleBulkHide = async () => {
    if (selectedMemories.size === 0) return;
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedMemories).map(memoryId => hideMemory(memoryId));
      await Promise.all(promises);
      
      setMemories(prev => prev.map(memory => 
        selectedMemories.has(memory.id) ? { ...memory, hidden: true } : memory
      ));
      clearSelection();
    } catch (error) {
      console.error("Error bulk hiding memories:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkUnhide = async () => {
    if (selectedMemories.size === 0) return;
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedMemories).map(memoryId => unhideMemory(memoryId));
      await Promise.all(promises);
      
      setMemories(prev => prev.map(memory => 
        selectedMemories.has(memory.id) ? { ...memory, hidden: false } : memory
      ));
      clearSelection();
    } catch (error) {
      console.error("Error bulk unhiding memories:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMemories.size === 0) return;
    
    if (!confirm(`Are you sure you want to permanently delete ${selectedMemories.size} memory(ies)?`)) {
      return;
    }
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedMemories).map(memoryId => deleteMemory(memoryId));
      await Promise.all(promises);
      
      setMemories(prev => prev.filter(memory => !selectedMemories.has(memory.id)));
      clearSelection();
    } catch (error) {
      console.error("Error bulk deleting memories:", error);
    } finally {
      setBulkActionLoading(false);
    }
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
                {memories.length} precious memories shared
              </p>
            </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memories.length}</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'visible' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('visible')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible Memories</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memories.filter(m => !m.hidden).length}</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${filter === 'hidden' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('hidden')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hidden Memories</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memories.filter(m => m.hidden).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {memories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Bulk Actions
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllMemories}
                    disabled={selectedMemories.size === memories.length}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedMemories.size === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {selectedMemories.size > 0 ? (
                  <span className="text-primary font-medium">
                    {selectedMemories.size} memory(ies) selected
                  </span>
                ) : (
                  "Select memories to perform bulk actions"
                )}
              </CardDescription>
            </CardHeader>
            {selectedMemories.size > 0 && (
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBulkHide}
                    disabled={bulkActionLoading}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkUnhide}
                    disabled={bulkActionLoading}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Unhide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Memories List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {filter === 'all' ? 'All Memories' : filter === 'visible' ? 'Visible Memories' : 'Hidden Memories'}
            </CardTitle>
            <CardDescription>
              {filter === 'all' 
                ? 'Manage shared memories - hide or delete inappropriate content'
                : filter === 'visible'
                ? 'Memories currently visible to the public'
                : 'Memories hidden from public view'
              }
              {getFilteredMemories().length !== memories.length && (
                <span className="ml-2 text-primary font-medium">
                  ({getFilteredMemories().length} of {memories.length})
                </span>
              )}
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
                {getFilteredMemories().map((memory) => (
                  <div key={memory.id} className={`rounded-lg border p-4 ${memory.hidden ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleMemorySelection(memory.id)}
                          className="flex-shrink-0 p-1 hover:bg-muted rounded mt-1"
                        >
                          {selectedMemories.has(memory.id) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          {editingMemory === memory.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editForm.contributorName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, contributorName: e.target.value }))}
                                placeholder="Contributor name..."
                                className="text-sm"
                              />
                              <Textarea
                                value={editForm.message}
                                onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Memory message..."
                                className="text-sm min-h-[80px]"
                              />
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {editingMemory === memory.id ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => saveEdit(memory.id)}
                              disabled={actionLoading === memory.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={cancelEditing}
                              disabled={actionLoading === memory.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startEditing(memory)}
                              disabled={actionLoading === memory.id}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
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
                          </>
                        )}
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
