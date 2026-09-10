/**
 * API Route: Delete Cloudinary Image
 *
 * Deleta uma imagem do Cloudinary usando o SDK no servidor
 */

import { v2 as cloudinary } from "cloudinary";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/app/services/auth";
import { logServerError } from "@/shared/errors/log-server-error";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteRequestSchema = z.object({
  publicId: z.string().min(1, "publicId é obrigatório"),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  const session = await getSession(token);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido" },
      { status: 400 },
    );
  }

  const parsed = deleteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "publicId é obrigatório" },
      { status: 400 },
    );
  }
  const { publicId } = parsed.data;

  // Só apaga assets na pasta que o próprio upload do admin usa — evita que
  // um publicId arbitrário derrube outro recurso do Cloudinary.
  if (!publicId.startsWith("products/")) {
    return NextResponse.json({ error: "publicId inválido" }, { status: 400 });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    // Cloudinary responde 200 com `{ result: "not found" }` para um publicId
    // que já não existe — tratamos como sucesso (fim desejado: nada para
    // apagar), mas qualquer outro resultado é reportado como falha real.
    if (result.result !== "ok" && result.result !== "not found") {
      logServerError(
        "cloudinaryDelete",
        new Error(`cloudinary.uploader.destroy retornou "${result.result}"`),
        { publicId },
      );
      return NextResponse.json(
        { error: "Erro ao deletar imagem", result: result.result },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, result: result.result });
  } catch (error) {
    logServerError("cloudinaryDelete", error, { publicId });
    return NextResponse.json(
      { error: "Erro ao deletar imagem" },
      { status: 500 },
    );
  }
}
