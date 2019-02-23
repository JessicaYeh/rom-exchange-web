import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as qs from 'query-string';
const autobind = require('react-autobind');

import {
  AppBar,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputBase,
  InputLabel,
  Select,
  Toolbar,
  MenuItem,
  Tooltip,
  Modal
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import DashboardIcon from '@material-ui/icons/Dashboard';
import BookIcon from '@material-ui/icons/LocalLibraryOutlined';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import { API, Range, Server, Sort, Direction, SortOptions, ItemType } from './api';
import { ItemChart } from './item-chart';
import { ItemData } from './item-data';

import styles from './app.module.scss';
import DashboardModal from './dashboard-modal';

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
  itemType: ItemType;
  sortOptions: SortOptions;
  loading: boolean;
  openDashboardModal: boolean;
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

  get searchQueryParam(): string {
    const location = this.props.location;
    let queryParam = "";
    if (location && location.search) {
      const queryParams = qs.parse(location.search);
      queryParam = queryParams["q"] as string || "";
    }
    return queryParam;
  }

  get exactQueryParam(): boolean {
    const location = this.props.location;
    let exact = false;
    if (location && location.search) {
      const queryParams = qs.parse(location.search);
      const queryParam = (queryParams["exact"] as string || "").toLowerCase();
      exact = queryParam === "true" || queryParam === "1";
    }
    return exact;
  }

  constructor(props: any) {
    super(props);

    autobind(this);
    this.state = {
      itemName: "",
      itemType: ItemType.All,
      sortOptions: {
        range: Range.Week,
        server: Server.Both,
        sort: Sort.Change,
        direction: Direction.Desc
      },
      loading: false,
      openDashboardModal: false
    };
  }

  componentWillMount() {
    const itemName = this.searchQueryParam;
    this.setState({ itemName });
    this.getData(itemName, this.state.itemType, this.state.sortOptions, this.exactQueryParam);
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
              <InputLabel shrink={true} htmlFor="type-select">
                Type
              </InputLabel>
              <Select
                value={this.state.itemType}
                onChange={this.onTypeChange}
                inputProps={{
                  name: "type",
                  id: "type-select"
                }}
              >
                {
                  Object.keys(ItemType).filter(key => !isNaN(Number(ItemType[key]))).map((type) => {
                    return <MenuItem key={type} value={ItemType[type]}>{type}</MenuItem>;
                  })
                }
              </Select>
            </FormControl>
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
            <Tooltip title="Create Dashboard">
              <IconButton aria-label="Create Dashboard" onClick={this.openDashboardModal}>
                <DashboardIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <div className={styles["progress"]} hidden={!this.state.loading}>
          <CircularProgress color="secondary" />
        </div>
        <div id="app" className={styles["app"]}>
          <div>
            <Button
              variant="text"
              color="primary"
              size="medium"
              href="https://discordapp.com/api/oauth2/authorize?client_id=547087521968947211&permissions=2048&scope=bot"
              target="_blank">
                <svg className={styles["button-icon"]} aria-hidden="true" focusable="false" data-prefix="fab" data-icon="discord" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" height="24"><path fill="currentColor" d="M297.216 243.2c0 15.616-11.52 28.416-26.112 28.416-14.336 0-26.112-12.8-26.112-28.416s11.52-28.416 26.112-28.416c14.592 0 26.112 12.8 26.112 28.416zm-119.552-28.416c-14.592 0-26.112 12.8-26.112 28.416s11.776 28.416 26.112 28.416c14.592 0 26.112-12.8 26.112-28.416.256-15.616-11.52-28.416-26.112-28.416zM448 52.736V512c-64.494-56.994-43.868-38.128-118.784-107.776l13.568 47.36H52.48C23.552 451.584 0 428.032 0 398.848V52.736C0 23.552 23.552 0 52.48 0h343.04C424.448 0 448 23.552 448 52.736zm-72.96 242.688c0-82.432-36.864-149.248-36.864-149.248-36.864-27.648-71.936-26.88-71.936-26.88l-3.584 4.096c43.52 13.312 63.744 32.512 63.744 32.512-60.811-33.329-132.244-33.335-191.232-7.424-9.472 4.352-15.104 7.424-15.104 7.424s21.248-20.224 67.328-33.536l-2.56-3.072s-35.072-.768-71.936 26.88c0 0-36.864 66.816-36.864 149.248 0 0 21.504 37.12 78.08 38.912 0 0 9.472-11.52 17.152-21.248-32.512-9.728-44.8-30.208-44.8-30.208 3.766 2.636 9.976 6.053 10.496 6.4 43.21 24.198 104.588 32.126 159.744 8.96 8.96-3.328 18.944-8.192 29.44-15.104 0 0-12.8 20.992-46.336 30.464 7.68 9.728 16.896 20.736 16.896 20.736 56.576-1.792 78.336-38.912 78.336-38.912z"/></svg>
                Discord Bot
            </Button>
            <Button
              variant="text"
              color="primary"
              size="medium"
              href="https://github.com/JessicaYeh/rom-exchange-web"
              target="_blank">
                <svg className={styles["button-icon"]} aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" height="24"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>
                GitHub
            </Button>
            <Button
              variant="text"
              color="primary"
              size="medium"
              href="https://jessicayeh.github.io/rom-exchange-openapi/"
              target="_blank">
              <BookIcon className={styles["button-icon"]} />
              API Docs
            </Button>
          </div>
          <Modal open={this.state.openDashboardModal} onClose={this.closeDashboardModal}>
            <DashboardModal />   
          </Modal>
          {this.renderItemCharts()}
        </div>
      </MuiThemeProvider>
    );
  }

  private renderItemCharts(): JSX.Element[] | JSX.Element | null {
    const { itemName, itemType } = this.state;
    if (this.items.length > 0) {
      return this.items.map((item, i) => {
        return <ItemChart key={i} data={item} range={this.chartOptions.range} server={this.chartOptions.server} />;
      });
    } else if (!this.state.loading) {
      const emptyMessage = (itemType === ItemType.All) ?
        `No results found for "${itemName}".` :
        `No results found for "${itemName}" under the "${ItemType[itemType]}" type.`;
      return <div className={styles["message"]}>{emptyMessage}</div>;
    } else {
      return null;
    }
  }

  private scrollToTop() {
    window.scrollTo(0, 0);
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

    this.setState({ loading: true });
    this.typingDelay = setTimeout(() => {
      this.getData(itemName, this.state.itemType, this.state.sortOptions, this.exactQueryParam);
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
    this.getData(this.state.itemName, this.state.itemType, sortOptions, this.exactQueryParam);
  }

  private onTypeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const itemType = parseInt(event.target.value, 10);
    this.setState({ itemType });
    this.getData(this.state.itemName, itemType, this.state.sortOptions, this.exactQueryParam);
  }

  private onServerChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const sortOptions = {
      ...this.state.sortOptions,
      server: Server[event.target.value],
    };
    this.setState({ sortOptions });
    this.getData(this.state.itemName, this.state.itemType, sortOptions, this.exactQueryParam);
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
    this.getData(this.state.itemName, this.state.itemType, sortOptions, this.exactQueryParam);
  }

  private getData(item: string, type: ItemType, sort: SortOptions, exact: boolean) {
    this.setState({ loading: true });

    this.page = 1;
    this.onDeckItems = [];
    API.getData({ item, type, sort, page: this.page, exact }, (items) => {
      this.scrollToTop();
      this.setState({ loading: false });
      this.items = []; // Need to first clear out array due to bug in chart.js, crashes in some cases
      this.chartOptions = {
        range: this.state.sortOptions.range,
        server: this.state.sortOptions.server
      };
      this.items = items;
      this.getOnDeckData(item, type, sort, exact);
    });
  }

  private getOnDeckData(item: string, type: ItemType, sort: SortOptions, exact: boolean) {
    this.page++;
    API.getData({ item, type, sort, page: this.page, exact }, (onDeckItems) => {
      this.onDeckItems = onDeckItems;
    });
  }

  private insertOnDeckItems() {
    if (this.onDeckItems.length > 0) {
      this.items = this.items.concat(this.onDeckItems);
      this.onDeckItems = [];
      this.getOnDeckData(this.state.itemName, this.state.itemType, this.state.sortOptions, this.exactQueryParam);
    }
  }

  private openDashboardModal() {
    this.setState({ openDashboardModal: true });
  }

  private closeDashboardModal() {
    this.setState({ openDashboardModal: false });
  }

}

export default App;
