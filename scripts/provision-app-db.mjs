import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmod, mkdir, open, unlink } from 'node:fs/promises';
import { homedir, userInfo } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env.provisioner') });

function usage() {
  console.log(
    'Usage: npm run db:provision -- --app <lowercase-app-name> [--dry-run]\n'
      + 'Creates an isolated MySQL database and app user, then saves credentials '
      + 'to a private file in your home directory.'
  );
}

function parseArguments(args) {
  let appName;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--help') return { help: true };
    if (args[index] === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (args[index] === '--app' && args[index + 1]) {
      appName = args[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Unknown or incomplete argument: ${args[index]}`);
  }

  if (!appName || !/^[a-z][a-z0-9-]{0,15}$/.test(appName)) {
    throw new Error('--app must be 1-16 lowercase letters, digits, or hyphens and start with a letter.');
  }

  const suffix = appName.replace(/-/g, '_');
  return {
    appName,
    database: `app_${suffix}`,
    user: `app_${suffix}`,
    dryRun,
  };
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Configure it in .env.provisioner.`);
  return value;
}

function ensureWindowsPrivateDirectory(directory) {
  const username = userInfo().username;
  const domain = process.env.USERDOMAIN;
  if (!username || !domain) {
    throw new Error('Cannot determine the current Windows account to secure the credential directory.');
  }

  execFileSync(
    'icacls',
    [
      directory,
      '/inheritance:r',
      '/grant:r',
      `${domain}\\${username}:(OI)(CI)F`,
      'SYSTEM:(OI)(CI)F',
    ],
    { stdio: 'ignore' }
  );
}

async function createPrivateDirectory(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if (process.platform === 'win32') {
    ensureWindowsPrivateDirectory(directory);
  } else {
    await chmod(directory, 0o700);
  }
}

function encodeEnvValue(value) {
  return JSON.stringify(value);
}

async function provision(app) {
  const outputDirectory = join(homedir(), '.aio-app-databases');
  const outputPath = join(outputDirectory, `${app.appName}.env`);
  if (app.dryRun) {
    const appHost = process.env.DB_PROVISIONER_APP_HOST || '<set DB_PROVISIONER_APP_HOST>';
    console.log(`Would create database ${app.database} and user ${app.user}@${appHost}.`);
    console.log(`Credentials would be saved to ${outputPath}.`);
    return;
  }

  const adminHost = requiredEnv('DB_PROVISIONER_ADMIN_HOST');
  const adminPort = Number(process.env.DB_PROVISIONER_ADMIN_PORT || 3306);
  const adminUser = requiredEnv('DB_PROVISIONER_ADMIN_USER');
  const adminPassword = requiredEnv('DB_PROVISIONER_ADMIN_PASSWORD');
  const appHost = requiredEnv('DB_PROVISIONER_APP_HOST');
  const appDbHost = process.env.DB_PROVISIONER_APP_DB_HOST || adminHost;
  const appDbPort = Number(process.env.DB_PROVISIONER_APP_DB_PORT || adminPort);

  if (!Number.isInteger(adminPort) || adminPort < 1 || adminPort > 65535) {
    throw new Error('DB_PROVISIONER_ADMIN_PORT must be a valid TCP port.');
  }
  if (!Number.isInteger(appDbPort) || appDbPort < 1 || appDbPort > 65535) {
    throw new Error('DB_PROVISIONER_APP_DB_PORT must be a valid TCP port.');
  }
  if (!/^[A-Za-z0-9.%:_-]+$/.test(appHost)) {
    throw new Error('DB_PROVISIONER_APP_HOST contains unsupported characters.');
  }
  if (appHost === '%') {
    throw new Error('DB_PROVISIONER_APP_HOST must not allow connections from every host.');
  }
  if (/[\r\n]/.test(appDbHost)) {
    throw new Error('DB_PROVISIONER_APP_DB_HOST must be a single-line host name or IP.');
  }

  await createPrivateDirectory(outputDirectory);

  const password = randomBytes(32).toString('base64url');
  const tlsCa = process.env.DB_PROVISIONER_SSL_CA;
  const connection = await mysql.createConnection({
    host: adminHost,
    port: adminPort,
    user: adminUser,
    password: adminPassword,
    ssl: tlsCa
      ? { ca: tlsCa.replace(/\\n/g, '\n'), rejectUnauthorized: true }
      : { rejectUnauthorized: false },
    charset: 'utf8mb4',
  });
  let databaseCreated = false;
  let userCreated = false;
  let outputCreated = false;
  let connected = false;

  try {
    await connection.connect();
    connected = true;
    await connection.query(
      `CREATE DATABASE \`${app.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    databaseCreated = true;

    await connection.query(
      `CREATE USER ${connection.escape(app.user)}@${connection.escape(appHost)} `
        + `IDENTIFIED BY ${connection.escape(password)}`
    );
    userCreated = true;

    await connection.query(
      `GRANT ALL PRIVILEGES ON \`${app.database}\`.* `
        + `TO ${connection.escape(app.user)}@${connection.escape(appHost)}`
    );

    let file;
    try {
      file = await open(outputPath, 'wx', 0o600);
      outputCreated = true;
      await file.writeFile(
        [
          `DB_HOST=${encodeEnvValue(appDbHost)}`,
          `DB_PORT=${encodeEnvValue(String(appDbPort))}`,
          `DB_NAME=${encodeEnvValue(app.database)}`,
          `DB_USER=${encodeEnvValue(app.user)}`,
          `DB_PASSWORD=${encodeEnvValue(password)}`,
          '',
        ].join('\n'),
        'utf8'
      );
    } finally {
      if (file) await file.close();
    }
  } catch (error) {
    const cleanupErrors = [];
    if (outputCreated) {
      try {
        await unlink(outputPath);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError.message);
      }
    }
    if (userCreated) {
      try {
        await connection.query(
          `DROP USER ${connection.escape(app.user)}@${connection.escape(appHost)}`
        );
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError.message);
      }
    }
    if (databaseCreated) {
      try {
        await connection.query(`DROP DATABASE \`${app.database}\``);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError.message);
      }
    }
    const cleanupMessage = cleanupErrors.length
      ? ` Cleanup was incomplete: ${cleanupErrors.join('; ')}`
      : '';
    throw new Error(`Provisioning failed: ${error.message}.${cleanupMessage}`);
  } finally {
    if (connected) await connection.end();
  }

  console.log(`Created database ${app.database} and restricted user ${app.user}@${appHost}.`);
  console.log(`Credentials saved securely to ${outputPath}; secret values were not displayed.`);
}

async function main() {
  const app = parseArguments(process.argv.slice(2));
  if (app.help) {
    usage();
    return;
  }
  await provision(app);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
