import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📖 Iniciando importação robusta da Bíblia...');
  
  const sqlFilePath = path.join(process.cwd(), 'seed', 'data.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Arquivo SQL não encontrado em: ${sqlFilePath}`);
    return;
  }

  console.log('🧹 Limpando tabela de versículos para evitar duplicatas...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "verses" RESTART IDENTITY CASCADE;`);

  let sql = fs.readFileSync(sqlFilePath, 'utf8');

  // CORREÇÃO CRUCIAL: Remove quebras de linha dentro de aspas simples
  // Isso evita o erro "unterminated quoted string"
  sql = sql.replace(/'([\s\S]*?)(?=\n\s*INSERT|;|$)/g, (match) => {
    return match.replace(/\r?\n/g, ' ');
  });

  const queries = sql.split(';').filter(q => q.trim().length > 0);
  console.log(`Total de comandos para processar: ${queries.length}`);

  let count = 0;
  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query);
      count++;
      if (count % 500 === 0) console.log(`Processando... ${count} versículos inseridos.`);
    } catch (e) {
      const errorMsg = (e as any).message || '';
      if (!errorMsg.includes('already exists')) {
        console.error(`⚠️ Erro na query ${count}: ${errorMsg}`);
      }
    }
  }

  console.log(`✅ Sucesso total! ${count} comandos executados. A Bíblia agora está completa.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });