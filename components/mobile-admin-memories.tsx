"use client";

import { Button } from "@/components/ui/button";
import { 
  Eye, 
  EyeOff,
  Trash2,
  Calendar,
  User,
  CheckSquare,
  Square,
  Edit3,
  Save,
  X,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { hideMemory, unhideMemory, deleteMemory, editMemory } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminProgressPopup } from "@/components/admin-progress-popup";

import { Tribute } from "@/lib/types";
import { useTributes } from "@/lib/hooks";
import { useProgress } from "@/lib/use-progress";

export function MobileAdminMemories() {
  const [memories, setMemories] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editName, setEditName] = useState("");
  
  // Progress popup state - using shared hook
  const { showProgress, progress, isCancelledRef, setShowProgress, setProgress } = useProgress();

  // Use shared hook instead of duplicate loading logic
  const { tributes: hookTributes, loading: hookLoading } = useTributes();
  
  useEffect(() => {
    setMemories(hookTributes);
    setLoading(hookLoading);
  }, [hookTributes, hookLoading]);

  const getFilteredMemories = () => {
    let filtered = memories;
    
    if (!showHidden) {
      filtered = filtered.filter(memory => !memory.hidden);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(memory => 
        memory.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (memory.contributorName && memory.contributorName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const handleSelectMemory = (memoryId: string) => {
    const newSelected = new Set(selectedMemories);
    if (newSelected.has(memoryId)) {
      newSelected.delete(memoryId);
    } else {
      newSelected.add(memoryId);
    }
    setSelectedMemories(newSelected);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredMemories();
    if (selectedMemories.size === filtered.length) {
      setSelectedMemories(new Set());
    } else {
      setSelectedMemories(new Set(filtered.map(m => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMemories.size === 0) return;
    
    setShowProgress(true);
    setProgress({
      current: 0,
      total: selectedMemories.size,
      currentItem: "",
      stage: "Deleting memories...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    isCancelledRef.current = false;

    const memoryIds = Array.from(selectedMemories);
    
    for (let i = 0; i < memoryIds.length; i++) {
      if (isCancelledRef.current) {
        setProgress(prev => ({ ...prev, stage: "Operation cancelled" }));
        setTimeout(() => setShowProgress(false), 2000);
        return;
      }

      const memoryId = memoryIds[i];
      const memory = memories.find(m => m.id === memoryId);
      
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentItem: memory?.contributorName || `Memory ${i + 1}`
      }));

      try {
        await deleteMemory(memoryId);
        setProgress(prev => ({ ...prev, successCount: prev.successCount + 1 }));
        setMemories(prev => prev.filter(m => m.id !== memoryId));
      } catch (error) {
        setProgress(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          errors: [...prev.errors, `${memory?.contributorName || 'Memory'}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }
    }

    setProgress(prev => ({ ...prev, stage: "Delete operation complete" }));
    setSelectedMemories(new Set());
    setTimeout(() => setShowProgress(false), 2000);
  };

  const handleBulkHide = async () => {
    if (selectedMemories.size === 0) return;
    
    setShowProgress(true);
    setProgress({
      current: 0,
      total: selectedMemories.size,
      currentItem: "",
      stage: "Hiding memories...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    isCancelledRef.current = false;

    const memoryIds = Array.from(selectedMemories);
    
    for (let i = 0; i < memoryIds.length; i++) {
      if (isCancelledRef.current) {
        setProgress(prev => ({ ...prev, stage: "Operation cancelled" }));
        setTimeout(() => setShowProgress(false), 2000);
        return;
      }

      const memoryId = memoryIds[i];
      const memory = memories.find(m => m.id === memoryId);
      
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentItem: memory?.contributorName || `Memory ${i + 1}`
      }));

      try {
        await hideMemory(memoryId);
        setProgress(prev => ({ ...prev, successCount: prev.successCount + 1 }));
        setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, hidden: true } : m));
      } catch (error) {
        setProgress(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          errors: [...prev.errors, `${memory?.contributorName || 'Memory'}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }
    }

    setProgress(prev => ({ ...prev, stage: "Hide operation complete" }));
    setSelectedMemories(new Set());
    setTimeout(() => setShowProgress(false), 2000);
  };

  const handleBulkUnhide = async () => {
    if (selectedMemories.size === 0) return;
    
    setShowProgress(true);
    setProgress({
      current: 0,
      total: selectedMemories.size,
      currentItem: "",
      stage: "Unhiding memories...",
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    isCancelledRef.current = false;

    const memoryIds = Array.from(selectedMemories);
    
    for (let i = 0; i < memoryIds.length; i++) {
      if (isCancelledRef.current) {
        setProgress(prev => ({ ...prev, stage: "Operation cancelled" }));
        setTimeout(() => setShowProgress(false), 2000);
        return;
      }

      const memoryId = memoryIds[i];
      const memory = memories.find(m => m.id === memoryId);
      
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentItem: memory?.contributorName || `Memory ${i + 1}`
      }));

      try {
        await unhideMemory(memoryId);
        setProgress(prev => ({ ...prev, successCount: prev.successCount + 1 }));
        setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, hidden: false } : m));
      } catch (error) {
        setProgress(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          errors: [...prev.errors, `${memory?.contributorName || 'Memory'}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }
    }

    setProgress(prev => ({ ...prev, stage: "Unhide operation complete" }));
    setSelectedMemories(new Set());
    setTimeout(() => setShowProgress(false), 2000);
  };

  const handleEditMemory = (memory: Tribute) => {
    setEditingMemory(memory.id);
    setEditMessage(memory.message);
    setEditName(memory.contributorName || '');
  };

  const handleSaveEdit = async () => {
    if (!editingMemory) return;
    
    try {
      await editMemory(editingMemory, editMessage, editName);
      setMemories(prev => prev.map(m => 
        m.id === editingMemory 
          ? { ...m, message: editMessage, contributorName: editName }
          : m
      ));
      setEditingMemory(null);
    } catch (error) {
      console.error("Error editing memory:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMemory(null);
    setEditMessage("");
    setEditName("");
  };

  const filteredMemories = getFilteredMemories();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 max-w-full overflow-x-hidden">
      {/* Search and Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        
        <Button
          variant={showHidden ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHidden(!showHidden)}
          className="w-full h-12"
        >
          <Filter className="mr-2 h-4 w-4" />
          {showHidden ? "Show All" : "Show Hidden"}
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedMemories.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedMemories.size} memor{selectedMemories.size !== 1 ? 'ies' : 'y'} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMemories(new Set())}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-10 text-xs"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkHide}
              className="h-10 text-xs"
            >
              <EyeOff className="mr-1 h-3 w-3" />
              Hide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUnhide}
              className="h-10 text-xs"
            >
              <Eye className="mr-1 h-3 w-3" />
              Unhide
            </Button>
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="h-10 text-xs"
        >
          {selectedMemories.size === filteredMemories.length ? (
            <Square className="mr-1 h-3 w-3" />
          ) : (
            <CheckSquare className="mr-1 h-3 w-3" />
          )}
          All ({filteredMemories.length})
        </Button>
        
        <span className="text-xs text-muted-foreground">
          {filteredMemories.length} memor{filteredMemories.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Memories Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        {filteredMemories.map((memory) => (
          <div
            key={memory.id}
            className={`border rounded-lg p-2 space-y-2 ${
              selectedMemories.has(memory.id) ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            {/* Selection Checkbox */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectMemory(memory.id)}
                className="h-6 w-6 p-0"
              >
                {selectedMemories.has(memory.id) ? (
                  <CheckSquare className="h-3 w-3" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
              </Button>
            </div>
            
            {/* Memory Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-2 w-2" />
                <span>{new Date(memory.submittedAt).toLocaleDateString()}</span>
              </div>
              {memory.contributorName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-2 w-2" />
                  <span className="truncate">{memory.contributorName}</span>
                </div>
              )}
              
              <p className="text-xs leading-relaxed line-clamp-4">
                {memory.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditMemory(memory)}
                className="h-6 w-6 p-0 flex-1"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => memory.hidden ? unhideMemory(memory.id) : hideMemory(memory.id)}
                className="h-6 w-6 p-0 flex-1"
              >
                {memory.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMemory(memory.id)}
                className="h-6 w-6 p-0 flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Edit Form */}
            {editingMemory === memory.id && (
              <div className="space-y-2 border-t pt-2">
                <Textarea
                  placeholder="Memory message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="min-h-[60px] text-xs"
                />
                <Input
                  placeholder="Contributor name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xs h-8"
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSaveEdit} className="text-xs h-6 flex-1">
                    <Save className="mr-1 h-2 w-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs h-6 flex-1">
                    <X className="mr-1 h-2 w-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Popup */}
      <AdminProgressPopup
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        onCancel={() => {
          isCancelledRef.current = true;
        }}
        progress={progress}
      />
    </div>
  );
}
