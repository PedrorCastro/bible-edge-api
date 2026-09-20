import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📖 Iniciando limpeza e importação total da Bíblia...');
  
  const sqlFilePath = path.join(process.cwd(), 'seed', 'data.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Arquivo SQL não encontrado em: ${sqlFilePath}`);
    return;
  }

  // 1. LIMPEZA TOTAL: Removemos todos os versículos para evitar erros de "duplicate key"
  // e garantir que a importação seja limpa.
  console.log('🧹 Limpando tabela de versículos...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "verses" RESTART IDENTITY CASCADE;`);

  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  const queries = sql.split(';').filter(q => q.trim().length > 0);
  
  console.log(`Total de comandos para processar: ${queries.length}`);

  let count = 0;
  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query);
      count++;
      if (count % 500 === 0) console.log(`Processando... ${count} comandos inseridos.`);
    } catch (e) {
      const errorMsg = (e as any).message || '';
      if (!errorMsg.includes('already exists')) {
        console.error(`⚠️ Erro na query ${count}: ${errorMsg}`);
      }
    }
  }

  console.log(`✅ Sucesso total! ${count} comandos executados e Bíblia populada.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });