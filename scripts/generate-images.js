#!/usr/bin/env node

/**
 * Alkainos CYOA - Image Generation Script
 * 
 * Reads story JSON files, generates images via DALL-E 3,
 * downloads them to the correct folder, and updates the JSON.
 * 
 * Usage:
 *   node scripts/generate-images.js
 *   node scripts/generate-images.js --story forest_of_shadows
 *   node scripts/generate-images.js --story forest_of_shadows --scene scene_001
 *   node scripts/generate-images.js --dry-run
 *   node scripts/generate-images.js --overwrite
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────

const CONFIG = {
  // DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
  // 1792x1024 = widescreen, good for scene headers
  imageSize: '1792x1024',
  imageQuality: 'standard', // 'standard' | 'hd' (hd costs 2x)
  imageFormat: 'png',

  // Alkainos master style prompt — appended to every generation
  stylePrompt: [
    'grimdark fantasy illustration',
    'woodcut engraving style',
    'monochrome dark ink on aged parchment',
    'heavy black linework',
    'dramatic shadows',
    'dark fantasy atmosphere',
    'no colour, only black white and grey tones',
    'detailed crosshatching',
    'medieval woodblock print aesthetic',
  ].join(', '),

  // Always exclude these from generations
  negativeHints: 'no bright colours, no modern elements, no anime style, no cartoons, no text, no watermarks',

  // Paths (relative to project root)
  storiesDir: './assets/stories',
  storyFilename: 'story.json',

  // API
  openAiModel: 'dall-e-3',
};

// ─────────────────────────────────────────
// ARGS
// ─────────────────────────────────────────

const args = process.argv.slice(2);
const storyFilter = args.includes('--story') ? args[args.indexOf('--story') + 1] : null;
const sceneFilter = args.includes('--scene') ? args[args.indexOf('--scene') + 1] : null;
const isDryRun = args.includes('--dry-run');
const overwrite = args.includes('--overwrite');

// ─────────────────────────────────────────
// API KEY
// ─────────────────────────────────────────

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY && !isDryRun) {
  console.error('❌ OPENAI_API_KEY environment variable not set.');
  console.error('   Run: export OPENAI_API_KEY=your_key_here');
  process.exit(1);
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function log(msg) { console.log(msg); }
function warn(msg) { console.warn(`⚠️  ${msg}`); }
function error(msg) { console.error(`❌ ${msg}`); }
function success(msg) { console.log(`✅ ${msg}`); }
function info(msg) { console.log(`ℹ️  ${msg}`); }

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ─────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────

function buildPrompt(scene) {
  const ip = scene.imagePrompt;
  let subject = '';

  if (ip) {
    // Use structured imagePrompt if available
    const parts = [];
    if (ip.subject) parts.push(ip.subject);
    if (ip.shot) parts.push(`${ip.shot} shot`);
    if (ip.mood) parts.push(`mood: ${ip.mood}`);
    subject = parts.join(', ');
  }

  // Fall back to inferring from scene text
  if (!subject) {
    const text = [scene.title, scene.description].filter(Boolean).join('. ');
    subject = text.substring(0, 300); // cap length
  }

  // Combine with style
  let prompt = `${subject}. ${CONFIG.stylePrompt}.`;

  // Add exclude hints
  if (ip?.exclude) {
    prompt += ` Avoid: ${ip.exclude}, ${CONFIG.negativeHints}.`;
  } else {
    prompt += ` Avoid: ${CONFIG.negativeHints}.`;
  }

  return prompt;
}

// ─────────────────────────────────────────
// DALL-E 3 API CALL
// ─────────────────────────────────────────

async function generateImage(prompt) {
  const body = JSON.stringify({
    model: CONFIG.openAiModel,
    prompt,
    n: 1,
    size: CONFIG.imageSize,
    quality: CONFIG.imageQuality,
    response_format: 'url',
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message));
          } else {
            resolve(parsed.data[0].url);
          }
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────
// PROCESS A SINGLE SCENE
// ─────────────────────────────────────────

async function processScene(scene, storyDir, storyName) {
  const sceneId = scene.id;

  // Skip if image file already exists on disk and not overwriting
  const imagesDir = path.join(storyDir, 'images');
  const filename = `${sceneId}.${CONFIG.imageFormat}`;
  const destPath = path.join(imagesDir, filename);

  if (fs.existsSync(destPath) && !overwrite) {
    info(`Skipping ${sceneId} - image already exists`);
    return false;
  }

  // Skip ending scenes with no visual value (optional — comment out if you want images for all)
  // if (scene.type === 'ending') {
  //   info(`Skipping ending scene ${sceneId}`);
  //   return false;
  // }

  const prompt = buildPrompt(scene);

  log(`\n📸 Scene: ${sceneId} (${scene.title || 'untitled'})`);
  log(`   Prompt: ${prompt.substring(0, 120)}...`);

  if (isDryRun) {
    info(`DRY RUN — would generate: ${filename}`);
    return false;
  }

  // Ensure images directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    log(`   Created directory: ${imagesDir}`);
  }

  try {
    log(`   Calling DALL-E 3...`);
    const imageUrl = await generateImage(prompt);

    log(`   Downloading...`);
    await downloadFile(imageUrl, destPath);

    success(`Saved: ${destPath}`);
    return filename;

  } catch (err) {
    error(`Failed for scene ${sceneId}: ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────
// PROCESS A SINGLE STORY
// ─────────────────────────────────────────

async function processStory(storyName) {
  const storyDir = path.join(CONFIG.storiesDir, storyName);
  const jsonPath = path.join(storyDir, CONFIG.storyFilename);

  if (!fs.existsSync(jsonPath)) {
    warn(`No story.json found at ${jsonPath} — skipping`);
    return;
  }

  log(`\n${'─'.repeat(60)}`);
  log(`📖 Story: ${storyName}`);
  log(`${'─'.repeat(60)}`);

  const storyData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const scenes = storyData.scenes ? Object.values(storyData.scenes) : [];

  let updated = false;
  let generated = 0;
  let skipped = 0;

  for (const scene of scenes) {
    // Apply scene filter if specified
    if (sceneFilter && scene.id !== sceneFilter) continue;

    // Rate limit: DALL-E 3 is 5 images/min on standard tier
    if (generated > 0) {
      log(`   Waiting 13s (rate limit)...`);
      await sleep(13000);
    }

    const filename = await processScene(scene, storyDir, storyName);

    if (filename) {
      // Update the scene's image reference in the JSON
      scene.image = {
        file: `images/${filename}`,
        altText: scene.title || scene.id,
        position: scene.image?.position || 'top',
      };
      updated = true;
      generated++;
    } else {
      skipped++;
    }
  }

  // Save updated JSON
  if (updated && !isDryRun) {
    fs.writeFileSync(jsonPath, JSON.stringify(storyData, null, 2), 'utf8');
    success(`Updated ${jsonPath} with ${generated} new image references`);
  }

  log(`\n📊 ${storyName}: ${generated} generated, ${skipped} skipped`);
}

// ─────────────────────────────────────────
// IMAGE REGISTRY
// ─────────────────────────────────────────

function regenerateImageRegistry() {
  const registryPath = path.join(__dirname, '..', 'src', 'assets', 'storyImages.ts');
  const storiesDir = CONFIG.storiesDir;
  const entries = [];

  if (fs.existsSync(storiesDir)) {
    for (const storyDir of fs.readdirSync(storiesDir).sort()) {
      const imagesDir = path.join(storiesDir, storyDir, 'images');
      if (!fs.existsSync(imagesDir) || !fs.statSync(path.join(storiesDir, storyDir)).isDirectory()) continue;

      for (const file of fs.readdirSync(imagesDir).sort()) {
        if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue;
        const key = `assets/stories/${storyDir}/images/${file}`;
        const requirePath = `../../assets/stories/${storyDir}/images/${file}`;
        entries.push({ key, requirePath });
      }
    }
  }

  const lines = [
    '// Auto-generated by scripts/generate-images.js — do not edit manually',
    '// Run: node scripts/generate-images.js to refresh after generating new images',
    '',
    'type ImageSource = number;',
    '',
    'export const STORY_IMAGES: Record<string, ImageSource> = {',
    ...entries.map(e => `  '${e.key}': require('${e.requirePath}'),`),
    '};',
    '',
  ];

  fs.writeFileSync(registryPath, lines.join('\n'), 'utf8');
  log(`\n📋 Updated image registry: ${entries.length} image(s)`);
}

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────

async function main() {
  log(`\n🗡️  Alkainos Image Generator`);
  log(`   Model: ${CONFIG.openAiModel}`);
  log(`   Size: ${CONFIG.imageSize}`);
  log(`   Quality: ${CONFIG.imageQuality}`);
  if (isDryRun) log(`   MODE: DRY RUN (no API calls)`);
  if (overwrite) log(`   MODE: OVERWRITE (regenerating existing images)`);
  if (storyFilter) log(`   Story filter: ${storyFilter}`);
  if (sceneFilter) log(`   Scene filter: ${sceneFilter}`);

  // Find all story directories
  const storiesDir = CONFIG.storiesDir;
  if (!fs.existsSync(storiesDir)) {
    error(`Stories directory not found: ${storiesDir}`);
    process.exit(1);
  }

  const stories = fs.readdirSync(storiesDir)
    .filter(name => {
      if (storyFilter && name !== storyFilter) return false;
      const dir = path.join(storiesDir, name);
      return fs.statSync(dir).isDirectory();
    });

  if (stories.length === 0) {
    warn('No stories found to process');
    process.exit(0);
  }

  log(`\nFound ${stories.length} story(s): ${stories.join(', ')}`);

  for (const storyName of stories) {
    await processStory(storyName);
  }

  regenerateImageRegistry();
  log(`\n✨ Done!\n`);
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});