const getSeats = (option) => option.tickets.data.reduce(
  (all, ticket) => {
    return all - ticket.attributes.seats;
  },
  option.seats
);

module.exports = function (eleventyConfig, options = {}) {
  eleventyConfig.addFilter('getSeats', getSeats);
};
