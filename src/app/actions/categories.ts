"use server";

import { requireAdminSession } from "@/app/services/require-admin-session";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/core/schemas/category.schema";
import { CreateCategoryUseCase } from "@/core/use-cases/create-category.use-case";
import { DeleteCategoryUseCase } from "@/core/use-cases/delete-category.use-case";
import { ListCategoriesUseCase } from "@/core/use-cases/list-categories.use-case";
import { UpdateCategoryUseCase } from "@/core/use-cases/update-category.use-case";
import { FirestoreCategoryRepository } from "@/infrastructure/repositories/firestore-category.repository";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import { FirestoreSectionRepository } from "@/infrastructure/repositories/firestore-section.repository";
import type { ActionResult } from "@/shared/action-result";
import { handleActionError } from "@/shared/errors/action-error";
import { serializeCategoryForClient } from "@/shared/serialize-category";

const categoryRepository = new FirestoreCategoryRepository();
const productRepository = new FirestoreProductRepository();
const sectionRepository = new FirestoreSectionRepository();

export type { ActionResult };

export async function listCategoriesAction(): Promise<
  ActionResult<Category[]>
> {
  try {
    const useCase = new ListCategoriesUseCase(categoryRepository);
    const categories = await useCase.execute();

    return {
      success: true,
      data: categories.map((c) => serializeCategoryForClient(c)),
    };
  } catch (error) {
    const { message } = handleActionError(
      "listCategoriesAction",
      error,
      "public",
    );
    return { success: false, error: message };
  }
}

export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<ActionResult<Category>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new CreateCategoryUseCase(
      categoryRepository,
      sectionRepository,
    );
    const category = await useCase.execute(input);

    return {
      success: true,
      data: serializeCategoryForClient(category),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "createCategoryAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function updateCategoryAction(
  input: UpdateCategoryInput,
): Promise<ActionResult<Category>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new UpdateCategoryUseCase(
      categoryRepository,
      sectionRepository,
      productRepository,
    );
    const category = await useCase.execute(input);

    return {
      success: true,
      data: serializeCategoryForClient(category),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "updateCategoryAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function deleteCategoryAction(
  id: string,
): Promise<ActionResult<void>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new DeleteCategoryUseCase(
      categoryRepository,
      productRepository,
    );
    await useCase.execute(id);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    const { message } = handleActionError(
      "deleteCategoryAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}
