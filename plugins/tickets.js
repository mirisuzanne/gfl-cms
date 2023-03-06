const getEventSeats = (seats, tickets) => tickets.data.reduce(
  (all, current) => all - current.attributes.seats,
  seats
);

module.exports = function (eleventyConfig, options = {}) {
  eleventyConfig.addFilter('getEventSeats', getEventSeats);
};
