const toFormat = require('date-fns/format');
const { utcToZonedTime } = require('date-fns-tz');

const year = (date) => `${new Date(date).getFullYear()}`;

module.exports = function (eleventyConfig, formats = {}) {
  // https://date-fns.org/v2.21.2/docs/format
  const formatDate = (date, format = 'default') => {
    const utcDate = utcToZonedTime(date, '+00:00');
    const useFormat = formats[format] || format;
    const inFormat = toFormat(utcDate, useFormat);
    return inFormat;
  };

  eleventyConfig.addShortcode('year', year);
  eleventyConfig.addFilter('year', year);
  eleventyConfig.addFilter('formatDate', formatDate);
};
