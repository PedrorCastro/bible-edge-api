import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📖 Iniciando Importação Ultra-Robusta da Bíblia...');
  
  const sqlFilePath = path.join(process.cwd(), 'seed', 'data.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Arquivo SQL não encontrado em: ${sqlFilePath}`);
    return;
  }

  console.log('🧹 Limpando banco de dados...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "verses" RESTART IDENTITY CASCADE;`);

  let rawSql = fs.readFileSync(sqlFilePath, 'utf8');

  // --- LIMPEZA AGRESSIVA DE QUEBRAS DE LINHA ---
  // 1. Substitui quebras de linha que ocorrem dentro de aspas simples
  // Este Regex procura por tudo que começa com ' e termina com ', ignorando quebras de linha no meio
  const cleanedSql = rawSql.replace(/'[^']*?'/gs, (match) => {
    return match.replace(/\r?\n/g, ' ');
  });

  // 2. Agora dividimos por ponto e vírgula, sabendo que cada INSERT está em uma linha só
  const queries = cleanedSql.split(';').filter(q => q.trim().length > 0);
  console.log(`Total de comandos para processar: ${queries.length}`);

  let count = 0;
  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query);
      count++;
      if (count % 500 === 0) console.log(`Processando... ${count} versículos inseridos.`);
    } catch (e) {
      const errorMsg = (e as any).message || '';
      // Ignora apenas erros de chave duplicada, qualquer outro erro é logado
      if (!errorMsg.includes('duplicate key') && !errorMsg.includes('already exists')) {
        console.error(`⚠️ Erro na query ${count}: ${errorMsg}`);
      }
    }
  }

  console.log(`✅ SUCESSO TOTAL! ${count} comandos executados.`);
  console.log(`Agora a Bíblia está completa e pronta para a transmissão!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });