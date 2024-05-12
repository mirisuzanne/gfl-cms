const dateFormat = require('date-fns/format');
const { utcToZonedTime } = require('date-fns-tz');

const getHero = (src) => src.header?.hero.data?.attributes;

const getTitle = (data) => {
  const utcDate = utcToZonedTime(data.event.values.DateTime, '+00:00');
  return dateFormat(utcDate, data.time.event);
};

const getSubTitle = (data) => {
  const showTitle = `[${data.event.show.title}](../)`;
  return data.soldOut
    ? `**SOLD OUT** ${showTitle}`
    : `Tickets for ${showTitle}`;
}

const isPast = (date) => {
  const event = new Date(date);
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return event < now;
}

module.exports = {
  layout: 'page',
  tags: ['events'],
  hideEmailForm: true,
  pagination: {
    data: 'runs.events',
    size: 1,
    alias: 'event',
    addAllPagesToCollections: true,
  },
  eleventyComputed: {
    soldOut: (data) => data.event.values.Left < 1,
    isPast: (data) => isPast(data.event.values.DateTime),
    title: (data) => getTitle(data),
    subtitle: (data) => getSubTitle(data),
    summary: (data) => data.event.show.header?.summary,
    hero: (data) => getHero(data.event.show) || getHero(data.site),
    date: (data) => data.event.values.DateTime,
  },
  permalink: function(data) {
    return this.buildURL(data.event);
  },
};
