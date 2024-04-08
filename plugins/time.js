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
    ...options,
  };

  const isZoned = (date) => {
    return (typeof date === 'string') && (date.length > 24);
  }

  const makeDate = (date) => {
    if (typeof date === 'string') {
      return new Date(date);
    }

    return date || new Date();
  }

  const utcDate = (date) => {
    return utcToZonedTime(date, '+00:00');
  };

  const formatDate = (date, format = 'default', zoned) => {
    const dateObj = makeDate(date);
    const zDate = zoned || isZoned(date) ? dateObj : utcDate(dateObj);
    return dateFormat(zDate, formats[format] || format)
  };

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
