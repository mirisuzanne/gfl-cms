const dateFormat = require('date-fns/format');
const { utcToZonedTime } = require('date-fns-tz');
const subDays = require('date-fns/subDays')

const year = () => `${new Date().getFullYear()}`;

module.exports = function (eleventyConfig, options = {}) {
  // https://date-fns.org/v2.21.2/docs/format
  const formats = {
    day: 'd',
    month: 'MMMM',
    year: 'yyyy',
    rough: 'MMMM yyyy',
    iso: 'yyyy-MM-dd',
    url: 'yyyy-MM-dd',
    default: 'yyyy/MM/dd',
    event: 'EEEE, MMMM d',
    ...options,
  };

  const utcDate = (date) => {
    const dateObj = typeof date === 'string'
      ? new Date(date)
      : date || new Date();

    return utcToZonedTime(dateObj, '+00:00');
  };

  const formatDate = (date, format = 'default') =>
    dateFormat(utcDate(date), formats[format] || format);

  const isCurrent = (date) => {
    const today = subDays(utcDate(), 1);
    return date > today;
  }

  eleventyConfig.addShortcode('year', year);
  eleventyConfig.addFilter('year', year);
  eleventyConfig.addFilter('utcDate', utcDate);
  eleventyConfig.addFilter('isCurrent', isCurrent);
  eleventyConfig.addFilter('formatDate', formatDate);
};
