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
import { useState, useEffect, useRef } from "react";
import { getMemories, hideMemory, unhideMemory, deleteMemory, editMemory } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminProgressPopup } from "@/components/admin-progress-popup";

interface Tribute {
  id: string;
  message: string;
  contributorName: string;
  submittedAt: string;
  approved: boolean;
  hidden?: boolean;
}

export function MobileAdminMemories() {
  const [memories, setMemories] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editName, setEditName] = useState("");
  
  // Progress popup state
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    currentItem: "",
    stage: "",
    successCount: 0,
    errorCount: 0,
    errors: [] as string[]
  });
  const isCancelledRef = useRef(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const result = await getMemories();
      if (result.tributes) {
        setMemories(result.tributes);
      }
    } catch (error) {
      console.error("Error loading memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMemories = () => {
    let filtered = memories;
    
    if (!showHidden) {
      filtered = filtered.filter(memory => !memory.hidden);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(memory => 
        memory.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.contributorName.toLowerCase().includes(searchTerm.toLowerCase())
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
    setEditName(memory.contributorName);
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
    <div className="p-4 space-y-4">
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
          
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="flex-1 h-10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkHide}
              className="flex-1 h-10"
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Hide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUnhide}
              className="flex-1 h-10"
            >
              <Eye className="mr-2 h-4 w-4" />
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
          className="h-10"
        >
          {selectedMemories.size === filteredMemories.length ? (
            <Square className="mr-2 h-4 w-4" />
          ) : (
            <CheckSquare className="mr-2 h-4 w-4" />
          )}
          Select All ({filteredMemories.length})
        </Button>
        
        <span className="text-sm text-muted-foreground">
          {filteredMemories.length} memor{filteredMemories.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Memories List */}
      <div className="space-y-3">
        {filteredMemories.map((memory) => (
          <div
            key={memory.id}
            className={`border rounded-lg p-3 space-y-3 ${
              selectedMemories.has(memory.id) ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            {/* Memory Header */}
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectMemory(memory.id)}
                className="h-8 w-8 p-0 mt-1"
              >
                {selectedMemories.has(memory.id) ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(memory.submittedAt).toLocaleDateString()}</span>
                  <User className="h-3 w-3" />
                  <span className="truncate">{memory.contributorName}</span>
                </div>
                
                <p className="text-sm leading-relaxed">
                  {memory.message}
                </p>
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditMemory(memory)}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => memory.hidden ? unhideMemory(memory.id) : hideMemory(memory.id)}
                  className="h-8 w-8 p-0"
                >
                  {memory.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMemory(memory.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Edit Form */}
            {editingMemory === memory.id && (
              <div className="pl-11 space-y-2 border-t pt-3">
                <Textarea
                  placeholder="Memory message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <Input
                  placeholder="Contributor name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} className="h-10">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-10">
                    <X className="mr-2 h-4 w-4" />
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
