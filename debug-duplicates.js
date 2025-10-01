// Debug script to test duplicate detection
const { getPhotos } = require('./lib/storage.ts');

async function debugDuplicates() {
  try {
    console.log('🔍 Starting duplicate detection debug...');
    
    // Get all photos
    const photos = await getPhotos();
    console.log(`📸 Found ${photos.length} photos`);
    
    // Log first few photos for debugging
    console.log('\n📋 First 5 photos:');
    photos.slice(0, 5).forEach((photo, i) => {
      console.log(`${i + 1}. ${photo.fileName} (${photo.fileSize} bytes)`);
    });
    
    // Group by file size
    const sizeMap = new Map();
    for (const photo of photos) {
      if (!sizeMap.has(photo.fileSize)) {
        sizeMap.set(photo.fileSize, []);
      }
      sizeMap.get(photo.fileSize).push(photo);
    }
    
    console.log(`\n📊 Found ${sizeMap.size} unique file sizes`);
    
    // Check for potential duplicates
    const potentialDuplicates = [];
    for (const [size, photosOfSize] of sizeMap) {
      if (photosOfSize.length > 1) {
        console.log(`\n🔍 Size ${size}: ${photosOfSize.length} photos`);
        photosOfSize.forEach(photo => {
          console.log(`  - ${photo.fileName}`);
        });
        
        // Group by filename pattern
        const patternMap = new Map();
        for (const photo of photosOfSize) {
          let basePattern = photo.fileName;
          
          // Remove timestamp patterns: photo_1234567890.jpg -> photo_.jpg
          basePattern = basePattern.replace(/photo_\d+/, 'photo_');
          basePattern = basePattern.replace(/_\d+\./, '_.');
          
          if (!basePattern.includes('photo_')) {
            basePattern = photo.fileName;
          }
          
          if (!patternMap.has(basePattern)) {
            patternMap.set(basePattern, []);
          }
          patternMap.get(basePattern).push(photo);
        }
        
        // Check for duplicate patterns
        for (const [pattern, photosOfPattern] of patternMap) {
          if (photosOfPattern.length > 1) {
            console.log(`  ✅ Duplicate pattern "${pattern}": ${photosOfPattern.length} photos`);
            potentialDuplicates.push({
              hash: `${size}_${pattern}`,
              photos: photosOfPattern
            });
          }
        }
      }
    }
    
    console.log(`\n🎉 Found ${potentialDuplicates.length} duplicate groups`);
    
    if (potentialDuplicates.length > 0) {
      console.log('\n📋 Duplicate groups:');
      potentialDuplicates.forEach((group, i) => {
        console.log(`\n${i + 1}. Hash: ${group.hash}`);
        group.photos.forEach(photo => {
          console.log(`   - ${photo.fileName} (${photo.fileSize} bytes)`);
        });
      });
    } else {
      console.log('\n❌ No duplicates found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugDuplicates();
