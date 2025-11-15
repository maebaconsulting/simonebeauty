/**
 * PromoCodeList Component
 * Feature: 015-promo-codes-system
 *
 * Table displaying promo codes with actions (edit, toggle, delete)
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Switch } from '@/components/ui/switch'
import { Edit, Trash2, Copy, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { PromoCode } from '@/types/promo-code'
import {
  getPromoCodeStatus,
  getPromoStatusLabel,
  getPromoStatusColor,
  getRemainingUses,
} from '@/lib/utils/promo-status'
import { formatPromoDiscount, formatPromoUses } from '@/lib/utils/promo-formatting'
import { useTogglePromoCodeActive, useDeletePromoCode } from '@/hooks/usePromoCodes'

interface PromoCodeListProps {
  promoCodes: PromoCode[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function PromoCodeList({
  promoCodes,
  isLoading = false,
  onRefresh,
}: PromoCodeListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState<PromoCode | null>(null)

  const toggleActive = useTogglePromoCodeActive()
  const deletePromo = useDeletePromoCode()

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      await toggleActive.mutateAsync({
        id: promo.id,
        isActive: !promo.is_active,
      })
      onRefresh?.()
    } catch (error) {
      console.error('Failed to toggle promo status:', error)
    }
  }

  const handleDeleteClick = (promo: PromoCode) => {
    setCodeToDelete(promo)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!codeToDelete) return

    try {
      await deletePromo.mutateAsync(codeToDelete.id)
      setDeleteDialogOpen(false)
      setCodeToDelete(null)
      onRefresh?.()
    } catch (error) {
      console.error('Failed to delete promo:', error)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // Could add toast notification here
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-button-primary mb-3"></div>
        <p className="text-gray-600">Chargement des codes promo...</p>
      </div>
    )
  }

  if (promoCodes.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun code promo
        </h3>
        <p className="text-gray-600 mb-4">
          Commencez par créer votre premier code promotionnel.
        </p>
        <Link href="/admin/promotions/new">
          <Button className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white">
            Créer un code promo
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Réduction</TableHead>
              <TableHead>Utilisations</TableHead>
              <TableHead>Validité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promoCodes.map((promo) => {
              const status = getPromoCodeStatus(promo)
              const statusLabel = getPromoStatusLabel(status)
              const statusColor = getPromoStatusColor(status)
              const remainingUses = getRemainingUses(promo)

              return (
                <TableRow key={promo.id}>
                  {/* Code */}
                  <TableCell className="font-mono font-bold">
                    <div className="flex items-center gap-2">
                      {promo.code}
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copier le code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="max-w-xs truncate">
                    {promo.description || (
                      <span className="text-gray-400 italic">Sans description</span>
                    )}
                  </TableCell>

                  {/* Discount */}
                  <TableCell>
                    <span className="font-semibold text-button-primary">
                      {formatPromoDiscount(promo.discount_type, promo.discount_value)}
                    </span>
                    {promo.max_discount_amount && (
                      <span className="text-xs text-gray-500 ml-1">
                        (max {promo.max_discount_amount / 100}€)
                      </span>
                    )}
                  </TableCell>

                  {/* Uses */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {formatPromoUses(promo.uses_count, promo.max_uses)}
                      </span>
                      {remainingUses !== null && remainingUses <= 10 && remainingUses > 0 && (
                        <span className="text-xs text-orange-600">
                          Plus que {remainingUses}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Validity */}
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(promo.valid_from), 'dd MMM', { locale: fr })}
                    {' → '}
                    {promo.valid_until
                      ? format(new Date(promo.valid_until), 'dd MMM', { locale: fr })
                      : '∞'}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      className={`${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}
                    >
                      {statusLabel}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {/* Active Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Actif</span>
                        <Switch
                          checked={promo.is_active}
                          onCheckedChange={() => handleToggleActive(promo)}
                          disabled={toggleActive.isPending}
                        />
                      </div>

                      {/* Edit Button */}
                      <Link href={`/admin/promotions/${promo.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(promo)}
                        disabled={promo.uses_count > 0 || deletePromo.isPending}
                        title={
                          promo.uses_count > 0
                            ? 'Impossible de supprimer (utilisé)'
                            : 'Supprimer'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le code promo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le code <strong className="font-mono">{codeToDelete?.code}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
