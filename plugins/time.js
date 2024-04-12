const toFormat = require('date-fns/format');
const { utcToZonedTime, toDate } = require('date-fns-tz');

const year = (date) => `${new Date(date).getFullYear()}`;
const zone = 'America/Denver';

module.exports = function (eleventyConfig, formats = {}) {
  // https://date-fns.org/v2.21.2/docs/format
  const formatDate = (date, format = 'default') => {
    const dateObj = toDate(date, zone);
    const useFormat = formats[format] || format;
    const inFormat = toFormat(dateObj, useFormat, zone);
    return inFormat;
  };

  eleventyConfig.addShortcode('year', year);
  eleventyConfig.addFilter('year', year);
  eleventyConfig.addFilter('formatDate', formatDate);
};
