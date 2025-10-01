// Simple test to verify duplicate detection logic
const testFilenames = [
  "photo_1759299520618-cplXKPdFbb8q4urZQXIB4yVnqU8Qdr.jpg",
  "photo_1759299520618-abc123def456.jpg", // Same timestamp, different hash
  "photo_1759299518817-JguzSurU5tkkOXBCuOucLXmaxK4nwx.jpg",
  "photo_1759297060096-CzuMgNTFH73wyEY8ctfzOsIi5Dl8nw.jpg"
];

function testDuplicateDetection() {
  console.log('🧪 Testing duplicate detection logic...\n');
  
  testFilenames.forEach((filename, i) => {
    console.log(`${i + 1}. Testing: ${filename}`);
    
    let basePattern = filename;
    
    // Remove timestamp and hash: photo_1234567890-abc123def456.jpg -> photo_.jpg
    basePattern = basePattern.replace(/photo_\d+-[a-zA-Z0-9]+/, 'photo_');
    
    // Fallback: remove just timestamp if no hash pattern found
    if (basePattern === filename) {
      basePattern = basePattern.replace(/photo_\d+/, 'photo_');
    }
    
    // Remove any other numeric suffixes that might be timestamps
    basePattern = basePattern.replace(/_\d+\./, '_.');
    
    // For files that don't follow the photo_ pattern, use the original filename
    if (!basePattern.includes('photo_')) {
      basePattern = filename;
    }
    
    console.log(`   Result: ${basePattern}\n`);
  });
  
  // Test grouping
  console.log('📊 Testing grouping logic...\n');
  
  const mockPhotos = [
    { fileName: "photo_1759299520618-cplXKPdFbb8q4urZQXIB4yVnqU8Qdr.jpg", fileSize: 2810385 },
    { fileName: "photo_1759299520618-abc123def456.jpg", fileSize: 2810385 }, // Same size, should be duplicate
    { fileName: "photo_1759299518817-JguzSurU5tkkOXBCuOucLXmaxK4nwx.jpg", fileSize: 4327773 },
    { fileName: "photo_1759297060096-CzuMgNTFH73wyEY8ctfzOsIi5Dl8nw.jpg", fileSize: 2980306 }
  ];
  
  // Group by file size
  const sizeMap = new Map();
  for (const photo of mockPhotos) {
    if (!sizeMap.has(photo.fileSize)) {
      sizeMap.set(photo.fileSize, []);
    }
    sizeMap.get(photo.fileSize).push(photo);
  }
  
  console.log('Size groups:');
  for (const [size, photos] of sizeMap) {
    console.log(`  Size ${size}: ${photos.length} photos`);
    photos.forEach(photo => console.log(`    - ${photo.fileName}`));
  }
  
  // Test pattern matching for duplicates
  console.log('\n🔍 Testing pattern matching for duplicates...\n');
  
  for (const [size, photosOfSize] of sizeMap) {
    if (photosOfSize.length > 1) {
      console.log(`Size ${size} has ${photosOfSize.length} photos - checking for duplicates:`);
      
      const patternMap = new Map();
      for (const photo of photosOfSize) {
        let basePattern = photo.fileName;
        
        // Remove timestamp and hash: photo_1234567890-abc123def456.jpg -> photo_.jpg
        basePattern = basePattern.replace(/photo_\d+-[a-zA-Z0-9]+/, 'photo_');
        
        // Fallback: remove just timestamp if no hash pattern found
        if (basePattern === photo.fileName) {
          basePattern = basePattern.replace(/photo_\d+/, 'photo_');
        }
        
        // Remove any other numeric suffixes that might be timestamps
        basePattern = basePattern.replace(/_\d+\./, '_.');
        
        // For files that don't follow the photo_ pattern, use the original filename
        if (!basePattern.includes('photo_')) {
          basePattern = photo.fileName;
        }
        
        if (!patternMap.has(basePattern)) {
          patternMap.set(basePattern, []);
        }
        patternMap.get(basePattern).push(photo);
      }
      
      console.log(`  Found ${patternMap.size} patterns:`);
      for (const [pattern, photosOfPattern] of patternMap) {
        console.log(`    Pattern "${pattern}": ${photosOfPattern.length} photos`);
        if (photosOfPattern.length > 1) {
          console.log(`      ✅ DUPLICATE GROUP FOUND!`);
          photosOfPattern.forEach(photo => console.log(`        - ${photo.fileName}`));
        }
      }
    }
  }
}

testDuplicateDetection();
