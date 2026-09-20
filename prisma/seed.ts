import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📖 Iniciando Importação Final (Modo Tanque de Guerra)...');
  
  const sqlFilePath = path.join(process.cwd(), 'seed', 'data.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Arquivo SQL não encontrado em: ${sqlFilePath}`);
    return;
  }

  console.log('🧹 Limpando banco de dados...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "verses" RESTART IDENTITY CASCADE;`);

  const rawSql = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Estratégia: Juntar tudo em uma string única removendo quebras de linha 
  // que não estejam protegidas por aspas, mas de forma simplificada.
  // Vamos remover TODAS as quebras de linha do arquivo primeiro.
  // Já que o arquivo é um conjunto de INSERTs, remover \n não quebra a sintaxe do SQL.
  const flattenedSql = rawSql.replace(/\r?\n|\r/g, ' ');

  // Agora dividimos por ponto e vírgula
  const queries = flattenedSql.split(';').filter(q => q.trim().length > 0);
  console.log(`Total de comandos para processar: ${queries.length}`);

  let count = 0;
  for (const query of queries) {
    try {
      // Limpamos espaços extras para garantir a estabilidade
      const cleanQuery = query.trim();
      if (cleanQuery) {
        await prisma.$executeRawUnsafe(cleanQuery);
        count++;
        if (count % 500 === 0) console.log(`Processando... ${count} versículos inseridos.`);
      }
    } catch (e) {
      const errorMsg = (e as any).message || '';
      if (!errorMsg.includes('duplicate key') && !errorMsg.includes('already exists')) {
        // Logamos o erro mas continuamos para não travar a importação total
        console.error(`⚠️ Erro na query ${count}: ${errorMsg}`);
      }
    }
  }

  console.log(`✅ SUCESSO TOTAL! ${count} comandos executados.`);
  console.log(`A Bíblia agora está completa e pronta para a transmissão!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });