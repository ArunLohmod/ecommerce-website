class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    let queryStrCopy = { ...this.queryStr };

    // remove some fields for categpry
    const removeFields = ["keyword", "page", "limit"]; // already searched by keyword in search function
    removeFields.forEach((key) => delete queryStrCopy[key]);

    // filter for price and rating
    queryStrCopy = JSON.stringify(queryStrCopy);
    queryStrCopy = queryStrCopy.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (key) => `$${key}`
    );

    queryStrCopy = JSON.parse(queryStrCopy);

    this.query = this.query.find(queryStrCopy);
    return this;
  }

  paginate(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;

    const skip = resultPerPage * (currentPage - 1);

    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

module.exports = ApiFeatures;
