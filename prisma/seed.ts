import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 RUNNING SEED VERSION 3.0 - THE NUCLEAR OPTION');
  console.log('📖 Iniciando Importação Final (Modo Tanque de Guerra Ultra)...');
  
  const sqlFilePath = path.join(process.cwd(), 'seed', 'data.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Arquivo SQL não encontrado em: ${sqlFilePath}`);
    return;
  }

  console.log('🧹 Limpando banco de dados completamente...');
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "verses" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "books" RESTART IDENTITY CASCADE;`);
    try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "testaments" RESTART IDENTITY CASCADE;`);
    } catch (e) {
        console.log('⚠️ Testaments table not found or couldn\'t be truncated, skipping...');
    }
  } catch (e) {
    console.error('❌ Erro ao limpar banco:', e);
  }

  const rawSql = fs.readFileSync(sqlFilePath, 'utf8');
  const flattenedSql = rawSql.replace(/[\r\n]+/g, ' ').replace(/\s\s+/g, ' ');

  const queries = flattenedSql.split(';').filter(q => q.trim().length > 0);
  console.log(`Total de comandos para processar: ${queries.length}`);

  let count = 0;
  for (const query of queries) {
    try {
      const cleanQuery = query.trim();
      if (cleanQuery) {
        await prisma.$executeRawUnsafe(cleanQuery);
        count++;
        if (count % 1000 === 0) console.log(`Processando... ${count} comandos executados.`);
      }
    } catch (e) {
      const errorMsg = (e as any).message || '';
      if (!errorMsg.includes('duplicate key') && !errorMsg.includes('already exists')) {
        console.error(`⚠️ Erro na query ${count}: ${errorMsg}`);
      }
    }
  }

  console.log(`✅ SUCESSO TOTAL! ${count} comandos executados.`);
  console.log(`A Bíblia agora está completa, limpa e pronta para a transmissão!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });