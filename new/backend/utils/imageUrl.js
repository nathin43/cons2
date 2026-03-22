/**
 * Image URL Helper
 * Converts relative image paths to full URLs for production
 */

/**
 * Convert relative image path to full URL
 * @param {string} imagePath - Relative path like '/uploads/products/image.jpg'
 * @returns {string} - Full URL in production, relative path in development
 */
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Get BASE_URL from environment or use relative path
  const baseUrl = process.env.BASE_URL || '';
  
  // Remove leading slash if BASE_URL already ends with slash
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Return full URL if BASE_URL exists, otherwise relative path
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
};

/**
 * Process product object to add full image URLs
 * @param {Object} product - Product object
 * @returns {Object} - Product with full image URL
 */
const processProductImages = (product) => {
  if (!product) return null;
  
  const productObj = product.toObject ? product.toObject() : { ...product };
  
  if (productObj.image) {
    productObj.image = getImageUrl(productObj.image);
  }
  
  // Handle multiple images if they exist
  if (productObj.images && Array.isArray(productObj.images)) {
    productObj.images = productObj.images.map(img => getImageUrl(img));
  }
  
  return productObj;
};

/**
 * Process array of products to add full image URLs
 * @param {Array} products - Array of product objects
 * @returns {Array} - Products with full image URLs
 */
const processProductsImages = (products) => {
  if (!products || !Array.isArray(products)) return [];
  
  return products.map(product => processProductImages(product));
};

module.exports = {
  getImageUrl,
  processProductImages,
  processProductsImages
};
