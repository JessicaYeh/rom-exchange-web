import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as qs from 'query-string';
const autobind = require('react-autobind');

import {
  AppBar,
  CircularProgress,
  FormControl,
  InputBase,
  InputLabel,
  Select,
  Toolbar,
  MenuItem
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import { API, Range, Server, Sort, Direction, SortOptions } from './api';
import { ItemChart } from './item-chart';
import { ItemData } from './item-data';

import styles from './app.module.scss';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#263238'
    },
    secondary: {
      main: '#ff5722'
    }
  },
  typography: {
    useNextVariants: true,
  },
});

interface AppState {
  itemName: string;
  sortOptions: SortOptions;
  loading: boolean;
}

@observer
class App extends React.Component<any, AppState> {

  @observable items: ItemData[] = [];
  private onDeckItems: ItemData[] = [];
  private page: number = 1;
  private chartOptions = {
    range: Range.Week,
    server: Server.Both
  };
  private typingDelay: NodeJS.Timeout;
  private searchRef: React.RefObject<HTMLInputElement> = React.createRef();

  constructor(props: any) {
    super(props);

    autobind(this);
    this.state = {
      itemName: "",
      sortOptions: {
        range: Range.Week,
        server: Server.Both,
        sort: Sort.Change,
        direction: Direction.Desc
      },
      loading: false
    };
  }

  componentWillMount() {
    const location = this.props.location;
    let queryName = "";
    if (location && location.search) {
      const queryParams = qs.parse(location.search);
      queryName = queryParams["q"] as string || "";
      this.setState({ itemName: queryName });
    }

    this.getData(queryName, this.state.sortOptions);
  }

  componentDidMount() {
    document.addEventListener('scroll', this.onScroll);
    window.addEventListener('blur', this.onWindowBlur);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('blur', this.onWindowBlur);
  }

  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <AppBar>
          <Toolbar className={styles["toolbar"]}>
            <div className={styles["search"]}>
              <div className={styles["search-icon"]}>
                <SearchIcon />
              </div>
              <InputBase
                placeholder="Search…"
                classes={{
                  root: styles["search-root"],
                  input: styles["search-input"]
                }}
                value={this.state.itemName}
                onChange={this.onSearchChange}
                onFocus={this.onSearchFocus}
                inputRef={this.searchRef} />
            </div>
            <FormControl className={styles["select"]}>
              <InputLabel shrink={true} htmlFor="range-select">
                Time
              </InputLabel>
              <Select
                value={this.state.sortOptions.range}
                onChange={this.onRangeChange}
                inputProps={{
                  name: "range",
                  id: "range-select"
                }}
              >
                <MenuItem value={Range.All}>{Range.All}</MenuItem>
                <MenuItem value={Range.Month}>{Range.Month}</MenuItem>
                <MenuItem value={Range.Week}>{Range.Week}</MenuItem>
              </Select>
            </FormControl>
            <FormControl className={styles["select"]}>
              <InputLabel shrink={true} htmlFor="server-select">
                Server
              </InputLabel>
              <Select
                value={this.state.sortOptions.server}
                onChange={this.onServerChange}
                inputProps={{
                  name: "server",
                  id: "server-select"
                }}
              >
                <MenuItem value={Server.Both}>{Server.Both}</MenuItem>
                <MenuItem value={Server.Global}>{Server.Global}</MenuItem>
                <MenuItem value={Server.SEA}>{Server.SEA}</MenuItem>
              </Select>
            </FormControl>
            <FormControl className={styles["select"]}>
              <InputLabel shrink={true} htmlFor="sort-select">
                Sort
              </InputLabel>
              <Select
                value={this.state.sortOptions.sort + this.state.sortOptions.direction}
                onChange={this.onSortChange}
                inputProps={{
                  name: "sort",
                  id: "sort-select"
                }}
              >
                <MenuItem value={Sort.Change+Direction.Desc}>Price change ↑</MenuItem>
                <MenuItem value={Sort.Change+Direction.Asc}>Price change ↓</MenuItem>
                <MenuItem value={Sort.Diff+Direction.Asc}>Global > SEA</MenuItem>
                <MenuItem value={Sort.Diff+Direction.Desc}>SEA > Global</MenuItem>
              </Select>
            </FormControl>
          </Toolbar>
        </AppBar>
        <div className={styles["progress"]} hidden={!this.state.loading}>
          <CircularProgress color="secondary" />
        </div>
        <div id="app" className={styles["app"]}>{this.renderItemCharts()}</div>
      </MuiThemeProvider>
    );
  }

  private renderItemCharts(): JSX.Element[] {
    return this.items.map((item, i) => {
      return <ItemChart key={i} data={item} range={this.chartOptions.range} server={this.chartOptions.server} />;
    });
  }

  private onScroll() {
    const wrappedElement = document.getElementById('app') as HTMLElement;
    const atBottom = wrappedElement.getBoundingClientRect().bottom - 500 <= window.innerHeight;
    if (atBottom) {
      this.insertOnDeckItems();
    }
  }

  private onWindowBlur() {
    if (this.searchRef.current) {
      this.searchRef.current.blur();
    }
  }

  private searchByName(itemName: string, delay: number = 500) {
    this.setState({ itemName });
    const history = this.props.history;
    history.replace(itemName ? `?q=${itemName}` : "");

    if (this.typingDelay) {
      clearTimeout(this.typingDelay);
    }
    this.typingDelay = setTimeout(() => {
      this.getData(itemName, this.state.sortOptions);
    }, delay);
  }

  private onSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.searchByName(event.target.value);
  }

  private onSearchFocus() {
    if (this.state.itemName) {
      this.setState({ itemName: "" });
      this.searchByName("", 1000);
    }
  }

  private onRangeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const sortOptions = {
      ...this.state.sortOptions,
      range: Range[event.target.value],
    };
    this.setState({ sortOptions });
    this.getData(this.state.itemName, sortOptions);
  }

  private onServerChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const sortOptions = {
      ...this.state.sortOptions,
      server: Server[event.target.value],
    };
    this.setState({ sortOptions });
    this.getData(this.state.itemName, sortOptions);
  }

  private onSortChange(event: React.ChangeEvent<HTMLSelectElement>) {
    // Split an option like 'DiffAsc' -> ['Diff', 'Asc']
    const sortParts = event.target.value.replace(/([A-Z])/g, ' $1').trim().split(' ');
    const sortOptions = {
      ...this.state.sortOptions,
      sort: Sort[sortParts[0]],
      direction: Direction[sortParts[1]],
    };
    this.setState({ sortOptions });
    this.getData(this.state.itemName, sortOptions);
  }

  private getData(item: string, sort: SortOptions) {
    this.setState({ loading: true });

    this.page = 1;
    this.onDeckItems = [];
    API.getData({ item, sort, page: this.page }, (items) => {
      this.setState({ loading: false });
      this.items = []; // Need to first clear out array due to bug in chart.js, crashes in some cases
      this.chartOptions = {
        range: this.state.sortOptions.range,
        server: this.state.sortOptions.server
      };
      this.items = items;
      this.getOnDeckData(item, sort);
    });
  }

  private getOnDeckData(item: string, sort: SortOptions) {
    this.page++;
    API.getData({ item, sort, page: this.page }, (onDeckItems) => {
      this.onDeckItems = onDeckItems;
    });
  }

  private insertOnDeckItems() {
    if (this.onDeckItems.length > 0) {
      this.items = this.items.concat(this.onDeckItems);
      this.onDeckItems = [];
      this.getOnDeckData(this.state.itemName, this.state.sortOptions);
    }
  }

}

export default App;
