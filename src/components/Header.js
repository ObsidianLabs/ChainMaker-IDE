import React, { PureComponent } from 'react';
import headerActions, { AuthModal, Header, NavGuard } from '@obsidians/header';

import { BaseProjectManager } from '@obsidians/workspace';
import { IpcChannel } from '@obsidians/ipc';
import { List } from 'immutable';
import { actions } from '@obsidians/workspace';
import chainmakerSDK from '@obsidians/chainmaker-sdk';
import { connect } from '@obsidians/redux';
import { createProject } from '../lib/bsn';
import keypairManager from '@obsidians/keypair';
import { networkManager } from '@obsidians/network';

keypairManager.kp = chainmakerSDK.kp;
networkManager.addSdk(chainmakerSDK, chainmakerSDK.networks);
networkManager.addSdk(chainmakerSDK, chainmakerSDK.customNetworks);

class HeaderWithRedux extends PureComponent {
  state = {
    interval: null,
    customNetworkGroup: [],
  };

  componentDidMount() {
    actions.history = this.props.history;
    headerActions.history = this.props.history;
    this.navGuard = new NavGuard(this.props.history);
  }

  async updateCustomNetwork() {
    const customeNetworkMap = this.props.customNetworks.toJS();
    const mapKeys = Object.keys(customeNetworkMap);
    const currentNetworkNames = networkManager.networks.map(
      (item) => item.name
    );

    const filteredKeys = mapKeys.reduce((prev, cur) => {
      if (!currentNetworkNames.includes(cur)) {
        prev.push(cur);
      }
      return prev;
    }, []);
    if (!filteredKeys.length) return;
    this.customNetworkGroup = filteredKeys
      .map((keys) => ({
        group: 'others',
        icon: 'fas fa-vial',
        id: 'custom',
        ...customeNetworkMap[keys],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    networkManager.addSdk(chainmakerSDK, this.customNetworkGroup);
  }

  async getNetworks() {
    try {
      const ipc = new IpcChannel('bsn');
      const projects = await ipc.invoke('projects', { chain: 'eth' });
      const remoteNetworks = projects.map((project) => {
        const url = project.endpoints?.find((endpoint) =>
          endpoint.startsWith('http')
        );
        return {
          id: `bsn_${project.id}`,
          group: 'BSN',
          name: `${project.network.name}/${project.name}`,
          // name: `${project.network.name}`,
          fullName: `${project.network.name} - ${project.name}`,
          icon: 'fas fa-globe',
          notification: `Switched to <b>${project.network.name}</b>.`,
          url,
          chainId: project.id,
          projectKey: project.key,
          symbol: 'ETH',
          raw: project,
        };
      });
      networkManager.addSdk(chainmakerSDK, remoteNetworks);
      this.setNetwork({ redirect: false, notify: false });
    } catch (error) {
      networkManager.networks = [];
    }
  }

  setNetwork(options) {
    if (!networkManager.network && networkManager.networks.length) {
      networkManager.setNetwork(networkManager.networks[0], options);
    }
  }

  groupedNetworks = (networksByGroup) => {
    const networkList = [];
    const groups = networksByGroup.toJS();
    const keys = Object.keys(groups);
    keys.forEach((key, index) => {
      if (key !== 'default') {
        networkList.push({ header: key });
      }
      groups[key].forEach((network) => networkList.push(network));
      if (index !== keys.length - 1) {
        networkList.push({ divider: true });
      }
    });
    return networkList;
  };

  setCreateProject = () => {
    const cp = async function (params) {
      return await createProject.call(
        this,
        {
          networkManager,
          bsnChannel: new IpcChannel('bsn'),
          projectChannel: BaseProjectManager.channel,
        },
        params
      );
    };
    return process.env.DEPLOY === 'bsn' && cp;
  };

  renderLogo() {
    if (process.env.REACT_APP_LOGO) {
      return (
        <div
          className="d-flex align-items-center"
          style={{ margin: '7px 17px' }}
        >
          <img
            src={require(process.env.REACT_APP_LOGO).default}
            style={{ background: 'transparent', height: '100%' }}
            alt="logo"
          />
        </div>
      );
    }
    return null;
  }

  render() {
    this.updateCustomNetwork();
    console.debug('[render] HeaderWithRedux');

    const { uiState, profile, projects, contracts, accounts, network } =
      this.props;
    const selectedProject = projects.get('selected')?.toJS() || {};

    const networkList = List(networkManager.networks);
    const networkGroups = networkList.groupBy((n) => n.group);
    const groupedNetworks = this.groupedNetworks(networkGroups);
    const selectedNetwork = networkList.find((n) => n.id === network) || {};

    const starred = accounts.getIn([network, 'accounts'])?.toJS() || [];
    const starredContracts =
      contracts.getIn([network, 'starred'])?.toJS() || [];
    const selectedContract = contracts.getIn([network, 'selected']) || '';
    const selectedAccount = accounts.getIn([network, 'selected']) || '';

    return (
      <Header
        profile={profile}
        projects={projects}
        selectedProject={selectedProject}
        selectedContract={selectedContract}
        selectedAccount={selectedAccount}
        starred={starred}
        starredContracts={starredContracts}
        network={selectedNetwork}
        networkList={groupedNetworks}
        AuthModal={AuthModal}
        createProject={this.setCreateProject()}
        logo={this.renderLogo()}
      />
    );
  }
}

export default connect([
  'uiState',
  'profile',
  'projects',
  'contracts',
  'accounts',
  'network',
  'customNetworks',
])(HeaderWithRedux);
