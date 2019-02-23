export interface ItemData {
    name: string;
    type: number;
    image: string;
    globalSeaDiff: number;
    global: ServerData;
    sea: ServerData;
}

export interface ServerData {
    all: RangeData;
    month: RangeData;
    week: RangeData;
    latest: number;
}

export interface RangeData {
    data: DataPoint[];
    change: number;
}

export interface NameData {
    name: string;
    type: number;
}

export interface DataPoint {
    time: Date;
    price: number;
    snap: boolean;
}