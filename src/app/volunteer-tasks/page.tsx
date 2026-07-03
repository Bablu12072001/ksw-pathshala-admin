'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Clock, Plus, CheckCircle, Trash2, Edit2, Check, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { volunteerTasksService, volunteersService } from '@/services';

export default function VolunteerTasksPage() {
  const queryClient = useQueryClient();

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTaskData, setReviewTaskData] = useState<any>(null);

  const [taskForm, setTaskForm] = useState<{
    volunteerId: string;
    title: string;
    description: string;
    points: number | string;
  }>({
    volunteerId: 'all',
    title: '',
    description: '',
    points: '',
  });

  const [editTaskData, setEditTaskData] = useState<any>(null);

  // Pagination states
  const [tasksPage, setTasksPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [tasksStatusFilter, setTasksStatusFilter] = useState('');

  // -- Queries --
  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['volunteerTasks'],
    queryFn: () => volunteerTasksService.getAll().then(r => r.data),
  });

  const { data: volunteersData } = useQuery({
    queryKey: ['volunteersList'],
    queryFn: () => volunteersService.getAll().then(r => r.data),
  });

  // Extract arrays (handling interceptor wrapping based on apiClient logic)
  const rawTasksList = Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || tasksData?.volunteers || []);
  const allVolunteersList = Array.isArray(volunteersData) ? volunteersData : (volunteersData?.volunteers || []);

  // Apply client-side filters
  const tasksList = tasksStatusFilter ? rawTasksList.filter((t: any) => t.status === tasksStatusFilter) : rawTasksList;

  // -- Mutations for Tasks --
  const createTaskMutation = useMutation({
    mutationFn: (payload: any) => volunteerTasksService.create(payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerTasks'] });
      setIsTaskModalOpen(false);
      setTaskForm({ volunteerId: 'all', title: '', description: '', points: 0, dueDate: '' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => volunteerTasksService.update(id, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerTasks'] });
      setIsEditTaskModalOpen(false);
      setEditTaskData(null);
    },
  });

  const approveTaskMutation = useMutation({
    mutationFn: (id: string) => volunteerTasksService.approve(id).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerTasks'] });
      setIsReviewModalOpen(false);
      setReviewTaskData(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => volunteerTasksService.delete(id).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerTasks'] });
    },
  });

  // Handlers
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      ...taskForm,
      points: Number(taskForm.points)
    });
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTaskData) {
      updateTaskMutation.mutate({
        id: editTaskData.id,
        payload: {
          volunteerId: editTaskData.volunteerId,
          title: editTaskData.title,
          description: editTaskData.description,
          points: Number(editTaskData.points)
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Volunteer Operations</h1>
            <p className="text-xs text-muted-foreground">
              Manage custom tasks and assignments.
            </p>
          </div>
          <Button onClick={() => setIsTaskModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Custom Task
          </Button>
        </div>

        {/* Content Area */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-sm font-bold">Custom Volunteer Tasks</CardTitle>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Pending Approval', value: 'pending_approval' },
                  { label: 'Completed', value: 'completed' },
                ]}
                value={tasksStatusFilter}
                onChange={(e) => setTasksStatusFilter(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingTasks ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : tasksList.length === 0 ? (
              <p className="text-center text-xs py-10 text-muted-foreground">No tasks available.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold w-1/4">Task Details</TableHead>
                    <TableHead className="text-xs font-bold">Assigned Volunteer</TableHead>
                    <TableHead className="text-xs font-bold">Points / Created On</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksList.slice((tasksPage - 1) * itemsPerPage, tasksPage * itemsPerPage).map((task: any) => (
                    <TableRow key={task.id}>
                      <TableCell className="py-3">
                        <div className="font-bold text-sm text-foreground">{task.title}</div>
                        <div className="text-xxs text-muted-foreground max-w-xs truncate">{task.description}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        {task.volunteerId ? (
                          <div className="flex items-center space-x-2">
                            {task.volunteerId.profileImage ? (
                              <img src={task.volunteerId.profileImage} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xxxxs font-bold">
                                {task.volunteerId.fullName?.[0]}
                              </div>
                            )}
                            <span className="text-xs font-semibold">{task.volunteerId.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="mb-1 text-primary border-primary/30 bg-primary/5">
                          {task.points} pts
                        </Badge>
                        {task.created_at && (
                          <div className="text-xxs text-muted-foreground">
                            {new Date(task.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'default' : task.status === 'pending_approval' ? 'warning' : 'outline'} className="capitalize shadow-sm">
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-12 w-12 rounded-full"
                          title="Edit Task"
                          onClick={() => {
                            setEditTaskData({
                              id: task.id,
                              volunteerId: task.volunteerId?.id || 'all',
                              title: task.title,
                              description: task.description,
                              points: task.points
                            });
                            setIsEditTaskModalOpen(true);
                          }}
                        >
                          <Edit2 className="h-4.5 w-4.5" />
                        </Button>
                        {task.status === 'pending_approval' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-12 w-12 rounded-full text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                            title="Review Task Proof"
                            onClick={() => {
                              setReviewTaskData(task);
                              setIsReviewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-12 w-12 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Task"
                          onClick={() => {
                            if (confirm('Delete this task permanently?')) deleteTaskMutation.mutate(task.id);
                          }}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loadingTasks && tasksList.length > 0 && (
              <Pagination currentPage={tasksPage} totalItems={tasksList.length} itemsPerPage={itemsPerPage} onPageChange={setTasksPage} />
            )}
          </CardContent>
        </Card>

        {/* MODALS */}
        <Dialog isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Create Custom Task">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <Select
              label="Assign To *"
              options={[
                { label: 'All Volunteers', value: 'all' },
                ...allVolunteersList.map((v: any) => ({
                  label: v.fullName || v.name || 'Unknown',
                  value: v.id
                }))
              ]}
              value={taskForm.volunteerId}
              onChange={(e) => setTaskForm({ ...taskForm, volunteerId: e.target.value })}
            />
            <Input
              label="Task Title *"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description *</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                required
                rows={3}
                className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col">
              <Input
                label="Points *"
                type="number"
                value={taskForm.points}
                onChange={(e) => setTaskForm({ ...taskForm, points: e.target.value === '' ? '' : Number(e.target.value) })}
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold h-10" isLoading={createTaskMutation.isPending}>
              Create Task
            </Button>
          </form>
        </Dialog>

        <Dialog isOpen={isEditTaskModalOpen} onClose={() => setIsEditTaskModalOpen(false)} title="Update Custom Task">
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <Select
              label="Assign To *"
              options={[
                { label: 'All Volunteers', value: 'all' },
                ...allVolunteersList.map((v: any) => ({
                  label: v.fullName || v.name || 'Unknown',
                  value: v.id
                }))
              ]}
              value={editTaskData?.volunteerId || 'all'}
              onChange={(e) => setEditTaskData((prev: any) => prev ? { ...prev, volunteerId: e.target.value } : null)}
            />
            <Input
              label="Task Title *"
              value={editTaskData?.title || ''}
              onChange={(e) => setEditTaskData((prev: any) => prev ? { ...prev, title: e.target.value } : null)}
              required
            />
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description *</label>
              <textarea
                value={editTaskData?.description || ''}
                onChange={(e) => setEditTaskData((prev: any) => prev ? { ...prev, description: e.target.value } : null)}
                required
                rows={3}
                className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col">
              <Input
                label="Points *"
                type="number"
                value={editTaskData?.points === undefined ? '' : editTaskData.points}
                onChange={(e) => setEditTaskData((prev: any) => prev ? { ...prev, points: e.target.value === '' ? '' : Number(e.target.value) } : null)}
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold h-10" isLoading={updateTaskMutation.isPending}>
              Update Task
            </Button>
          </form>
        </Dialog>

        <Dialog isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Review Completed Task">
          {reviewTaskData && (
            <div className="space-y-6">
              <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                <h3 className="font-bold text-sm mb-1 text-foreground">{reviewTaskData.title}</h3>
                <p className="text-xs text-muted-foreground">{reviewTaskData.description}</p>

                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xxxxs text-muted-foreground uppercase tracking-wider mb-1">Volunteer</p>
                    <p className="text-xs font-semibold">{reviewTaskData.volunteerId?.fullName || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xxxxs text-muted-foreground uppercase tracking-wider mb-1">Completed At</p>
                    <p className="text-xs font-semibold text-primary">
                      {reviewTaskData.completedAt ? new Date(reviewTaskData.completedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {reviewTaskData.volunteerNotes && (
                <div>
                  <p className="text-xs font-bold mb-2">Volunteer Notes</p>
                  <div className="p-3 bg-secondary/30 rounded-lg text-sm border border-border/50 italic text-muted-foreground">
                    "{reviewTaskData.volunteerNotes}"
                  </div>
                </div>
              )}

              {reviewTaskData.proofMediaUrls && reviewTaskData.proofMediaUrls.length > 0 ? (
                <div>
                  <p className="text-xs font-bold mb-2">Proof of Completion</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {reviewTaskData.proofMediaUrls.map((url: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group">
                        <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                          View Full
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">No media proof provided.</p>
                </div>
              )}

              <div className="flex space-x-3 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full font-bold h-10"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="w-full font-bold h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                  isLoading={approveTaskMutation.isPending}
                  onClick={() => approveTaskMutation.mutate(reviewTaskData.id)}
                >
                  Approve & Award {reviewTaskData.points} pts
                </Button>
              </div>
            </div>
          )}
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
