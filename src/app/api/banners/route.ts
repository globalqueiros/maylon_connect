import { NextResponse } from "next/server";
import { db } from "../../lib/db";

const BASE_URL =
  "https://auth.maylon.com.br/storage/app/public/promotion/banner";

function getBannerUrl(image: string | null) {
  if (!image) return null;

  if (image.startsWith("http")) {
    return image;
  }

  return `${BASE_URL}/${image}`;
}

export async function GET() {
  try {
    let rows: any[] = [];

    try {
      const [result]: any = await db.query(
        "SELECT * FROM banner_setups WHERE is_active = 1 ORDER BY id DESC"
      );
      rows = Array.isArray(result) ? result : [];
    } catch {
      try {
        const [result]: any = await db.query(
          "SELECT * FROM banners WHERE is_active = 1 ORDER BY id DESC"
        );
        rows = Array.isArray(result) ? result : [];
      } catch {
        // Local/dev DBs may not have banner tables yet.
        rows = [];
      }
    }

    const banners = rows
      .map((banner: any) => {
        const image = getBannerUrl(banner.image ?? banner.imagem ?? null);
        return {
          ...banner,
          image,
        };
      })
      .filter((banner: { image: string | null }) => Boolean(banner.image));

    return NextResponse.json(banners);
  } catch (error) {
    console.error("/api/banners error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar banners" },
      { status: 500 }
    );
  }
}
