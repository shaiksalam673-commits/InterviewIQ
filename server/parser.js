import pdfParse from 'pdf-parse';

/**
 * Parses a PDF file buffer and extracts plain text.
 * @param {Buffer} buffer - The PDF file buffer.
 * @returns {Promise<string>} - Extracted text.
 */
export async function parsePdf(buffer) {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error('Could not read PDF. Please try a text-based PDF.');
    }
    
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();
    
    // Check if the extracted text is empty (which happens with scanned images/photos in PDFs)
    if (!text || text.length === 0) {
      throw new Error('Could not read PDF. Please try a text-based PDF.');
    }
    
    return text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    // Return the specific user-facing error message
    throw new Error('Could not read PDF. Please try a text-based PDF.');
  }
}
