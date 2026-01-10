"use client"

import { memo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from "@/components/ui/button"
import { deleteFramework, duplicateFramework } from "@/app/actions/frameworks"

interface Framework {
  id: string
  name: string
  description: string
  category: string
  characterCount: number
  chunkCount: number
}

interface FrameworkCardProps {
  framework: Framework
  onRefresh?: () => void
}

// PERFORMANCE OPTIMIZATION: Memoized to prevent re-renders when parent state changes
export const FrameworkCard = memo(function FrameworkCard({ framework, onRefresh }: FrameworkCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // PERFORMANCE OPTIMIZATION: Memoized callbacks to prevent child re-renders
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/frameworks/${framework.id}`);
  }, [router, framework.id]);

  const handleDuplicate = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDuplicating(true);
    try {
      const result = await duplicateFramework(framework.id);
      if ('error' in result) {
        alert(result.error);
      } else {
        onRefresh?.();
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to duplicate:', error);
      alert('Failed to duplicate framework');
    } finally {
      setIsDuplicating(false);
    }
  }, [framework.id, router, onRefresh]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deleteFramework(framework.id);
      if (result && 'error' in result) {
        alert(result.error);
      } else {
        setDeleteDialogOpen(false);
        onRefresh?.();
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete framework:', error);
      alert('Failed to delete framework. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [framework.id, router, onRefresh]);

  return (
    <Link href={`/dashboard/frameworks/${framework.id}`}>
      <Card className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem className="cursor-pointer" onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer" 
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="mt-2 text-base">{framework.name}</CardTitle>
          <CardDescription className="line-clamp-2">{framework.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {framework.category}
            </Badge>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{framework.characterCount.toLocaleString()} chars</span>
              <span>{framework.chunkCount} chunks</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Framework?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move &quot;{framework.name}&quot; to archive. You can restore it later from the Archive page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Link>
  )
})

FrameworkCard.displayName = 'FrameworkCard'
