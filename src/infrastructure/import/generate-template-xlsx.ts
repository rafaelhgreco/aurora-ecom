import ExcelJS from "exceljs";
import { BULK_IMPORT_COLUMNS } from "@/core/schemas/bulk-import.schema";

/** Um único produto (CAM-001) com 2 cores — referência de formatação */
const EXAMPLE_ROWS = [
  {
    sku_base: "CAM-001",
    title: "Camiseta Básica",
    subtitle: "Algodão premium",
    description: "Camiseta básica de algodão, confortável para o dia a dia.",
    price: 89.9,
    category: "Roupas",
    shopCategory: "roupas",
    cor: "Branco",
    imagens_cor: "products/camiseta-branco-1|products/camiseta-branco-2",
    stock_P: 5,
    stock_M: 10,
    stock_G: 8,
    estoque_custom: "",
    isActive: "sim",
    imageUrl_principal: "",
  },
  {
    sku_base: "CAM-001",
    title: "Camiseta Básica",
    subtitle: "Algodão premium",
    description: "Camiseta básica de algodão, confortável para o dia a dia.",
    price: 89.9,
    category: "Roupas",
    shopCategory: "roupas",
    cor: "Preto",
    imagens_cor: "products/camiseta-preto-1",
    stock_P: 3,
    stock_M: 7,
    stock_G: 4,
    estoque_custom: "",
    isActive: "sim",
    imageUrl_principal: "",
  },
];

const INSTRUCTIONS = [
  ["CADASTRO DE PRODUTOS EM MASSA — AURORA E-COMMERCE"],
  [""],
  ["Como funciona"],
  ["• Uma linha = uma cor do produto (variante)."],
  ["• Use sku_base para agrupar linhas do mesmo produto."],
  ["• Repita title, description, price etc. em cada cor."],
  ["• Faça pré-upload das fotos no Cloudinary antes de importar."],
  ["• Em imagens_cor use URL completa ou public_id (ex: products/foto-1)."],
  ["• Separe várias imagens com | ou vírgula."],
  [""],
  ["Estoque"],
  ["• Colunas stock_PP … stock_XG para roupas."],
  ["• Colunas stock_100ml … stock_1000ml para volumes."],
  ["• estoque_custom: formato Tamanho:Qtd (ex: 30ml:5|Único:10)."],
  ["• Pelo menos um tamanho com quantidade > 0 por produto."],
  [""],
  ["shopCategory"],
  ['• Valores aceitos: "roupas" ou "cabelos".'],
  [""],
  ["isActive"],
  ['• "sim" ou "não".'],
];

export async function generateBulkImportTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Aurora E-Commerce";

  const instructions = workbook.addWorksheet("Instruções");
  for (const row of INSTRUCTIONS) {
    instructions.addRow(row);
  }
  instructions.getColumn(1).width = 90;
  instructions.getRow(1).font = { bold: true, size: 14 };

  const products = workbook.addWorksheet("Produtos");
  products.addRow([...BULK_IMPORT_COLUMNS]);
  const headerRow = products.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  for (const col of BULK_IMPORT_COLUMNS) {
    const idx = BULK_IMPORT_COLUMNS.indexOf(col) + 1;
    products.getColumn(idx).width = Math.max(col.length + 2, 14);
  }

  for (const example of EXAMPLE_ROWS) {
    const record = example as unknown as Record<
      string,
      string | number | undefined
    >;
    const row = BULK_IMPORT_COLUMNS.map((col) => record[col] ?? "");
    products.addRow(row);
  }

  products.views = [{ state: "frozen", ySplit: 1 }];

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
