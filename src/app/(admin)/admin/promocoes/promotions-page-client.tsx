/**
 * Página: Admin — Promoções (client)
 *
 * Gerencia campanhas de promoção (nome + percentual de desconto). A
 * associação de produtos é feita na tela "Gerenciar produtos" de cada
 * promoção — mirror da tela equivalente de categorias.
 */

"use client";

import { Button, Container, Heading, HStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoAdd } from "react-icons/io5";
import { DeletePromotionConfirmDialog } from "@/app/components/admin/delete-promotion-confirm-dialog";
import { PromotionCard } from "@/app/components/admin/promotion-card";
import { PromotionFormDialog } from "@/app/components/admin/promotion-form-dialog";
import { PromotionTable } from "@/app/components/admin/promotion-table";
import { LoadingState } from "@/app/components/states/loading-state";
import { usePromotionCRUD } from "@/app/hooks/use-promotion-crud";
import type { Promotion } from "@/app/types/promotion";
import { toaster } from "@/components/ui/toaster";

export function PromotionsPageClient() {
  const router = useRouter();
  const {
    promotions,
    isLoading,
    createPromotion,
    updatePromotion,
    deletePromotion,
  } = usePromotionCRUD();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(
    null,
  );

  const handleManageProducts = (promotion: Promotion) => {
    router.push(`/admin/promocoes/${promotion.id}/produtos`);
  };

  const handleAdd = () => {
    setEditingPromotion(null);
    setFormOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormOpen(true);
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditingPromotion(null);
  };

  const handleFormSubmit = async (data: {
    name: string;
    discountPercentage: number;
    active: boolean;
  }) => {
    const result = editingPromotion
      ? await updatePromotion({ id: editingPromotion.id as string, ...data })
      : await createPromotion(data);

    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description: editingPromotion
          ? "Promoção atualizada com sucesso"
          : "Promoção criada com sucesso",
        type: "success",
        duration: 3000,
      });
      handleFormCancel();
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao salvar promoção",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPromotion?.id) return;

    const result = await deletePromotion(deletingPromotion.id);

    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description: "Promoção deletada com sucesso",
        type: "success",
        duration: 3000,
      });
      setDeletingPromotion(null);
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao deletar promoção",
        type: "error",
        duration: 5000,
      });
    }
  };

  if (!isMounted) return null;

  return (
    <Container maxW="container.lg" py={8}>
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={4}>
        <Heading size="lg">Promoções</Heading>

        <Button size="sm" colorScheme="blue" onClick={handleAdd}>
          <IoAdd style={{ marginRight: 6 }} />
          Nova Promoção
        </Button>
      </HStack>

      {isLoading && promotions.length === 0 ? (
        <LoadingState minHeight="200px" />
      ) : (
        <>
          <PromotionTable
            promotions={promotions}
            onEdit={handleEdit}
            onDelete={setDeletingPromotion}
            onManageProducts={handleManageProducts}
          />
          <PromotionCard
            promotions={promotions}
            onEdit={handleEdit}
            onDelete={setDeletingPromotion}
            onManageProducts={handleManageProducts}
          />
        </>
      )}

      <PromotionFormDialog
        open={formOpen}
        promotion={editingPromotion}
        isLoading={isLoading}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />

      <DeletePromotionConfirmDialog
        open={!!deletingPromotion}
        promotion={deletingPromotion}
        isLoading={isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPromotion(null)}
      />
    </Container>
  );
}
