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
    const [rows]: any = await db.query(
      "SELECT * FROM banner_setups WHERE is_active = 1 ORDER BY id DESC"
    );

    const banners = rows.map((banner: any) => ({
      ...banner,
      image: getBannerUrl(banner.image),
    }));

    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar banners" },
      { status: 500 }
    );
  }
}