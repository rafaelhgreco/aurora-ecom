/**
 * API Route: Delete Cloudinary Image
 *
 * Deleta uma imagem do Cloudinary usando o SDK no servidor
 */

import { v2 as cloudinary } from "cloudinary";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/app/services/auth";
import { logServerError } from "@/shared/errors/log-server-error";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    const session = await getSession(token);

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId é obrigatório" },
        { status: 400 },
      );
    }

    await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("cloudinaryDelete", error);
    return NextResponse.json(
      { error: "Erro ao deletar imagem" },
      { status: 500 },
    );
  }
}
