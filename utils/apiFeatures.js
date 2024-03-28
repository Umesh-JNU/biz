const { Op } = require("sequelize");

module.exports = (key, requestQuery, multikey) => {
  {
    /**
     * key: key for which value to be searched
     * requestQuery: requestQuery passed in api url
     */
  }
  const { keyword, resultPerPage, currentPage } = requestQuery;
  console.log(keyword, resultPerPage, currentPage);
  let query = {
    where: {},
    order: [['createdAt', 'DESC']]
  };
  if (keyword) {
    if (multikey) {
      const multiSeachOptions = multikey.reduce(
        (obj, key) => ({
          ...obj,
          [key]: { [Op.iRegexp]: keyword }
        }),
        {}
      );

      query.where = {
        ...query.where,
        [Op.or]: multiSeachOptions
      };
      
    } else {
      query.where = {
        ...query.where,
        [key]: { [Op.iRegexp]: keyword },
      };
    }
  }

  if (resultPerPage && currentPage) {
    const cp = Number(currentPage); // cp = currentPage
    const rpp = Number(resultPerPage); // rpp = resultPerPage
    const skip = rpp * (cp - 1);
    query = { ...query, offset: skip, limit: rpp };
  }
  console.log({ query })
  return query;
};
