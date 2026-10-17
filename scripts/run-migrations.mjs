import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import dns from "node:dns";
import postgres from "postgres";

dns.setDefaultResultOrder("ipv4first");

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value;
  }
  return values;
}

async function loadProjectEnv() {
  let fileValues = {};
  try {
    fileValues = parseEnv(await readFile(resolve(process.cwd(), ".env"), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return { ...fileValues, ...process.env };
}

export async function runMigrations() {
  const env = await loadProjectEnv();
  const dbUrl = env.SUPABASE_DB_MIGRATION_URL || env.LOVABLE_DB_MIGRATION_URL || env.DATABASE_URL;

  if (!dbUrl) {
    console.warn("⚠️ Aucune variable SUPABASE_DB_MIGRATION_URL ou LOVABLE_DB_MIGRATION_URL trouvée. Étape migration ignorée.");
    return;
  }

  console.log("🚀 Exécution des migrations Supabase...");

  const sql = postgres(dbUrl, {
    max: 1,
    idle_timeout: 10,
    connect_timeout: 30,
    ssl: { rejectUnauthorized: false },
    onnotice: () => {},
  });

  try {
    // 1. S'assurer que le schéma et la table de suivi des migrations existent
    await sql`
      CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    `.catch(() => {});

    await sql`
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version text PRIMARY KEY,
        name text,
        inserted_at timestamptz DEFAULT now()
      );
    `.catch(() => {});

    // 2. Récupérer les migrations déjà appliquées
    const appliedRows = await sql`
      SELECT version FROM supabase_migrations.schema_migrations
    `.catch(() => []);

    const appliedSet = new Set(appliedRows.map((r) => String(r.version)));

    // 3. Détection de base : si la base était déjà créée sans schema_migrations
    const existingTablesRows = await sql`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `.catch(() => []);
    const existingTables = new Set(existingTablesRows.map((r) => r.table_name));

    if (existingTables.has("user_roles")) {
      const baselines = [
        { version: "20261009000000", name: "initial_schema" },
        { version: "20261009000001", name: "shop_views" },
      ];
      if (existingTables.has("plans")) baselines.push({ version: "20261009000002", name: "plans_admin" });
      if (existingTables.has("promotions")) {
        baselines.push({ version: "20261009000004", name: "promotions_module" });
        baselines.push({ version: "20261009000005", name: "promotion_badge_label" });
      }
      if (existingTables.has("subscriptions")) baselines.push({ version: "20261014000000", name: "subscriptions_system" });
      if (existingTables.has("support_tickets")) baselines.push({ version: "20261015000001", name: "support_module" });

      for (const b of baselines) {
        if (!appliedSet.has(b.version)) {
          console.log(`ℹ️ Table existante détectée pour ${b.version}_${b.name} : marquée comme appliquée.`);
          await sql`
            INSERT INTO supabase_migrations.schema_migrations (version, name)
            VALUES (${b.version}, ${b.name})
            ON CONFLICT (version) DO NOTHING
          `.catch(() => {});
          appliedSet.add(b.version);
        }
      }
    }

    const migrationsDir = resolve(process.cwd(), "supabase/migrations");
    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      const versionMatch = file.match(/^(\d+)_/);
      const version = versionMatch ? versionMatch[1] : file.replace(/\.sql$/, "");
      const name = file.replace(/^\d+_/, "").replace(/\.sql$/, "");

      if (appliedSet.has(version)) {
        continue;
      }

      console.log(`⏳ Application de la migration : ${file}...`);
      const filePath = join(migrationsDir, file);
      const sqlContent = await readFile(filePath, "utf8");

      try {
        await sql.unsafe(sqlContent);
        await sql`
          INSERT INTO supabase_migrations.schema_migrations (version, name)
          VALUES (${version}, ${name})
          ON CONFLICT (version) DO NOTHING
        `.catch((e) => {
          console.warn(`Note: enregistrement dans schema_migrations: ${e.message}`);
        });

        console.log(`✅ Migration appliquée avec succès : ${file}`);
        appliedCount++;
      } catch (migrationErr) {
        // Si l'erreur indique qu'une table, colonne, fonction ou politique existe déjà
        const isAlreadyExists =
          migrationErr.code === "42P07" || // duplicate_table
          migrationErr.code === "42701" || // duplicate_column
          migrationErr.code === "42710" || // duplicate_object
          migrationErr.code === "42P16" || // invalid_table_definition
          migrationErr.code === "42723" || // duplicate_function
          /already exists/i.test(migrationErr.message);

        if (isAlreadyExists) {
          console.warn(`⚠️ Note pour ${file} : un objet existe déjà en base (${migrationErr.message}). Migration marquée comme appliquée.`);
          await sql`
            INSERT INTO supabase_migrations.schema_migrations (version, name)
            VALUES (${version}, ${name})
            ON CONFLICT (version) DO NOTHING
          `.catch(() => {});
          appliedSet.add(version);
        } else {
          console.error(`❌ Erreur pendant l'application de ${file} :`, migrationErr);
          throw migrationErr;
        }
      }
    }

    if (appliedCount === 0) {
      console.log("✨ Toutes les migrations sont déjà à jour.");
    } else {
      console.log(`🎉 ${appliedCount} migration(s) traitée(s) avec succès.`);
    }
  } catch (err) {
    console.error("❌ Erreur pendant l'application des migrations :", err);
    throw err;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

// Exécuter si appelé directement en CLI
if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/run-migrations.mjs")) {
  runMigrations().catch((err) => {
    console.error("Échec des migrations :", err);
    process.exit(1);
  });
}
