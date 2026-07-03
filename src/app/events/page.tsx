'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Edit2, Trash2, Users, Check, ShieldAlert, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { eventsService } from '@/services';

export default function EventsPage() {
  const queryClient = useQueryClient();

  // Modal States
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [eventForm, setEventForm] = useState({
    eventId: '',
    title: '',
    description: '',
    date: '',
  });

  // -- Queries --
  const { data: eventsRaw, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsService.getAll().then(r => r.data),
  });

  // Handle interceptor wrapping
  const eventsList = Array.isArray(eventsRaw) 
    ? eventsRaw 
    : (Array.isArray(eventsRaw?.events) ? eventsRaw.events : []);

  // -- Mutations --
  const createMutation = useMutation({
    mutationFn: (data: any) => eventsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEventModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => eventsService.update(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEventModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  // -- Handlers --
  const handleOpenAddEvent = () => {
    setIsEditMode(false);
    setEventForm({
      eventId: `evt_${Date.now()}`,
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: any) => {
    setIsEditMode(true);
    setEventForm({
      eventId: evt.eventId,
      title: evt.title,
      description: evt.description,
      date: evt.date ? evt.date.split('T')[0] : '', // format for yyyy-MM-dd input
    });
    setSelectedEvent(evt);
    setIsEventModalOpen(true);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && selectedEvent) {
      updateMutation.mutate({
        id: selectedEvent.eventId,
        data: eventForm
      });
    } else {
      createMutation.mutate(eventForm);
    }
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenRegistrations = (evt: any) => {
    setSelectedEvent(evt);
    setIsRegistrationsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <CalendarDays className="mr-2 h-6 w-6 text-primary" />
              Calendar Events
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage public events and view user registrations.
            </p>
          </div>
          <Button onClick={handleOpenAddEvent} className="font-bold">
            <Plus className="mr-2 h-4 w-4" /> Add New Event
          </Button>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : eventsList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No events found.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click "Add New Event" to create your first event.</p>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {eventsList.map((evt: any) => {
              const registrations = Array.isArray(evt.registrations) ? evt.registrations : [];
              return (
                <Card key={evt.id || evt.eventId} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-2 bg-primary/80" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold line-clamp-1">{evt.title}</CardTitle>
                        <CardDescription className="text-xs mt-1 font-mono">{evt.date}</CardDescription>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button 
                          onClick={() => handleOpenEditEvent(evt)}
                          className="h-7 w-7 rounded-md bg-secondary/80 hover:bg-secondary flex items-center justify-center text-foreground transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(evt.eventId)}
                          className="h-7 w-7 rounded-md bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">
                      {evt.description}
                    </p>
                    
                    <div className="pt-4 border-t border-border mt-auto">
                      <Button 
                        variant="secondary" 
                        className="w-full flex items-center justify-between text-xs h-9"
                        onClick={() => handleOpenRegistrations(evt)}
                      >
                        <span className="flex items-center font-semibold">
                          <Users className="h-3.5 w-3.5 mr-2" />
                          Registrations
                        </span>
                        <span className="bg-background px-2 py-0.5 rounded-full font-bold">
                          {registrations.length}
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create / Edit Event Modal */}
        <Dialog 
          isOpen={isEventModalOpen} 
          onClose={() => setIsEventModalOpen(false)} 
          title={isEditMode ? "Edit Event" : "Create New Event"}
        >
          <form onSubmit={handleEventSubmit} className="space-y-4">
            <Input
              label="Event Title *"
              value={eventForm.title}
              onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Event ID (Unique String) *"
                value={eventForm.eventId}
                onChange={(e) => setEventForm({...eventForm, eventId: e.target.value})}
                disabled={isEditMode} // Usually shouldn't change ID after creation
                required
              />
              <Input
                label="Event Date *"
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Description *</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={4}
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-bold mt-2"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              {isEditMode ? 'Save Changes' : 'Create Event'}
            </Button>
          </form>
        </Dialog>

        {/* View Registrations Modal */}
        <Dialog 
          isOpen={isRegistrationsModalOpen} 
          onClose={() => setIsRegistrationsModalOpen(false)} 
          title="Event Registrations"
        >
          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-secondary/20 p-3 rounded-lg border border-border/40 mb-4">
                <h3 className="text-sm font-bold text-foreground">{selectedEvent.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">Date: {selectedEvent.date} | Event ID: {selectedEvent.eventId}</p>
              </div>

              {selectedEvent.registrations && selectedEvent.registrations.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-secondary/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Name</TableHead>
                        <TableHead className="text-xs font-bold">Contact Info</TableHead>
                        <TableHead className="text-xs font-bold text-right">Registered On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEvent.registrations.map((reg: any, i: number) => (
                        <TableRow key={reg.id || i}>
                          <TableCell className="py-2 text-sm font-semibold">{reg.name}</TableCell>
                          <TableCell className="py-2 text-xs">
                            <div className="flex flex-col">
                              <span>{reg.phone}</span>
                              <span className="text-muted-foreground">{reg.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 text-xs text-right text-muted-foreground font-mono">
                            {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('en-IN') : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">No registrations yet.</p>
                </div>
              )}
            </div>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
