import { writeFileSync } from "node:fs";
import { generateBulkImportTemplateBuffer } from "@/infrastructure/import/generate-template-xlsx";

async function main() {
  const buf = await generateBulkImportTemplateBuffer();
  const out = "docs/exemplos/aurora-produtos-importacao-exemplo.xlsx";
  writeFileSync(out, buf);
  console.log(`Arquivo gerado: ${out} (${buf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
