import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || "sem-ano";

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText(`Declaração de Imposto de Renda - ${year}`, {
    x: 50, 
    y: 300,
    size: 18,
    font,
  });

  const pdfBytes = await pdfDoc.save();

  const dirPath = path.join(process.cwd(), "public/pdfs");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `imposto_renda-${year}.pdf`);
  fs.writeFileSync(filePath, pdfBytes);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="imposto_renda-${year}.pdf"`,
    },
  });
}