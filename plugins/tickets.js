const getSeats = (option) => option.tickets.data.reduce(
  (all, ticket) => {
    return all - ticket.attributes.seats;
  },
  option.seats
);

export default function (eleventyConfig, options = {}) {
  eleventyConfig.addFilter('getSeats', getSeats);
};
