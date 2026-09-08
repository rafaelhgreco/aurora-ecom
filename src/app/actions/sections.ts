"use server";

import { requireAdminSession } from "@/app/services/require-admin-session";
import type {
  CreateSectionInput,
  Section,
  UpdateSectionInput,
} from "@/core/schemas/section.schema";
import { CreateSectionUseCase } from "@/core/use-cases/create-section.use-case";
import { DeleteSectionUseCase } from "@/core/use-cases/delete-section.use-case";
import { ListSectionsUseCase } from "@/core/use-cases/list-sections.use-case";
import { UpdateSectionUseCase } from "@/core/use-cases/update-section.use-case";
import { FirestoreCategoryRepository } from "@/infrastructure/repositories/firestore-category.repository";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import { FirestoreSectionRepository } from "@/infrastructure/repositories/firestore-section.repository";
import type { ActionResult } from "@/shared/action-result";
import { handleActionError } from "@/shared/errors/action-error";
import { serializeSectionForClient } from "@/shared/serialize-section";

const sectionRepository = new FirestoreSectionRepository();
const categoryRepository = new FirestoreCategoryRepository();
const productRepository = new FirestoreProductRepository();

export type { ActionResult };

export async function listSectionsAction(): Promise<ActionResult<Section[]>> {
  try {
    const useCase = new ListSectionsUseCase(sectionRepository);
    const sections = await useCase.execute();

    return {
      success: true,
      data: sections.map((s) => serializeSectionForClient(s)),
    };
  } catch (error) {
    const { message } = handleActionError(
      "listSectionsAction",
      error,
      "public",
    );
    return { success: false, error: message };
  }
}

export async function createSectionAction(
  input: CreateSectionInput,
): Promise<ActionResult<Section>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new CreateSectionUseCase(sectionRepository);
    const section = await useCase.execute(input);

    return {
      success: true,
      data: serializeSectionForClient(section),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "createSectionAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function updateSectionAction(
  input: UpdateSectionInput,
): Promise<ActionResult<Section>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new UpdateSectionUseCase(sectionRepository);
    const section = await useCase.execute(input);

    return {
      success: true,
      data: serializeSectionForClient(section),
    };
  } catch (error) {
    const { message, details } = handleActionError(
      "updateSectionAction",
      error,
      "admin",
    );
    return { success: false, error: message, ...(details && { details }) };
  }
}

export async function deleteSectionAction(
  id: string,
): Promise<ActionResult<void>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const useCase = new DeleteSectionUseCase(
      sectionRepository,
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
      "deleteSectionAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}
