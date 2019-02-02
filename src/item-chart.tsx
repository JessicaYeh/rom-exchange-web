import * as React from 'react';
import { Line as LineChart } from 'react-chartjs-2';
import { Chart, ScaleType, TimeUnit, ChartTooltipItem, PositionType, ChartData, ChartDataSets } from 'chart.js';
import { uniq } from 'lodash';
import * as moment from 'moment';
const autobind = require('react-autobind');

import { ItemData, DataPoint, ServerData, RangeData } from './item-data';
import { Range, Server } from './api';

import styles from './item-chart.module.scss';

interface ItemChartProps {
  data: ItemData;
  range: Range;
  server: Server;
}

export class ItemChart extends React.Component<ItemChartProps, {}> {

  private SNAP_COLOR = "rgb(255,245,157)";
  private GLOBAL_COLOR = "rgb(46,125,50)";
  private SEA_COLOR = "rgb(13,71,161)";
  private GLOBAL_FILL_COLOR = "rgba(102,187,106,0.2)";
  private SEA_FILL_COLOR = "rgba(92,107,192,0.2)";

  private chartOptions = {
    maintainAspectRatio: false,
    responsive: false,
    legend: {
      display: false
    },
    tooltips: {
      mode: "index" as Chart.InteractionMode,
      callbacks: {
        title: (tooltipItems: ChartTooltipItem[]) => {
          return moment(tooltipItems[0].xLabel).format('MMM D');
        },
        label: (tooltipItem: ChartTooltipItem, data: ChartData) => {
          const datasetIndex = tooltipItem.datasetIndex as number;
          const datasets = data.datasets as ChartDataSets[];
          const datasetLabel = datasets[datasetIndex].label as string;
          const value = parseInt(tooltipItem.yLabel as string, 10);
          return datasetLabel + ": " + value.toLocaleString() + " Z";
        },
        afterLabel: (tooltipItem: ChartTooltipItem, data: ChartData) => {
          const datasetIndex = tooltipItem.datasetIndex as number;
          const index = tooltipItem.index as number;
          const datasets = data.datasets as ChartDataSets[];
          const pointBackgroundColor = datasets[datasetIndex].pointBackgroundColor as string[];
          return (pointBackgroundColor[index] === this.SNAP_COLOR ? "  Open Bet" : "");
        }
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 4,
        hitRadius: 20,
        strokeWidth: 1,
      }
    },
    layout: {
      padding: {
        top: 8,
      }
    },
    scales: {
      xAxes: [{
        type: 'time' as ScaleType,
        distribution: 'linear' as any,
        time: {
          unit: 'day' as TimeUnit
        },
        ticks: {
          maxRotation: 0
        }
      }],
      yAxes: [{
        display: false,
        position: 'right' as PositionType,
        ticks: {
          callback: (value: number) => {
            if (value < 1000) {
              return value;
            } else {
              return parseFloat((value/1000.0).toPrecision(2)).toFixed() + "K";
            }
          }
        }
      }]
    }
  };

  constructor(props: ItemChartProps) {
    super(props);

    const defaults = Chart.defaults;
    defaults.scale.gridLines.display = false;

    autobind(this);
  }

  render() {
    return <div className={styles["item-chart"]}>
      <p className={styles["item-name"]}>{this.props.data.name.replace("*", "★")}</p>
      { this.props.server !== Server.SEA ? this.renderServerPriceAndChange(Server.Global) : null }
      { this.props.server !== Server.Global ? this.renderServerPriceAndChange(Server.SEA) : null }
      <LineChart data={this.chartData} options={this.chartOptions} width={300} height={150} />
    </div>;
  }

  private renderServerPriceAndChange(server: Server): JSX.Element {
    const latest = this.serverData(server).latest.toLocaleString();
    const change = this.serverRangeData(server).change;
    let changeColor = "";
    if (change > 0) {
      changeColor = styles["increase"];
    } else if (change < 0) {
      changeColor = styles["decrease"];
    }

    return (
      <div className={styles["server"]}>
        <span className={[styles["server-name"], styles[server.toLowerCase()]].join(" ")}>{server}</span>
        <span className={styles["server-price"]}>{`${latest} Z`}</span>
        <span className={[styles["server-change"], changeColor].join(" ")}>{(change > 0 ? "+" : "") + change + "%"}</span>
      </div>
    );
  }

  private chartData() {
    const labels: string[] = this.labelsForChart();
    const datasets = [];
    
    if (this.props.server !== Server.SEA) {
      const dataPoints = this.dataForChart(Server.Global, labels);
      const data = dataPoints.map((point) => !!point ? point.price : null);
      const pointBackgroundColor = dataPoints.map((point) => !!point && point.snap ? this.SNAP_COLOR : this.GLOBAL_COLOR);
      datasets.push({
        label: Server.Global,
        borderWidth: 2,
        backgroundColor: this.GLOBAL_FILL_COLOR,
        borderColor: this.GLOBAL_COLOR,
        pointBackgroundColor,
        data
      });
    }
    if (this.props.server !== Server.Global) {
      const dataPoints = this.dataForChart(Server.SEA, labels);
      const data = dataPoints.map((point) => !!point ? point.price : null);
      const pointBackgroundColor = dataPoints.map((point) => !!point && point.snap ? this.SNAP_COLOR : this.SEA_COLOR);
      datasets.push({
        label: Server.SEA,
        borderWidth: 2,
        backgroundColor: this.SEA_FILL_COLOR,
        borderColor: this.SEA_COLOR,
        pointBackgroundColor,
        data
      });
    }

    return { labels, datasets };
  }

  private serverData(server: Server): ServerData {
    let serverData: ServerData;
    if (server === Server.Global) {
      serverData = this.props.data.global;
    } else {
      serverData = this.props.data.sea;
    }
    return serverData;
  }

  private serverRangeData(server: Server): RangeData {
    const serverData = this.serverData(server);
    if (this.props.range === Range.Week) {
      return serverData.week;
    } else if (this.props.range === Range.Month) {
      return serverData.month;
    } else {
      return serverData.all;
    }
  }

  private zeroHMS(datetime: Date): Date {
    datetime.setHours(0);
    datetime.setMinutes(0);
    datetime.setSeconds(0);
    return datetime;
  }

  private labelsForChart(): string[] {
    const globalData = this.props.server !== Server.SEA ? this.serverRangeData(Server.Global).data : [];
    const seaData = this.props.server !== Server.Global ? this.serverRangeData(Server.SEA).data : [];

    const globalTimes = globalData.map((point) => this.zeroHMS(point.time).toISOString());
    const seaTimes = seaData.map((point) => this.zeroHMS(point.time).toISOString());

    return uniq(globalTimes.concat(seaTimes)).sort();
  }

  private dataForChart(server: Server, labels: string[]): Array<DataPoint | null> {
    const serverData = this.serverRangeData(server).data;
    let dataIndex = 0;
    const paddedDataPoints = labels.map((time) => {
      if (dataIndex === serverData.length) {
        return null;
      }
      const current = serverData[dataIndex];
      if (time === this.zeroHMS(current.time).toISOString()) {
        dataIndex++;
        return current;
      } else {
        return null;
      }
    });
    return paddedDataPoints;
  }
}
