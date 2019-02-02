import { ItemData, ServerData, DataPoint, RangeData } from './item-data';

const request = require('request-promise');

export enum Sort {
  Change = "Change",
  Diff = "Diff"
}

export enum Direction {
  Asc = "Asc",
  Desc = "Desc"
}

export enum Server {
  Both = "Both",
  Global = "Global",
  SEA = "SEA"
}

export enum Range {
  All = "All",
  Month = "Month",
  Week = "Week"
}

export interface SortOptions {
  sort: Sort;
  direction: Direction;
  server: Server;
  range: Range;
}

export interface QueryOptions {
  item?: string;
  type?: number;
  sort?: SortOptions;
  page?: number;
}

export class API {
  static getData(query: QueryOptions, completion: (items: ItemData[]) => void) {
    const promise = window.location.hostname === 'www.romexchange.com' ?
      request({
        uri: 'https://www.romexchange.com/api',
        qs: {
          item: query.item,
          type: query.type,
          page: query.page,
          sort: query.sort ? query.sort.sort : undefined,
          sort_dir: query.sort ? query.sort.direction : undefined,
          sort_server: query.sort ? query.sort.server : undefined,
          sort_range: query.sort ? query.sort.range : undefined
        },
        json: true
      }) :
      new Promise((resolve) => {
        setTimeout(() => {
          const mockdata = require('./mockdata.json');
          resolve(mockdata);
        }, 500);
      });
    promise.then((response: any) => {
      const items = this.parseItemsJSON(response);
      completion(items);
    });
  }

  private static parseItemsJSON(itemsJSON: []): ItemData[] {
    return itemsJSON.map((item: {}) => this.parseItemJSON(item));
  }

  private static parseItemJSON(itemJSON: {}): ItemData {
    return {
      name: itemJSON['name'],
      type: itemJSON['type'],
      image: itemJSON['image'],
      globalSeaDiff: itemJSON['global_sea_diff'],
      global: this.parseServerJSON(itemJSON['global']),
      sea: this.parseServerJSON(itemJSON['sea'])
    };
  }

  private static parseServerJSON(serverJSON: {}): ServerData {
    return {
      all: this.parseRangeJSON(serverJSON['all']),
      month: this.parseRangeJSON(serverJSON['month']),
      week: this.parseRangeJSON(serverJSON['week']),
      latest: serverJSON['latest']
    };
  }

  private static parseRangeJSON(rangeJSON: {}): RangeData {
    return {
      data: rangeJSON['data'].map((dataPoint: {}) => this.parseDataPointJSON(dataPoint)),
      change: rangeJSON['change']
    };
  }

  private static parseDataPointJSON(dataPointJSON: {}): DataPoint {
    return {
      time: new Date(dataPointJSON['time']),
      price: dataPointJSON['price'],
      snap: dataPointJSON['snap']
    };
  }
}
