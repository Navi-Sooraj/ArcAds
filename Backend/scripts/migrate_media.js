import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import models, { sequelize } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function migrateBase64ToFile(base64Data, prefix = 'migrated') {
  if (!base64Data || !base64Data.startsWith('data:')) return base64Data;

  try {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return base64Data;

    const mimeType = match[1];
    const base64Content = match[2];
    const extension = mimeType.split('/')[1] || 'jpg';
    
    // Convention: (original name + unique timestamp)
    // For migrated data, we use prefix + timestamp
    const fileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
    console.log(`Saved: ${fileName}`);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('Migration error for string:', err.message);
    return base64Data;
  }
}

async function migrate() {
  try {
    console.log('Starting media migration...');

    // 1. Migrate AdServices
    const services = await models.AdService.findAll();
    console.log(`Found ${services.length} ad services.`);
    for (const svc of services) {
      let changed = false;
      
      // Main image
      if (svc.image && svc.image.startsWith('data:')) {
        svc.image = await migrateBase64ToFile(svc.image, `service-${svc.id}`);
        changed = true;
      }

      // Images array
      let images = [];
      try {
        images = JSON.parse(svc.images || '[]');
      } catch {
        images = [];
      }

      if (Array.isArray(images)) {
        const newImages = [];
        for (let i = 0; i < images.length; i++) {
          if (typeof images[i] === 'string' && images[i].startsWith('data:')) {
            const newUrl = await migrateBase64ToFile(images[i], `service-${svc.id}-${i}`);
            newImages.push(newUrl);
            changed = true;
          } else {
            newImages.push(images[i]);
          }
        }
        if (changed) svc.images = JSON.stringify(newImages);
      }

      if (changed) {
        await svc.save();
        console.log(`Updated AdService ID: ${svc.id}`);
      }
    }

    // 2. Migrate AdSpaces
    const spaces = await models.AdSpace.findAll();
    console.log(`Found ${spaces.length} ad spaces.`);
    for (const space of spaces) {
      let changed = false;

      if (space.imageUrl && space.imageUrl.startsWith('data:')) {
        space.imageUrl = await migrateBase64ToFile(space.imageUrl, `adspace-img-${space.id}`);
        changed = true;
      }

      if (space.videoUrl && space.videoUrl.startsWith('data:')) {
        space.videoUrl = await migrateBase64ToFile(space.videoUrl, `adspace-vid-${space.id}`);
        changed = true;
      }

      if (changed) {
        await space.save();
        console.log(`Updated AdSpace ID: ${space.id}`);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Global migration error:', err);
    process.exit(1);
  }
}

migrate();
