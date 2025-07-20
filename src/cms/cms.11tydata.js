const getHero = (src) => src.header?.hero.data?.attributes;

export const layout = 'cms';
export const eleventyComputed = {
  title: (data) => data.cms.title,
  subtitle: (data) => data.cms.header?.subTitle,
  summary: (data) => data.cms.header?.summary,
  hero: (data) => getHero(data.cms) || getHero(data.site),
  date: (data) => data.cms.date,
  end: (data) => data.cms.end,
  id: (data) => data.cms.id,
};
export function permalink(data) {
  return this.buildURL(data.cms);
}
