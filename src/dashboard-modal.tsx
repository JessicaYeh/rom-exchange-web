import { observer } from "mobx-react";
import * as React from 'react';
const autobind = require('react-autobind');

import { CircularProgress, Button, TextField, InputAdornment, IconButton, Tooltip, ClickAwayListener } from '@material-ui/core';
import Select from 'react-select';
import * as CopyToClipboard from 'react-copy-to-clipboard';

import { API } from './api';
import { NameData } from './item-data';

import styles from './dashboard-modal.module.scss';
import { Styles } from 'react-select/lib/styles';

interface DashboardModalProps {
  items: string[];
  onCreate?: (url: string) => void;
}

interface DashboardModalState {
  selectedOptions: NameOption[];
  loading: boolean;
  dashboardUrl: string;
  showTooltip: boolean;
  showLimitWarning: boolean;
  firstIgnoredItem: string;
  hasCreatedDashboard: boolean;
}

interface NameOption {
  value: string;
  label: string;
}

let nameOptions: NameOption[] = [];
const maxUrlSize = 2000;

const customSelectStyle: Partial<Styles> = {
  valueContainer: (provided) => ({
    ...provided,
    overflowY: "scroll",
    maxHeight: "100px"
  })
};
  
@observer
class DashboardModal extends React.Component<DashboardModalProps, DashboardModalState> {
  constructor(props: DashboardModalProps) {
    super(props);
    autobind(this);
    this.state = {
      selectedOptions: [],
      loading: false,
      dashboardUrl: "",
      showTooltip: false,
      showLimitWarning: false,
      firstIgnoredItem: "",
      hasCreatedDashboard: false
    };
  }

  componentWillMount() {
    if (nameOptions.length === 0){
      this.getNames(() => { this.loadInitialItemsIntoSelect(); });
    } else {
      this.loadInitialItemsIntoSelect();
    }
  }

  render() {
    return (
      <div className={styles["dashboard-modal"]} tabIndex={-1}>
        <h2>My dashboard</h2>
        <div className={styles["progress"]} hidden={!this.state.loading}>
          <CircularProgress color="secondary" />
        </div>
        <div className={this.state.loading ? "" : styles["flex"]} hidden={this.state.loading}>
          <Select className={styles["name-select"]} placeholder="Add some items..." value={this.state.selectedOptions} onChange={this.handleChange} options={nameOptions} isMulti={true} styles={customSelectStyle} autoFocus={true} />
          {this.showCreateButton()}
          {this.showDashboardUrl()}
          <p className={styles["dashboard-limit-warning"]} hidden={!this.state.showLimitWarning}>Your dashboard exceeded the length limit. "{this.state.firstIgnoredItem}" and all following items were ignored.</p>
        </div>
      </div> 
    );
  }

  private showCreateButton() {
    if (!this.state.hasCreatedDashboard) {
      return (
        <Button className={styles["create-dashboard-button"]} onClick={this.createDashboardUrl} variant="contained" color="primary">
          Create dashboard
        </Button>
      );
    }
    return null;
  }

  private showDashboardUrl() {
    if (this.state.hasCreatedDashboard) {
      return (
        <TextField
          variant="outlined"
          margin="normal"
          label="Dashboard URL"
          value={this.state.dashboardUrl}
          className={styles["dashboard-url-input"]}
          InputProps={{
            readOnly: true,
            classes: {
              root: styles["dashboard-url"],
              focused: styles["dashboard-url"],
              notchedOutline: styles["dashboard-url"]
            },
            endAdornment: (
              <InputAdornment position="end">
                <ClickAwayListener onClickAway={this.closeTooltip}>
                    <Tooltip title="Copied!" placement="top" onClose={this.closeTooltip} open={this.state.showTooltip} PopperProps={{ disablePortal: true }} disableFocusListener={true} disableHoverListener={true} disableTouchListener={true}>
                      <CopyToClipboard text={this.state.dashboardUrl} onCopy={this.copyDashboardUrl}>
                        <IconButton color="primary" aria-label="Copy dashboard URL" onClick={this.copyDashboardUrl}>
                          <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 1024" height="24"><path d="M128 768h256v64H128v-64z m320-384H128v64h320v-64z m128 192V448L384 640l192 192V704h320V576H576z m-288-64H128v64h160v-64zM128 704h160v-64H128v64z m576 64h64v128c-1 18-7 33-19 45s-27 18-45 19H64c-35 0-64-29-64-64V192c0-35 29-64 64-64h192C256 57 313 0 384 0s128 57 128 128h192c35 0 64 29 64 64v320h-64V320H64v576h640V768zM128 256h512c0-35-29-64-64-64h-64c-35 0-64-29-64-64s-29-64-64-64-64 29-64 64-29 64-64 64h-64c-35 0-64 29-64 64z"/></svg>
                        </IconButton>
                      </CopyToClipboard>
                    </Tooltip>
                </ClickAwayListener>
              </InputAdornment>
            )
          }}
        />
      );
    }
    return null;
  }

  private handleChange(selectedOptions: any) {
    this.setState({
      selectedOptions,
      hasCreatedDashboard: false,
      showLimitWarning: false
    });
  }

  private getNames(completion?: (names: NameData[]) => void) {
    this.setState({ loading: true });
    API.getNames((names) => {
      nameOptions = this.parseNameData(names);
      this.setState({ loading: false });
      if (completion) {
        completion(names);
      }
    });
  }

  private loadInitialItemsIntoSelect() {
    let selectedOptions: NameOption[] = [];
    if (this.props.items) {
      selectedOptions = nameOptions.filter(nameOption => {
        return !!this.props.items.find(item => {
          return nameOption.value === item.toUpperCase();
        });
      });
    }
    this.setState({ selectedOptions });
  }

  private parseNameData(namesData: NameData[]){
    return namesData.map(nameData => {
      const nameOption: NameOption = {
        value: nameData.name.toUpperCase(),
        label: nameData.name
      };
      return nameOption;
    });
  }

  private createDashboardUrl() {
    let url = encodeURI(window.location.origin + "?q=");
    let hasBrokenLimit = false;
    let firstIgnoredItem = "";

    for (const option of this.state.selectedOptions) {
      const encodedOption = encodeURI(option.label);
      if (url.length <= (maxUrlSize - encodedOption.length)) {
        url += encodedOption + encodeURI("|");
      } else {
        hasBrokenLimit = true;
        firstIgnoredItem = option.label;
        break;
      }
    }

    // Removing extra encoded "|" from the url end, or the "?q=" from end if empty query
    const dashboardUrl = url.substring(0, url.length - 3);

    this.setState({
      dashboardUrl,
      showLimitWarning: hasBrokenLimit,
      firstIgnoredItem,
      hasCreatedDashboard: true
    });
    
    if (this.props.onCreate) {
      this.props.onCreate(dashboardUrl);
    }
  }

  private copyDashboardUrl() {
    this.setState({ showTooltip: true });
  }

  private closeTooltip() {
    this.setState({ showTooltip: false });
  }
}

export default DashboardModal;