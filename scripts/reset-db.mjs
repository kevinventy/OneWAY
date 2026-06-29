// Reset the local demo database: deletes .data/oneway.json so it reseeds
// from src/lib/seed.ts on the next request.
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const file = join(process.cwd(), '.data', 'oneway.json');
if (existsSync(file)) {
  rmSync(file);
  console.log('✓ Base de démonstration réinitialisée (.data/oneway.json supprimé).');
} else {
  console.log('Aucune base à réinitialiser — elle sera créée au prochain démarrage.');
}
