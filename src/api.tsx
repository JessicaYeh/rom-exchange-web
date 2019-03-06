import { ItemData, ServerData, DataPoint, RangeData, NameData } from './item-data';

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

export enum ItemType {
  "All" = 0,
  "Weapons" = 1,
  "Off-hand" = 2,
  "Armors" = 3,
  "Garments" = 4,
  "Footgears" = 5,
  "Accessory" = 6,
  "Blueprint" = 7,
  "Potion / Effect" = 8,
  "Refine" = 9,
  // "Scroll / Album" = 10,
  "Material" = 11,
  "Holiday material" = 12,
  "Pet material" = 13,
  "Premium" = 14,
  // "Costume" = 15,
  "Head" = 16,
  "Face" = 17,
  "Back" = 18,
  "Mouth" = 19,
  "Tail" = 20,
  "Weapon card" = 21,
  "Off-hand card" = 22,
  "Armor card" = 23,
  "Garments card" = 24,
  "Shoe card" = 25,
  "Accessory card" = 26,
  "Headwear card" = 27
}

export interface SortOptions {
  sort: Sort;
  direction: Direction;
  server: Server;
  range: Range;
}

export interface QueryOptions {
  item?: string;
  type?: ItemType;
  sort?: SortOptions;
  page?: number;
  exact?: boolean;
}

export class API {
  static getData(query: QueryOptions, completion: (items: ItemData[]) => void) {
    const promise = window.location.hostname === 'www.romexchange.com' ?
      request({
        uri: 'https://www.romexchange.com/api',
        qs: {
          exact: query.exact,
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

  static getNames(completion: (names: NameData[]) => void) {
    const promise = window.location.hostname === 'www.romexchange.com' ?
      request({
        uri: 'https://www.romexchange.com/items.json',
        json: true
      }) :
      new Promise((resolve) => {
        setTimeout(() => {
          const mocknames = require('./mocknames.json');
          resolve(mocknames);
        }, 500);
      });
    promise.then((response: any) => {
      const names = this.parseNamesJSON(response);
      completion(names);
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
    const localTime = new Date(dataPointJSON['time']);
    const utcTime = new Date(localTime.getTime() + localTime.getTimezoneOffset()*60000);

    return {
      time: utcTime,
      price: dataPointJSON['price'],
      snap: dataPointJSON['snap']
    };
  }

  private static parseNamesJSON(namesJSON: []): NameData[] {
    return namesJSON.map((name: {}) => this.parseNameJSON(name));
  }

  private static parseNameJSON(nameJSON: {}): NameData {
    return {
      name: nameJSON['name'],
      type: nameJSON['type']
    };
  }
}
