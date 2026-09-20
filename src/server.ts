import { app } from './app'
import { env } from './utils/env'
import { exec } from 'child_process'; // Import agora está no topo!

// Função para rodar o seed automaticamente no Render
async function runAutoSeed() {
  console.log('Checking if database needs seeding...');
  exec('npm run database:seed', (error, stdout, stderr) => {
    if (error) {
      console.error(`Seed Error: ${error}`);
      return;
    }
    console.log(`Seed Output: ${stdout}`);
    if (stderr) console.error(`Seed Stderr: ${stderr}`);
  });
}

app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    console.log(`🚀 HTTP server running on http://localhost:${env.PORT}`)
    // Chama a função de seed assim que o servidor ligar
    runAutoSeed();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });