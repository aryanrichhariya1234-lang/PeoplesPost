export class TourClass {
  constructor(queryString, query) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queriesToBeExcluded = ['sort', 'page', 'limit', 'fields'];

    let queries = { ...this.queryString };
    queriesToBeExcluded.map((item) => {
      if (queries[item]) {
        delete queries[item];
      }
    });
    Object.keys(queries).map((item) => {
      if (item.includes('[')) {
        const field = item.split('[')[0];
        const operator = item.split('[')[1].replace(']', '');
        const value = queries[item];
        const newValue = { [`$${operator}`]: value };
        queries[field] = newValue;
        delete queries[item];
      }
    });

    this.query = this.query.find(queries);
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortedFields = this.queryString['sort'];
      this.query = this.query.sort(sortedFields);
    }
    return this;
  }
  paginate() {
    if (this.queryString.limit) {
      const limit = this.queryString.limit;
      const page = this.queryString.page;
      // const length = await Tour.countDocuments();
      // if (length < page * limit) {
      //   return res.json({ status: 'fail', message: 'Cannot find more tours' });
      // }
      this.query = this.query.limit(limit).skip(limit * (page - 1));
    }
    return this;
  }
  selecting() {
    if (this.queryString.fields) {
      this.query = this.query.select(this.queryString.fields.split(','));
    }
    return this;
  }
}
