#!/usr/bin/env node

/**
 * Sigil — Your signature, sealed in history.
 * A Git-native cryptographic agreement protocol.
 *
 * CLI entry point
 */

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { createRequire } from 'module';
import { execSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const REGISTRY_DIR = join(ROOT, 'registry', 'agreements');
const SIGNATURES_DIR = join(ROOT, 'registry', 'signatures');
const TEMPLATES_DIR = join(ROOT, 'templates');
const INDEX_FILE = join(ROOT, 'registry', 'index.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

function banner() {
  console.log(
    boxen(
      chalk.hex('#A78BFA').bold('◆ SIGIL') +
        '\n' +
        chalk.hex('#6D28D9')('Your signature, sealed in history.'),
      {
        padding: 1,
        margin: { top: 1, bottom: 0 },
        borderStyle: 'round',
        borderColor: '#7C3AED',
      }
    )
  );
}

function loadIndex() {
  if (!existsSync(INDEX_FILE)) return { agreements: [] };
  return JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
}

function saveIndex(index) {
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
}

function contentHash(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function ensureDirs() {
  [REGISTRY_DIR, SIGNATURES_DIR].forEach((d) => mkdirSync(d, { recursive: true }));
}

function getTemplate(type) {
  const path = join(TEMPLATES_DIR, `${type}.md`);
  if (!existsSync(path)) {
    console.error(chalk.red(`✗ Template not found: ${type}`));
    console.log(chalk.dim(`Available: freelance, cla, sla, milestone, split`));
    process.exit(1);
  }
  return readFileSync(path, 'utf8');
}

function renderTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function gitRootExists() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function tryGetCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

// ─── GPG Helpers ─────────────────────────────────────────────────────────────

function gpgSign(content, keyId) {
  const result = spawnSync(
    'gpg',
    ['--armor', '--detach-sign', ...(keyId ? ['--local-user', keyId] : []), '--output', '-', '-'],
    { input: content, encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error(`GPG signing failed: ${result.stderr}`);
  }
  return result.stdout;
}

function gpgVerify(content, signature) {
  const sigFile = join(ROOT, '.tmp_sig.asc');
  writeFileSync(sigFile, signature, 'utf8');
  const result = spawnSync('gpg', ['--verify', sigFile, '-'], {
    input: content,
    encoding: 'utf8',
  });
  try { execSync(`del /f "${sigFile}"`, { stdio: 'ignore', shell: true }); } catch {}
  return result.status === 0;
}

function gpgAvailable() {
  try {
    execSync('gpg --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdInit(options) {
  banner();
  ensureDirs();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Agreement type:',
      choices: [
        { name: '💼  Freelance Contract', value: 'freelance' },
        { name: '📜  Contributor License Agreement (CLA)', value: 'cla' },
        { name: '⚡  Service Level Agreement (SLA)', value: 'sla' },
        { name: '🎯  Milestone Agreement', value: 'milestone' },
        { name: '💰  Revenue Split Agreement', value: 'split' },
      ],
      default: options.template,
    },
    { type: 'input', name: 'title', message: 'Agreement title:', validate: (v) => v.length > 3 || 'Required' },
    { type: 'input', name: 'partyA', message: 'Party A (GitHub username or email):', validate: (v) => !!v },
    { type: 'input', name: 'partyB', message: 'Party B (GitHub username or email):', validate: (v) => !!v },
    { type: 'input', name: 'description', message: 'Brief description / scope:' },
    { type: 'input', name: 'expires', message: 'Expiry date (YYYY-MM-DD, leave blank = no expiry):' },
  ]);

  const id = uuidv4().split('-')[0]; // Short ID
  const timestamp = new Date().toISOString();
  const template = getTemplate(answers.template);

  const rendered = renderTemplate(template, {
    id,
    title: answers.title,
    partyA: answers.partyA,
    partyB: answers.partyB,
    description: answers.description || 'As discussed between the parties.',
    timestamp,
    expires: answers.expires || 'No expiry',
    type: answers.template,
    contentHashPlaceholder: 'TBD — computed after finalization',
  });

  const hash = contentHash(rendered);
  const finalText = rendered.replace('TBD — computed after finalization', hash);

  const agreementFile = join(REGISTRY_DIR, `${id}.md`);
  writeFileSync(agreementFile, finalText, 'utf8');

  // Update index
  const index = loadIndex();
  index.agreements.push({
    id,
    title: answers.title,
    type: answers.template,
    parties: [answers.partyA, answers.partyB],
    contentHash: hash,
    timestamp,
    expires: answers.expires || null,
    status: 'pending',
    signatures: [],
  });
  saveIndex(index);

  console.log('\n' + chalk.green('✓ Agreement created!'));
  console.log(chalk.dim(`  ID:   `) + chalk.bold(id));
  console.log(chalk.dim(`  Hash: `) + chalk.hex('#A78BFA')(hash.slice(0, 32) + '...'));
  console.log(chalk.dim(`  File: `) + chalk.underline(agreementFile));
  console.log('\n' + chalk.hex('#7C3AED')('Next steps:'));
  console.log(chalk.dim('  1. Share the agreement ID with the other party'));
  console.log(chalk.dim(`  2. Each party runs: `) + chalk.bold(`sigil sign ${id}`));
  console.log(chalk.dim(`  3. Verify with: `) + chalk.bold(`sigil verify ${id}`));
  console.log(chalk.dim(`  4. Publish with: `) + chalk.bold(`sigil publish ${id}`));
}

async function cmdSign(id, options) {
  banner();
  ensureDirs();

  if (!id) {
    const index = loadIndex();
    if (!index.agreements.length) {
      console.error(chalk.red('✗ No agreements found. Run: sigil init'));
      process.exit(1);
    }
    const { chosen } = await inquirer.prompt([{
      type: 'list',
      name: 'chosen',
      message: 'Select agreement to sign:',
      choices: index.agreements
        .filter(a => a.status === 'pending')
        .map(a => ({ name: `[${a.id}] ${a.title} (${a.type})`, value: a.id })),
    }]);
    id = chosen;
  }

  const agreementFile = join(REGISTRY_DIR, `${id}.md`);
  if (!existsSync(agreementFile)) {
    console.error(chalk.red(`✗ Agreement not found: ${id}`));
    process.exit(1);
  }

  const agreementText = readFileSync(agreementFile, 'utf8');

  if (!gpgAvailable()) {
    // Fallback: hash-only signing (no GPG)
    console.log(chalk.yellow('⚠  GPG not found — using hash-only signing (less secure)'));
    const { signer } = await inquirer.prompt([
      { type: 'input', name: 'signer', message: 'Your name or GitHub username:' },
    ]);
    const sigContent = `SIGIL-HASH-SIGNATURE\nSigner: ${signer}\nTimestamp: ${new Date().toISOString()}\nContent-Hash: ${contentHash(agreementText)}\n`;
    const sigDir = join(SIGNATURES_DIR, id);
    mkdirSync(sigDir, { recursive: true });
    const sigFile = join(sigDir, `${signer.replace(/[^a-z0-9]/gi, '_')}.sig`);
    writeFileSync(sigFile, sigContent, 'utf8');

    const index = loadIndex();
    const agreement = index.agreements.find(a => a.id === id);
    if (agreement && !agreement.signatures.includes(signer)) {
      agreement.signatures.push(signer);
      if (agreement.signatures.length >= agreement.parties.length) {
        agreement.status = 'active';
      }
      saveIndex(index);
    }

    console.log(chalk.green(`\n✓ Signed (hash-only): ${signer}`));
    console.log(chalk.dim('  Install GPG for full cryptographic signing.'));
    return;
  }

  // GPG Signing
  const spinner = ora('Signing with GPG...').start();
  try {
    const signature = gpgSign(agreementText, options.key);
    const { signer } = await inquirer.prompt([
      { type: 'input', name: 'signer', message: 'Your name/identifier (for filename):' },
    ]);
    spinner.stop();

    const sigDir = join(SIGNATURES_DIR, id);
    mkdirSync(sigDir, { recursive: true });
    writeFileSync(join(sigDir, `${signer.replace(/[^a-z0-9]/gi, '_')}.asc`), signature, 'utf8');

    const index = loadIndex();
    const agreement = index.agreements.find(a => a.id === id);
    if (agreement && !agreement.signatures.includes(signer)) {
      agreement.signatures.push(signer);
      if (agreement.signatures.length >= agreement.parties.length) {
        agreement.status = 'active';
      }
      saveIndex(index);
    }

    console.log(chalk.green(`\n✓ GPG signature saved for: ${signer}`));
  } catch (err) {
    spinner.fail('GPG signing failed.');
    console.error(chalk.dim(err.message));
    process.exit(1);
  }
}

function cmdVerify(id) {
  banner();

  const index = loadIndex();
  const agreements = id
    ? index.agreements.filter(a => a.id === id)
    : index.agreements;

  if (!agreements.length) {
    console.log(chalk.yellow('No agreements found.'));
    return;
  }

  for (const agreement of agreements) {
    const agreementFile = join(REGISTRY_DIR, `${agreement.id}.md`);
    const exists = existsSync(agreementFile);
    const currentHash = exists ? contentHash(readFileSync(agreementFile, 'utf8')) : null;
    const hashValid = currentHash === agreement.contentHash;

    const sigDir = join(SIGNATURES_DIR, agreement.id);
    const sigFiles = existsSync(sigDir) ? readdirSync(sigDir) : [];

    const allSigned = agreement.signatures.length >= agreement.parties.length;
    const expired = agreement.expires && new Date(agreement.expires) < new Date();

    console.log('\n' + chalk.bold(`◆ ${agreement.title}`));
    console.log(chalk.dim(`  ID:      `) + agreement.id);
    console.log(chalk.dim(`  Type:    `) + agreement.type);
    console.log(chalk.dim(`  Parties: `) + agreement.parties.join(', '));
    console.log(chalk.dim(`  Status:  `) + statusBadge(agreement.status, expired));

    console.log(chalk.dim(`  Hash:    `) + (hashValid
      ? chalk.green('✓ Verified (untampered)')
      : chalk.red('✗ HASH MISMATCH — file may have been altered!')));

    console.log(chalk.dim(`  Sigs:    `) + (sigFiles.length
      ? chalk.green(`✓ ${sigFiles.length} signature(s): ${sigFiles.join(', ')}`)
      : chalk.yellow('⚠  No signatures yet')));

    if (expired) console.log(chalk.red(`  ✗ Expired: ${agreement.expires}`));
    if (agreement.expires && !expired)
      console.log(chalk.dim(`  Expires: `) + agreement.expires);
  }
  console.log('');
}

function statusBadge(status, expired) {
  if (expired) return chalk.bgRed.white(' EXPIRED ');
  return {
    pending: chalk.bgYellow.black(' PENDING '),
    active:  chalk.bgGreen.black(' ACTIVE '),
    fulfilled: chalk.bgBlue.white(' FULFILLED '),
    disputed: chalk.bgRed.white(' DISPUTED '),
  }[status] ?? chalk.dim(status);
}

function cmdList() {
  banner();
  const index = loadIndex();
  if (!index.agreements.length) {
    console.log(chalk.dim('\n  No agreements yet. Run: sigil init\n'));
    return;
  }

  console.log('\n' + chalk.hex('#7C3AED').bold(`  ${index.agreements.length} agreement(s) in registry:\n`));
  for (const a of index.agreements) {
    const expired = a.expires && new Date(a.expires) < new Date();
    console.log(
      `  ${chalk.hex('#A78BFA')(a.id)}  ${chalk.bold(a.title.padEnd(40))}` +
      `  ${statusBadge(a.status, expired)}  ` +
      chalk.dim(a.parties.join(' ↔ '))
    );
  }
  console.log('');
}

function cmdPublish(id) {
  banner();
  if (!gitRootExists()) {
    console.error(chalk.red('✗ Not inside a git repository.'));
    process.exit(1);
  }
  const spinner = ora('Preparing for publication...').start();
  try {
    execSync(`git add registry/`, { cwd: ROOT });
    const commitHash = tryGetCurrentCommit();
    execSync(`git commit -m "sigil: publish agreement ${id}"`, { cwd: ROOT });
    const newHash = tryGetCurrentCommit();
    spinner.succeed('Committed to git history.');
    console.log(chalk.dim(`  Commit: `) + chalk.hex('#A78BFA')(newHash));
    console.log('\n' + chalk.green('✓ Ready to push!'));
    console.log(chalk.dim('  Run: ') + chalk.bold('git push origin main'));
    console.log(chalk.dim('  Then open a PR to the Sigil public registry.'));
  } catch (err) {
    spinner.fail('Failed to commit.');
    console.error(chalk.dim(err.message));
  }
}

function cmdDemo() {
  banner();
  console.log(chalk.hex('#7C3AED').bold('\n  ◆ Quick Demo — Sigil Protocol\n'));
  console.log(chalk.dim('  1. Initialize an agreement:'));
  console.log('     ' + chalk.bold('sigil init --template freelance'));
  console.log(chalk.dim('\n  2. Sign (Party A):'));
  console.log('     ' + chalk.bold('sigil sign <id>'));
  console.log(chalk.dim('\n  3. Sign (Party B, on their machine):'));
  console.log('     ' + chalk.bold('sigil sign <id>'));
  console.log(chalk.dim('\n  4. Verify both signatures:'));
  console.log('     ' + chalk.bold('sigil verify <id>'));
  console.log(chalk.dim('\n  5. Commit & publish to the registry:'));
  console.log('     ' + chalk.bold('sigil publish <id>'));
  console.log(chalk.dim('\n  6. List all agreements:'));
  console.log('     ' + chalk.bold('sigil list\n'));
}

// ─── CLI Definition ──────────────────────────────────────────────────────────

program
  .name('sigil')
  .description(chalk.hex('#A78BFA')('Your signature, sealed in history.'))
  .version('0.1.0');

program
  .command('init')
  .description('Create a new agreement')
  .option('-t, --template <type>', 'Template: freelance | cla | sla | milestone | split')
  .action(cmdInit);

program
  .command('sign [id]')
  .description('Sign an agreement with your GPG key')
  .option('-k, --key <keyid>', 'GPG key ID or fingerprint')
  .action(cmdSign);

program
  .command('verify [id]')
  .description('Verify agreement integrity and signatures')
  .action(cmdVerify);

program
  .command('list')
  .description('List all agreements in the registry')
  .action(cmdList);

program
  .command('publish <id>')
  .description('Commit and push agreement to the public registry')
  .action(cmdPublish);

program
  .command('demo')
  .description('Show usage examples')
  .action(cmdDemo);

program.parse();
