import { observer } from "mobx-react";
import * as React from 'react';
const autobind = require('react-autobind');

import { CircularProgress, Button, TextField, InputAdornment, IconButton, Tooltip, ClickAwayListener } from '@material-ui/core';
import Select from 'react-select';
import * as CopyToClipboard from 'react-copy-to-clipboard';

import { API } from './api';
import { NameData } from './item-data';

import styles from './app.module.scss';
import { Styles } from 'react-select/lib/styles';

interface ModalState {
  selectedOptions: any;
  loading: boolean;
  dashboardUrl: string;
  showTooltip: boolean;
}

interface NameOption {
  value: string;
  label: string;
}

let nameOptions: NameOption[] = [];

const customSelectStyle: Partial<Styles> = {
  valueContainer: (provided) => ({
    ...provided,
    overflowY: "scroll",
    maxHeight: "100px"
  })
};
  
@observer
class DashboardModal extends React.Component<any, ModalState> {
  constructor(props: any) {
    super(props);
    autobind(this);
    this.state = {
      selectedOptions: null,
      loading: false,
      dashboardUrl: "",
      showTooltip: false
    };
  }

  componentWillMount() {
    if (nameOptions.length === 0){
      this.getNames();
    }
  }

  render() {
    return (
      <div className={styles["dashboardModal"]}>
        <h2>New Dashboard</h2>
        <Select className={styles["nameSelect"]} placeholder="Add items for your dashboard" value={this.state.selectedOptions} onChange={this.handleChange} options={nameOptions} isMulti={true} styles={customSelectStyle} />
        <Button onClick={this.createDashboardUrl} className={styles["createDashboardButton"]} variant="contained" color="primary">
          Create Dashboard
        </Button>
        <TextField
          variant="outlined"
          margin="normal"
          label="Dashboard URL"
          value={this.state.dashboardUrl}
          InputProps={{
            readOnly: true,
            classes: {
              root: styles["dashboardUrl"],
              focused: styles["dashboardUrl"],
              notchedOutline: styles["dashboardUrl"]
            },
            endAdornment: (
              <InputAdornment position="end">
                <ClickAwayListener onClickAway={this.closeTooltip}>
                  <div>
                    <Tooltip title="Copied!" placement="top" onClose={this.closeTooltip} open={this.state.showTooltip} PopperProps={{ disablePortal: true }} disableFocusListener={true} disableHoverListener={true} disableTouchListener={true}>
                      <CopyToClipboard text={this.state.dashboardUrl} onCopy={this.copyDashboardUrl}>
                        <IconButton color="primary" aria-label="Copy dashboard URL" onClick={this.copyDashboardUrl}>
                          <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 1024" height="24"><path d="M128 768h256v64H128v-64z m320-384H128v64h320v-64z m128 192V448L384 640l192 192V704h320V576H576z m-288-64H128v64h160v-64zM128 704h160v-64H128v64z m576 64h64v128c-1 18-7 33-19 45s-27 18-45 19H64c-35 0-64-29-64-64V192c0-35 29-64 64-64h192C256 57 313 0 384 0s128 57 128 128h192c35 0 64 29 64 64v320h-64V320H64v576h640V768zM128 256h512c0-35-29-64-64-64h-64c-35 0-64-29-64-64s-29-64-64-64-64 29-64 64-29 64-64 64h-64c-35 0-64 29-64 64z"/></svg>
                        </IconButton>
                      </CopyToClipboard>
                    </Tooltip>
                  </div>
                </ClickAwayListener>
              </InputAdornment>
            )
          }}
          InputLabelProps={{
            FormLabelClasses: {
              root: styles["dashboardUrl"],
              focused: styles["dashboardUrl"]
            }
          }}
        />
        <div className={styles["progress"]} hidden={!this.state.loading}>
          <CircularProgress color="secondary" />
        </div>
      </div> 
    );
  }

  private handleChange(selectedOptions: any) {
    this.setState({ selectedOptions });
  }

  private getNames() {
    this.setState({ loading: true });
    API.getNames((names) => {
      nameOptions = this.parseNameData(names);
      this.setState({ loading: false });
    });
  }

  private parseNameData(namesData: NameData[]){
    return namesData.map(nameData => {
      const nameOption: NameOption = {
        value: nameData.name,
        label: nameData.name
      };
      return nameOption;
    });
  }

  private createDashboardUrl() {
    let url = window.location.origin + "?q=";
    for (const option of this.state.selectedOptions) {
      url += option.value + "|";
    }
    this.setState({ dashboardUrl: url.substring(0, url.length - 1) });
  }

  private copyDashboardUrl() {
    this.setState({ showTooltip: true });
  }

  private closeTooltip() {
    this.setState({ showTooltip: false });
  }
}

export default DashboardModal;