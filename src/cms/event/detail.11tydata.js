const hasTickets = (options) => {
  if (!options) {
    return null;
  }

  const perOpt = options.filter((opt) => opt.seats).map((opt) => {
    return opt.tickets.data.reduce(
      (all, current) => {
        return all - current.attributes.seats;
      }, opt.seats)
  });

  return perOpt.reduce((all, opt) => (all + opt), 0);
}

module.exports = {
  permalink: function(data) {
    return this.permaSlug(data.cms, 'event');
  },
  eleventyComputed: {
    title: data => `${data.cms.date} @ ${data.cms.time}`,
    show: data => data.cms.show.data,
    show_slug: data => data.cms.show_slug,
    show_title: data => data.cms.show.data.attributes.title,
    show_summary: data => data.cms.show.data.attributes.header.summary,
    show_link: data => `/shows/${data.show_slug}/`,
    has_tickets: data => hasTickets(data.cms.option),
    subtitle: data => {
      const backLink = `[${data.show_title}](${data.show_link})`;
      return data.cms.title
        ? `${data.cms.title} | ${backLink}`
        : backLink;
    },
  }
};
