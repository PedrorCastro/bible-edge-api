import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📖 Reiniciando importação da Bíblia de forma segura...');
  
  const sqlFilePath = path.join(process.cwd(), 'seed', 'data.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Arquivo SQL não encontrado em: ${sqlFilePath}`);
    return;
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Dividimos o SQL por ponto e vírgula para executar cada comando separadamente
  const queries = sql.split(';').filter(q => q.trim().length > 0);
  
  console.log(`Total de comandos para processar: ${queries.length}`);

  let count = 0;
  for (const query of queries) {
    try {
      // Usamos o executeRaw para garantir que o SQL seja processado pelo Postgres
      await prisma.$executeRawUnsafe(query);
      count++;
      if (count % 100 === 0) console.log(`Processando... ${count} comandos inseridos.`);
    } catch (e) {
      // Ignoramos erros de "tabela já existe" ou "chave duplicada"
      const errorMsg = (e as any).message || '';
      if (!errorMsg.includes('already exists') && !errorMsg.includes('duplicate key')) {
        console.error(`⚠️ Erro na query ${count}: ${errorMsg}`);
      }
    }
  }

  console.log(`✅ Processo finalizado! ${count} comandos processados.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });