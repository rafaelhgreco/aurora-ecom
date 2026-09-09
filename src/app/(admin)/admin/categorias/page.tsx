/**
 * Página: Admin — Categorias
 *
 * Gerencia a hierarquia Seção → Subcategoria do catálogo: seções definem as
 * rotas/seções da vitrine (/loja/...), subcategorias segregam os produtos
 * dentro de cada seção. Consumidas pelo cadastro de produto e pelo filtro
 * da loja.
 */

"use client";

import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  IconButton,
  Menu,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IoAdd, IoEllipsisVertical, IoPencil, IoTrash } from "react-icons/io5";
import { CategoryCard } from "@/app/components/admin/category-card";
import { CategoryFormDialog } from "@/app/components/admin/category-form-dialog";
import { CategoryTable } from "@/app/components/admin/category-table";
import { DeleteCategoryConfirmDialog } from "@/app/components/admin/delete-category-confirm-dialog";
import { DeleteSectionConfirmDialog } from "@/app/components/admin/delete-section-confirm-dialog";
import { SectionFormDialog } from "@/app/components/admin/section-form-dialog";
import { LoadingState } from "@/app/components/states/loading-state";
import { useCategoryCRUD } from "@/app/hooks/use-category-crud";
import { useSectionCRUD } from "@/app/hooks/use-section-crud";
import type { Category } from "@/app/types/category";
import type { Section } from "@/app/types/section";
import { toaster } from "@/components/ui/toaster";

export default function AdminCategoriesPage() {
  const {
    sections,
    isLoading: sectionsLoading,
    createSection,
    updateSection,
    deleteSection,
  } = useSectionCRUD();
  const {
    categories,
    isLoading: categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryCRUD();

  const [isMounted, setIsMounted] = useState(false);

  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryDefaultSectionId, setCategoryDefaultSectionId] = useState<
    string | undefined
  >(undefined);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLoading = sectionsLoading || categoriesLoading;

  const handleAddSection = () => {
    setEditingSection(null);
    setSectionFormOpen(true);
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionFormOpen(true);
  };

  const handleSectionFormCancel = () => {
    setSectionFormOpen(false);
    setEditingSection(null);
  };

  const handleSectionFormSubmit = async (data: {
    name: string;
    slug: string;
    description?: string;
  }) => {
    const result = editingSection
      ? await updateSection({ id: editingSection.id as string, ...data })
      : await createSection(data);

    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description: editingSection
          ? "Seção atualizada com sucesso"
          : "Seção criada com sucesso",
        type: "success",
        duration: 3000,
      });
      setSectionFormOpen(false);
      setEditingSection(null);
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao salvar seção",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleDeleteSectionConfirm = async () => {
    if (!deletingSection?.id) return;

    const result = await deleteSection(deletingSection.id);

    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description: "Seção deletada com sucesso",
        type: "success",
        duration: 3000,
      });
      setDeletingSection(null);
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao deletar seção",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleAddCategory = (sectionId: string) => {
    setEditingCategory(null);
    setCategoryDefaultSectionId(sectionId);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryDefaultSectionId(undefined);
    setCategoryFormOpen(true);
  };

  const handleCategoryFormCancel = () => {
    setCategoryFormOpen(false);
    setEditingCategory(null);
    setCategoryDefaultSectionId(undefined);
  };

  const handleCategoryFormSubmit = async (data: {
    sectionId: string;
    name: string;
  }) => {
    const result = editingCategory
      ? await updateCategory({ id: editingCategory.id as string, ...data })
      : await createCategory(data);

    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description: editingCategory
          ? "Subcategoria atualizada com sucesso"
          : "Subcategoria criada com sucesso",
        type: "success",
        duration: 3000,
      });
      handleCategoryFormCancel();
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao salvar subcategoria",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deletingCategory?.id) return;

    const result = await deleteCategory(deletingCategory.id);

    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description: "Subcategoria deletada com sucesso",
        type: "success",
        duration: 3000,
      });
      setDeletingCategory(null);
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao deletar subcategoria",
        type: "error",
        duration: 5000,
      });
    }
  };

  if (!isMounted) return null;

  return (
    <Container maxW="container.lg" py={8}>
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={4}>
        <Heading size="lg">Categorias</Heading>

        <Button size="sm" colorScheme="blue" onClick={handleAddSection}>
          <IoAdd style={{ marginRight: 6 }} />
          Nova Seção
        </Button>
      </HStack>

      {isLoading && sections.length === 0 ? (
        <LoadingState minHeight="200px" />
      ) : sections.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={8}>
          Nenhuma seção cadastrada
        </Text>
      ) : (
        <VStack align="stretch" gap={5}>
          {sections.map((section) => (
            <Card.Root key={section.id}>
              <Card.Header>
                <HStack justify="space-between" flexWrap="wrap" gap={3}>
                  <HStack gap={2}>
                    <Heading size="md">{section.name}</Heading>
                    {section.description && (
                      <Text fontSize="sm" color="gray.500">
                        {section.description}
                      </Text>
                    )}
                  </HStack>
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleAddCategory(section.id as string)}
                    >
                      <IoAdd style={{ marginRight: 4 }} />
                      Nova Subcategoria
                    </Button>

                    <HStack gap={2} display={{ base: "none", md: "flex" }}>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="orange"
                        onClick={() => handleEditSection(section)}
                      >
                        <IoPencil />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => setDeletingSection(section)}
                      >
                        <IoTrash />
                      </Button>
                    </HStack>

                    <Box display={{ base: "block", md: "none" }}>
                      <Menu.Root>
                        <Menu.Trigger asChild>
                          <IconButton
                            aria-label="Ações da seção"
                            size="sm"
                            variant="ghost"
                            minW="44px"
                            minH="44px"
                          >
                            <IoEllipsisVertical />
                          </IconButton>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content>
                              <Menu.Item
                                value="edit"
                                onClick={() => handleEditSection(section)}
                              >
                                <IoPencil />
                                Editar seção
                              </Menu.Item>
                              <Menu.Item
                                value="delete"
                                color="red.600"
                                onClick={() => setDeletingSection(section)}
                              >
                                <IoTrash />
                                Excluir seção
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    </Box>
                  </HStack>
                </HStack>
              </Card.Header>
              <Card.Body>
                {(() => {
                  const sectionCategories = categories.filter(
                    (c) => c.sectionId === section.id,
                  );
                  if (categoriesLoading && sectionCategories.length === 0) {
                    return (
                      <HStack justify="center" py={6}>
                        <Spinner size="sm" />
                      </HStack>
                    );
                  }
                  return (
                    <>
                      <CategoryTable
                        categories={sectionCategories}
                        onEdit={handleEditCategory}
                        onDelete={setDeletingCategory}
                      />
                      <CategoryCard
                        categories={sectionCategories}
                        onEdit={handleEditCategory}
                        onDelete={setDeletingCategory}
                      />
                    </>
                  );
                })()}
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      )}

      <SectionFormDialog
        open={sectionFormOpen}
        section={editingSection}
        isLoading={sectionsLoading}
        onSubmit={handleSectionFormSubmit}
        onCancel={handleSectionFormCancel}
      />

      <DeleteSectionConfirmDialog
        open={!!deletingSection}
        section={deletingSection}
        isLoading={sectionsLoading}
        onConfirm={handleDeleteSectionConfirm}
        onCancel={() => setDeletingSection(null)}
      />

      <CategoryFormDialog
        open={categoryFormOpen}
        category={editingCategory}
        sections={sections}
        defaultSectionId={categoryDefaultSectionId}
        isLoading={categoriesLoading}
        onSubmit={handleCategoryFormSubmit}
        onCancel={handleCategoryFormCancel}
      />

      <DeleteCategoryConfirmDialog
        open={!!deletingCategory}
        category={deletingCategory}
        isLoading={categoriesLoading}
        onConfirm={handleDeleteCategoryConfirm}
        onCancel={() => setDeletingCategory(null)}
      />
    </Container>
  );
}
