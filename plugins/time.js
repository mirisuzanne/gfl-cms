const dateFormat = require('date-fns/format');
const { utcToZonedTime } = require('date-fns-tz');

const year = () => `${new Date().getFullYear()}`;

module.exports = function (eleventyConfig, options = {}) {
  // https://date-fns.org/v2.21.2/docs/format
  const formats = {
    day: 'd',
    month: 'MMMM',
    year: 'yyyy',
    iso: 'yyyy-MM-dd',
    url: 'yyyy/MM/dd',
    default: 'yyyy/MM/dd',
    ...options,
  };

  const formatDate = (date, format = 'default') =>
    dateFormat(utcToZonedTime(date, '+00:00'), formats[format] || format);

  eleventyConfig.addShortcode('year', year);
  eleventyConfig.addFilter('date', formatDate);
};
