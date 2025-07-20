import { format } from "date-fns";
import { utcToZonedTime } from 'date-fns-tz';

const year = (date) => `${new Date(date).getFullYear()}`;

export default function (eleventyConfig, formats = {}) {
  // https://date-fns.org/v2.21.2/docs/format
  const formatDate = (date, as = 'default') => {
    const utcDate = utcToZonedTime(date, '+00:00');
    const useFormat = formats[as] || as;
    const inFormat = format(utcDate, useFormat);
    return inFormat;
  };

  eleventyConfig.addShortcode('year', year);
  eleventyConfig.addFilter('year', year);
  eleventyConfig.addFilter('formatDate', formatDate);
};
