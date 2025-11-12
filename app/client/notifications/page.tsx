'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Smartphone, Clock, Moon } from 'lucide-react';

interface NotificationPreferences {
  id: number;
  client_id: string;
  email_enabled: boolean;
  email_booking_confirmation: boolean;
  email_booking_reminder: boolean;
  email_booking_cancellation: boolean;
  email_contractor_assignment: boolean;
  email_marketing: boolean;
  sms_enabled: boolean;
  sms_booking_confirmation: boolean;
  sms_booking_reminder: boolean;
  sms_booking_cancellation: boolean;
  sms_contractor_assignment: boolean;
  push_enabled: boolean;
  push_booking_confirmation: boolean;
  push_booking_reminder: boolean;
  push_booking_cancellation: boolean;
  push_contractor_assignment: boolean;
  reminder_hours_before: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch preferences
  const { data, isLoading } = useQuery<{ preferences: NotificationPreferences }>({
    queryKey: ['client-notifications'],
    queryFn: async () => {
      const res = await fetch('/api/client/notifications');
      if (!res.ok) throw new Error('Failed to fetch preferences');
      return res.json();
    },
  });

  const preferences = data?.preferences;

  // Local state for form
  const [formData, setFormData] = useState<Partial<NotificationPreferences>>({});

  // Update local state when data loads
  useState(() => {
    if (preferences && Object.keys(formData).length === 0) {
      setFormData(preferences);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const res = await fetch('/api/client/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications'] });
      setHasChanges(false);
      toast({
        title: 'Préférences enregistrées',
        description: 'Vos préférences de notifications ont été mises à jour.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour les préférences',
        variant: 'destructive',
      });
    },
  });

  const handleChange = (field: keyof NotificationPreferences, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    if (preferences) {
      setFormData(preferences);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <p>Erreur lors du chargement des préférences</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          Gérez vos préférences de notifications pour rester informé
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Notifications Email</CardTitle>
            </div>
            <CardDescription>
              Recevez des emails pour rester informé de vos réservations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_enabled" className="flex-1">
                Activer les emails
              </Label>
              <Switch
                id="email_enabled"
                checked={formData.email_enabled ?? preferences.email_enabled}
                onCheckedChange={(checked) => handleChange('email_enabled', checked)}
              />
            </div>
            {(formData.email_enabled ?? preferences.email_enabled) && (
              <div className="ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_booking_confirmation" className="text-sm">
                    Confirmation de réservation
                  </Label>
                  <Switch
                    id="email_booking_confirmation"
                    checked={formData.email_booking_confirmation ?? preferences.email_booking_confirmation}
                    onCheckedChange={(checked) => handleChange('email_booking_confirmation', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_booking_reminder" className="text-sm">
                    Rappel de rendez-vous
                  </Label>
                  <Switch
                    id="email_booking_reminder"
                    checked={formData.email_booking_reminder ?? preferences.email_booking_reminder}
                    onCheckedChange={(checked) => handleChange('email_booking_reminder', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_booking_cancellation" className="text-sm">
                    Annulation de réservation
                  </Label>
                  <Switch
                    id="email_booking_cancellation"
                    checked={formData.email_booking_cancellation ?? preferences.email_booking_cancellation}
                    onCheckedChange={(checked) => handleChange('email_booking_cancellation', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_contractor_assignment" className="text-sm">
                    Attribution de professionnel
                  </Label>
                  <Switch
                    id="email_contractor_assignment"
                    checked={formData.email_contractor_assignment ?? preferences.email_contractor_assignment}
                    onCheckedChange={(checked) => handleChange('email_contractor_assignment', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_marketing" className="text-sm">
                    Offres promotionnelles
                  </Label>
                  <Switch
                    id="email_marketing"
                    checked={formData.email_marketing ?? preferences.email_marketing}
                    onCheckedChange={(checked) => handleChange('email_marketing', checked)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Notifications SMS</CardTitle>
            </div>
            <CardDescription>
              Recevez des SMS pour les informations importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms_enabled" className="flex-1">
                Activer les SMS
              </Label>
              <Switch
                id="sms_enabled"
                checked={formData.sms_enabled ?? preferences.sms_enabled}
                onCheckedChange={(checked) => handleChange('sms_enabled', checked)}
              />
            </div>
            {(formData.sms_enabled ?? preferences.sms_enabled) && (
              <div className="ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_booking_confirmation" className="text-sm">
                    Confirmation de réservation
                  </Label>
                  <Switch
                    id="sms_booking_confirmation"
                    checked={formData.sms_booking_confirmation ?? preferences.sms_booking_confirmation}
                    onCheckedChange={(checked) => handleChange('sms_booking_confirmation', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_booking_reminder" className="text-sm">
                    Rappel de rendez-vous
                  </Label>
                  <Switch
                    id="sms_booking_reminder"
                    checked={formData.sms_booking_reminder ?? preferences.sms_booking_reminder}
                    onCheckedChange={(checked) => handleChange('sms_booking_reminder', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_booking_cancellation" className="text-sm">
                    Annulation de réservation
                  </Label>
                  <Switch
                    id="sms_booking_cancellation"
                    checked={formData.sms_booking_cancellation ?? preferences.sms_booking_cancellation}
                    onCheckedChange={(checked) => handleChange('sms_booking_cancellation', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_contractor_assignment" className="text-sm">
                    Attribution de professionnel
                  </Label>
                  <Switch
                    id="sms_contractor_assignment"
                    checked={formData.sms_contractor_assignment ?? preferences.sms_contractor_assignment}
                    onCheckedChange={(checked) => handleChange('sms_contractor_assignment', checked)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Push Notifications (Future) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-gray-400" />
              <CardTitle className="text-gray-400">Notifications Push</CardTitle>
            </div>
            <CardDescription>
              Disponible prochainement dans notre application mobile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between opacity-50">
              <Label htmlFor="push_enabled">Activer les notifications push</Label>
              <Switch id="push_enabled" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Reminder Timing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Timing des rappels</CardTitle>
            </div>
            <CardDescription>
              Choisissez quand recevoir vos rappels de rendez-vous
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reminder_hours_before">Recevoir un rappel</Label>
              <Select
                value={String(formData.reminder_hours_before ?? preferences.reminder_hours_before)}
                onValueChange={(value) => handleChange('reminder_hours_before', Number(value))}
              >
                <SelectTrigger id="reminder_hours_before" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 heure avant</SelectItem>
                  <SelectItem value="2">2 heures avant</SelectItem>
                  <SelectItem value="6">6 heures avant</SelectItem>
                  <SelectItem value="12">12 heures avant</SelectItem>
                  <SelectItem value="24">24 heures avant</SelectItem>
                  <SelectItem value="48">48 heures avant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              <CardTitle>Heures de silence</CardTitle>
            </div>
            <CardDescription>
              Définissez une période pendant laquelle vous ne souhaitez pas recevoir de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet_hours_enabled">Activer les heures de silence</Label>
              <Switch
                id="quiet_hours_enabled"
                checked={formData.quiet_hours_enabled ?? preferences.quiet_hours_enabled}
                onCheckedChange={(checked) => handleChange('quiet_hours_enabled', checked)}
              />
            </div>
            {(formData.quiet_hours_enabled ?? preferences.quiet_hours_enabled) && (
              <div className="grid grid-cols-2 gap-4 ml-4">
                <div>
                  <Label htmlFor="quiet_hours_start" className="text-sm">Début</Label>
                  <Input
                    id="quiet_hours_start"
                    type="time"
                    value={formData.quiet_hours_start ?? preferences.quiet_hours_start ?? ''}
                    onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet_hours_end" className="text-sm">Fin</Label>
                  <Input
                    id="quiet_hours_end"
                    type="time"
                    value={formData.quiet_hours_end ?? preferences.quiet_hours_end ?? ''}
                    onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      {hasChanges && (
        <div className="sticky bottom-4 mt-8 flex gap-4 justify-end bg-background/95 backdrop-blur-sm border rounded-lg p-4">
          <Button variant="outline" onClick={handleReset}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}
