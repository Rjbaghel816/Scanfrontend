/**
 * Compresses an image file or blob using HTML5 Canvas
 * @param {File|Blob|string} imageSource - File, Blob, or Data URL
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = async (imageSource, options = {}) => {
    const {
        maxWidth = 1600,
        maxHeight = 2200, // Optimized for A4 aspect ratio
        quality = 0.8,
        type = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();

        // Handle different source types
        if (typeof imageSource === 'string') {
            img.src = imageSource;
        } else if (imageSource instanceof Blob || imageSource instanceof File) {
            img.src = URL.createObjectURL(imageSource);
        } else {
            reject(new Error('Invalid image source'));
            return;
        }

        img.onload = () => {
            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            // Draw image
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob/file
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], "compressed.jpg", {
                            type: type,
                            lastModified: Date.now(),
                        });

                        // Clean up
                        if (typeof imageSource !== 'string') {
                            URL.revokeObjectURL(img.src);
                        }

                        resolve(compressedFile);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                },
                type,
                quality
            );
        };

        img.onerror = (error) => {
            reject(error);
        };
    });
};
