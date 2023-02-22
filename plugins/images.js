const Image = require('@11ty/eleventy-img');
const path = require('path');

module.exports = function(eleventyConfig, options = {}) {
  const imgFolder = options.imgFolder;
  const imgOutput = { ...options.output };
  const imgSizes = {
    default: '100vw',
    ...options.sizes,
  };
  const imgAttrs = {
    loading: 'lazy',
    decoding: 'async',
    ...(options.attrs || {}),
  }

  async function getImageData(src) {
    const imgSrc = imgFolder && !src.includes('://')
      ? path.join(imgFolder, src)
      : src;

    const metadata = await Image(imgSrc, imgOutput);
    return metadata;
  }

  async function imageHtml(src, alt, sizes, attrs) {
    let metadata = await getImageData(src);

    let sizesAttr = sizes || imgSizes.default;
    let namedSizes = sizes && imgSizes[sizes];

    const imageAttributes = {
      alt,
      sizes: namedSizes || sizesAttr,
      ...imgAttrs,
      ...attrs,
    };

    if (namedSizes) { imageAttributes['data-img'] = namedSizes; }

    // You bet we throw an error on missing alt in `imageAttributes` (alt=' works okay)
    return Image.generateHTML(metadata, imageAttributes, {
      whitespaceMode: 'inline',
    });
  }

  async function imageSrc(src) {
    const metadata = await getImageData(src);
    const img = metadata.jpeg[metadata.jpeg.length - 1];
    return img.url;
  }

  eleventyConfig.addAsyncFilter('img', imageHtml);
  eleventyConfig.addAsyncFilter('src', imageSrc);
  eleventyConfig.addAsyncShortcode('img', imageHtml);
  eleventyConfig.addAsyncShortcode('src', imageSrc);
};
