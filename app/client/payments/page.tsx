'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Trash2,
  Star,
  Plus,
  Building2,
  Wallet,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PaymentMethod {
  id: number;
  client_id: string;
  stripe_payment_method_id: string;
  payment_type: 'card' | 'bank_account' | 'paypal';
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  bank_name?: string;
  bank_account_last4?: string;
  paypal_email?: string;
  billing_city?: string;
  billing_country?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [methodToDelete, setMethodToDelete] = useState<number | null>(null);

  // Fetch payment methods
  const { data, isLoading } = useQuery<{ payment_methods: PaymentMethod[] }>({
    queryKey: ['client-payment-methods'],
    queryFn: async () => {
      const res = await fetch('/api/client/payments');
      if (!res.ok) throw new Error('Failed to fetch payment methods');
      return res.json();
    },
  });

  const paymentMethods = data?.payment_methods || [];

  // Set as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (methodId: number) => {
      const res = await fetch(`/api/client/payments/${methodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });
      if (!res.ok) throw new Error('Failed to set default payment method');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-payment-methods'] });
      toast({
        title: 'Méthode de paiement définie par défaut',
        description: 'Cette méthode sera utilisée pour vos prochaines réservations.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de définir la méthode par défaut',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (methodId: number) => {
      const res = await fetch(`/api/client/payments/${methodId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete payment method');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-payment-methods'] });
      setMethodToDelete(null);
      toast({
        title: 'Méthode de paiement supprimée',
        description: 'La méthode de paiement a été supprimée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la méthode de paiement',
        variant: 'destructive',
      });
    },
  });

  const handleSetDefault = (methodId: number) => {
    setDefaultMutation.mutate(methodId);
  };

  const handleDelete = (methodId: number) => {
    setMethodToDelete(methodId);
  };

  const confirmDelete = () => {
    if (methodToDelete) {
      deleteMutation.mutate(methodToDelete);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank_account':
        return <Building2 className="h-5 w-5" />;
      case 'paypal':
        return <Wallet className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getCardBrandLogo = (brand?: string) => {
    if (!brand) return null;
    const brandLower = brand.toLowerCase();

    // You would typically use actual brand logos here
    const brandNames: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
    };

    return brandNames[brandLower] || brand.toUpperCase();
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

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Moyens de paiement</h1>
        <p className="text-muted-foreground">
          Gérez vos méthodes de paiement pour vos réservations
        </p>
      </div>

      {/* Add Payment Method CTA */}
      <Card className="mb-6 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Ajouter une méthode de paiement</h3>
              <p className="text-sm text-muted-foreground">
                Enregistrez une carte bancaire pour faciliter vos futures réservations
              </p>
            </div>
            <Button
              onClick={() => {
                toast({
                  title: 'Fonctionnalité à venir',
                  description: 'L\'intégration Stripe sera disponible prochainement.',
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucune méthode de paiement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez une méthode de paiement pour faciliter vos réservations
              </p>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id} className={method.is_default ? 'border-primary' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      {getPaymentMethodIcon(method.payment_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {method.payment_type === 'card' && (
                          <>
                            <span className="font-semibold">
                              {getCardBrandLogo(method.card_brand)}
                            </span>
                            <span className="text-muted-foreground">
                              •••• {method.card_last4}
                            </span>
                            {method.card_exp_month && method.card_exp_year && (
                              <Badge variant="outline" className="ml-2">
                                Expire {String(method.card_exp_month).padStart(2, '0')}/{method.card_exp_year}
                              </Badge>
                            )}
                          </>
                        )}
                        {method.payment_type === 'bank_account' && (
                          <>
                            <span className="font-semibold">{method.bank_name}</span>
                            <span className="text-muted-foreground">
                              •••• {method.bank_account_last4}
                            </span>
                          </>
                        )}
                        {method.payment_type === 'paypal' && (
                          <span className="font-semibold">{method.paypal_email}</span>
                        )}
                        {method.is_default && (
                          <Badge variant="default" className="ml-2">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Par défaut
                          </Badge>
                        )}
                      </div>
                      {method.billing_city && (
                        <p className="text-sm text-muted-foreground">
                          {method.billing_city}, {method.billing_country || 'FR'}
                        </p>
                      )}
                      {method.last_used_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Dernière utilisation:{' '}
                          {new Date(method.last_used_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        Définir par défaut
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Security Notice */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Toutes vos informations de paiement sont sécurisées et cryptées par Stripe,
            leader mondial du paiement en ligne. Nous ne stockons jamais vos coordonnées
            bancaires complètes sur nos serveurs.
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={methodToDelete !== null} onOpenChange={() => setMethodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette méthode de paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Vous devrez ajouter à nouveau cette méthode
              si vous souhaitez l'utiliser ultérieurement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
