"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Eye, 
  EyeOff,
  Trash2,
  Calendar,
  ArrowLeft,
  CheckSquare,
  Square,
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { hideMemory, unhideMemory, deleteMemory, editMemory } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { AdminProgressPopup } from "@/components/admin-progress-popup";
import { MobileAdminMemories } from "@/components/mobile-admin-memories";

import { Tribute } from "@/lib/types";
import { useTributes } from "@/lib/hooks";
import { useProgress } from "@/lib/use-progress";

function AdminMemoriesContent() {
  const [memories, setMemories] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ message: '', contributorName: '' as string | null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Progress popup state - using shared hook
  const { showProgress, progress, isCancelledRef, startProgress, updateProgress, setShowProgress } = useProgress();

  // Use shared hook instead of duplicate loading logic
  const { tributes: hookTributes, loading: hookLoading } = useTributes();
  
  useEffect(() => {
    setMemories(hookTributes);
    setLoading(hookLoading);
  }, [hookTributes, hookLoading]);

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

  const getPaginatedMemories = () => {
    const filtered = getFilteredMemories();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredMemories();
    return Math.ceil(filtered.length / pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const startEditing = (memory: Tribute) => {
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
      const result = await editMemory(
        memoryId, 
        editForm.message || '', 
        editForm.contributorName || null
      );
      
      if (result.success) {
        // Update local state
        setMemories(prev => prev.map(memory => 
          memory.id === memoryId 
            ? { ...memory, message: editForm.message || '', contributorName: editForm.contributorName || null }
            : memory
        ));

        setEditingMemory(null);
        setEditForm({ message: '', contributorName: '' });
      } else {
        console.error('Error saving memory edit:', result.error);
      }
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
    
    const memoryIds = Array.from(selectedMemories);
    const memoryNames = memoryIds.map(id => {
      const memory = memories.find(m => m.id === id);
      return memory ? memory.message.substring(0, 30) + '...' : id;
    });
    
    // Initialize progress
    startProgress(memoryIds.length, "Hiding memories...");
    setShowProgress(true);
    isCancelledRef.current = false;
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each memory sequentially
    for (let i = 0; i < memoryIds.length; i++) {
      // Check if cancelled
      if (isCancelledRef.current) {
        updateProgress(memoryIds.length, memoryIds.length, "", "Hide operation cancelled", successCount, errorCount, [...errors, `Operation cancelled after ${i} of ${memoryIds.length} memories`]);
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setShowProgress(false);
        }, 2000);
        
        return;
      }
      
      const memoryId = memoryIds[i];
      const memoryName = memoryNames[i];
      
      // Update progress
      updateProgress(i, memoryIds.length, memoryName, "Hiding memories...", successCount, errorCount, errors);
      
      try {
        const result = await hideMemory(memoryId);
        if (result.success) {
          successCount++;
          // Update local state immediately
          setMemories(prev => prev.map(memory => 
            memory.id === memoryId ? { ...memory, hidden: true } : memory
          ));
        } else {
          errorCount++;
          errors.push(`${memoryName}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${memoryName}: ${errorMessage}`);
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final progress update
    updateProgress(memoryIds.length, memoryIds.length, "", "Hide operation complete", successCount, errorCount, errors);
    
    // Clear selection if all successful
    if (errorCount === 0) {
      clearSelection();
    }
    
    // Auto-close popup after 2 seconds
    setTimeout(() => {
      setShowProgress(false);
    }, 2000);
  };

  const handleBulkUnhide = async () => {
    if (selectedMemories.size === 0) return;
    
    const memoryIds = Array.from(selectedMemories);
    const memoryNames = memoryIds.map(id => {
      const memory = memories.find(m => m.id === id);
      return memory ? memory.message.substring(0, 30) + '...' : id;
    });
    
    // Initialize progress
    startProgress(memoryIds.length, "Unhiding memories...");
    setShowProgress(true);
    isCancelledRef.current = false;
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each memory sequentially
    for (let i = 0; i < memoryIds.length; i++) {
      // Check if cancelled
      if (isCancelledRef.current) {
        updateProgress(memoryIds.length, memoryIds.length, "", "Unhide operation cancelled", successCount, errorCount, [...errors, `Operation cancelled after ${i} of ${memoryIds.length} memories`]);
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setShowProgress(false);
        }, 2000);
        
        return;
      }
      
      const memoryId = memoryIds[i];
      const memoryName = memoryNames[i];
      
      // Update progress
      updateProgress(i, memoryIds.length, memoryName, "Unhiding memories...", successCount, errorCount, errors);
      
      try {
        const result = await unhideMemory(memoryId);
        if (result.success) {
          successCount++;
          // Update local state immediately
          setMemories(prev => prev.map(memory => 
            memory.id === memoryId ? { ...memory, hidden: false } : memory
          ));
        } else {
          errorCount++;
          errors.push(`${memoryName}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${memoryName}: ${errorMessage}`);
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final progress update
    updateProgress(memoryIds.length, memoryIds.length, "", "Unhide operation complete", successCount, errorCount, errors);
    
    // Clear selection if all successful
    if (errorCount === 0) {
      clearSelection();
    }
    
    // Auto-close popup after 2 seconds
    setTimeout(() => {
      setShowProgress(false);
    }, 2000);
  };

  const handleBulkDelete = async () => {
    if (selectedMemories.size === 0) return;
    
    if (!confirm(`Are you sure you want to permanently delete ${selectedMemories.size} memory(ies)?`)) {
      return;
    }
    
    const memoryIds = Array.from(selectedMemories);
    const memoryNames = memoryIds.map(id => {
      const memory = memories.find(m => m.id === id);
      return memory ? memory.message.substring(0, 30) + '...' : id;
    });
    
    // Initialize progress
    startProgress(memoryIds.length, "Deleting memories...");
    setShowProgress(true);
    isCancelledRef.current = false;
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each memory sequentially
    for (let i = 0; i < memoryIds.length; i++) {
      // Check if cancelled
      if (isCancelledRef.current) {
        updateProgress(memoryIds.length, memoryIds.length, "", "Delete operation cancelled", successCount, errorCount, [...errors, `Operation cancelled after ${i} of ${memoryIds.length} memories`]);
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setShowProgress(false);
        }, 2000);
        
        return;
      }
      
      const memoryId = memoryIds[i];
      const memoryName = memoryNames[i];
      
      // Update progress
      updateProgress(i, memoryIds.length, memoryName, "Deleting memories...", successCount, errorCount, errors);
      
      try {
        const result = await deleteMemory(memoryId);
        if (result.success) {
          successCount++;
          // Update local state immediately
          setMemories(prev => prev.filter(memory => memory.id !== memoryId));
        } else {
          errorCount++;
          errors.push(`${memoryName}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${memoryName}: ${errorMessage}`);
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final progress update
    updateProgress(memoryIds.length, memoryIds.length, "", "Delete operation complete", successCount, errorCount, errors);
    
    // Clear selection if all successful
    if (errorCount === 0) {
      clearSelection();
    }
    
    // Auto-close popup after 2 seconds
    setTimeout(() => {
      setShowProgress(false);
    }, 2000);
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
                {memories.filter(m => !m.hidden).length} precious memories shared
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
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkUnhide}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Unhide Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkDelete}
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
            <div className="flex items-center justify-between">
              <div>
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
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 border border-border rounded-md text-sm bg-background"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={getFilteredMemories().length}>ALL</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {memories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No memories shared yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {getPaginatedMemories().map((memory) => (
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
                                value={editForm.contributorName || ''}
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
                              {actionLoading === memory.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
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
                              {actionLoading === memory.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Edit3 className="h-4 w-4" />
                              )}
                            </Button>
                            {memory.hidden ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUnhideMemory(memory.id)}
                                disabled={actionLoading === memory.id}
                                className="text-green-600 hover:text-green-700"
                              >
                                {actionLoading === memory.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleHideMemory(memory.id)}
                                disabled={actionLoading === memory.id}
                              >
                                {actionLoading === memory.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteMemory(memory.id)}
                              disabled={actionLoading === memory.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {actionLoading === memory.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {getTotalPages() > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, getFilteredMemories().length)} of {getFilteredMemories().length} memories
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Progress Popup */}
      <AdminProgressPopup
        isOpen={showProgress}
        progress={progress}
        onCancel={() => {
          isCancelledRef.current = true;
        }}
        onClose={() => setShowProgress(false)}
      />
    </div>
  );
}

export default function AdminMemoriesPage() {
  return (
    <>
      <div className="sm:hidden">
        <MobileAdminMemories />
      </div>
      <div className="hidden sm:block">
        <AdminMemoriesContent />
      </div>
    </>
  );
}
