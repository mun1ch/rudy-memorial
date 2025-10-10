/**
 * Type definitions for heic-convert
 * heic-convert has both Node.js and browser versions
 */

declare module 'heic-convert' {
  interface ConvertOptions {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    quality?: number;
  }
  
  function convert(options: ConvertOptions): Promise<Buffer>;
  export default convert;
}

declare module 'heic-convert/browser' {
  interface ConvertOptions {
    buffer: Uint8Array;
    format: 'JPEG' | 'PNG';
    quality?: number;
  }
  
  function convert(options: ConvertOptions): Promise<ArrayBuffer>;
  export default convert;
}

