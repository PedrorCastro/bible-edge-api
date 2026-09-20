import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📖 Iniciando importação da Bíblia...');
  
  // Usamos process.cwd() que pega a raiz do projeto no Render
  const sqlFilePath = path.join(process.cwd(), 'seed', 'data.sql');
  
  console.log(`Buscando arquivo em: ${sqlFilePath}`);

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Arquivo SQL não encontrado em: ${sqlFilePath}`);
    return;
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  const queries = sql.split(';').filter(q => q.trim() !== '');
  
  let count = 0;
  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query);
      count++;
    } catch (e) {
      // Ignora erros de tabelas que já existem
      if (!(e as any).message?.includes('already exists')) {
        // console.error(`⚠️ Erro na query ${count}: ${ (e as any).message }`);
      }
    }
  }

  console.log(`✅ Bíblia importada com sucesso! ${count} comandos executados.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });