import React, { useState, useEffect, useCallback } from "react";

import { utils } from 'near-api-js';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, message, Table, Button, Breadcrumb, Tabs, ConfigProvider, Empty } from "antd";
import { 
  LeftOutlined, DribbbleOutlined, RightOutlined, SelectOutlined, CopyOutlined,
  GithubOutlined, EditOutlined, CodeOutlined, UserOutlined, UpOutlined, DownOutlined, LinkOutlined
} from "@ant-design/icons";

import { Link } from 'react-router-dom';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import classnames from 'classnames';

import TokenBadge from "../../components/TokenBadge";
import Status from "../../components/Status";

import styles from './styles.less';
import {readableAppchain} from '../../utils';

function Appchain(): React.ReactElement {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [appchain, setAppchain] = useState<any>();

  const [isLoadingValidators, setIsLoadingValidators] = useState<boolean>(false);
  const [currValidatorSetIdx, setCurrValidatorSetIdx] = useState<number>(0);
  const [appchainValidatorIdex, setAppchainValidatorIdx] = useState<number>(0);
  const [validatorSet, setValidatorSet] = useState<any>();

  const columns = [
    {
      title: "Account",
      dataIndex: "account_id",
      render: (text) => {
        return (
          <a href={`https://explorer.testnet.near.org/accounts/${text}`}>
            <span style={{ position: "absolute", transform: "rotate(90deg)" }}><SelectOutlined /></span>
            <span style={{ marginLeft: "20px" }}>{text}</span>
          </a>
        );
      }
    },
    {
      title: "Appchain Validator Id",
      dataIndex: "id",
      key: "id",
      render: (text) => {
        return (
          <CopyToClipboard text={text} onCopy={() => message.info('Validator Id Copied!')}>
          <div style={{ cursor: "pointer" }}>
            <span>{text.substr(0,10)}...{text.substr(-10)}</span>
            <span style={{ marginLeft: "5px", color: "#aaa" }}><CopyOutlined /></span>
          </div>
          </CopyToClipboard>
        );
      }
    },
    {
      title: "Weight",
      dataIndex: "weight",
      render: (value) => {
        return (
          <span>{value}</span>
        );
      }
    },
    {
      title: "Block Height",
      dataIndex: "block_height",
      render: (text) => {
        return <a onClick={() => gotoBlock(text)}>#{text}</a>
      }
    },
    
  ];

  useEffect(() => {
    setIsLoading(true);
    let appchainId = 0;
    if (!isNaN(id as any)) {
      appchainId = +id;
    }
    Promise.all([
      window.contract.get_appchain({ appchain_id: appchainId }),
      window.contract.get_curr_validator_set_index({ appchain_id: appchainId })
    ]).then(([appchain, idx]) => {
      console.log(appchain);
      setIsLoading(false);
      setAppchain(readableAppchain(appchain));
      setCurrValidatorSetIdx(idx);
      setAppchainValidatorIdx(idx);
      // getValidators(appchainId, idx);
    });
  }, [id]);

  const getValidators = function(idx) {
   
    setIsLoadingValidators(true);
    window.contract.get_validator_set({ appchain_id: appchain.id, seq_num: idx })
      .then(set => {
        setIsLoadingValidators(false);
        setValidatorSet(set);
      })
      .catch(err => {
        setIsLoadingValidators(false);
        message.error(err.toString());
      });
  }

  useEffect(() => {
    if (currValidatorSetIdx == 0) {
      return setValidatorSet([]);
    }
    getValidators(currValidatorSetIdx);
  }, [currValidatorSetIdx]);

  const onPrevIndex = useCallback(() => {
    if (currValidatorSetIdx > 0) {
      setCurrValidatorSetIdx(currValidatorSetIdx - 1);
    }
  }, [currValidatorSetIdx]);

  const onNextIndex = useCallback(() => {
    if (!appchain) return;
    if (currValidatorSetIdx < appchainValidatorIdex) {
      setCurrValidatorSetIdx(currValidatorSetIdx + 1);
    }
  }, [currValidatorSetIdx, appchain]);

  const gotoBlock = function(blockId) {
    utils.web.fetchJson(window.walletConnection._near?.config.nodeUrl, JSON.stringify({
      "jsonrpc": "2.0",
      "id": "dontcare",
      "method": "block", 
      "params": {
          "block_id": blockId
      }
    })).then(({ result }) => {
      window.location.href = `https://explorer.testnet.near.org/blocks/${result.header.hash}`;
    });
  }
  
  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className={styles.title}>
        <div className={styles.left}>
          <div className={styles.breadcrumb}>
            <Link to='/appchain'>Appchain</Link>
            <span className={styles.arrow}><RightOutlined /></span>
            <span className={classnames(styles.name, styles.skeleton)}>{ appchain?.appchain_name }</span>
          </div>
          <div className={styles.appchainName}>
            <span className={classnames(styles.text, styles.skeleton)}>
              { appchain?.appchain_name }
            </span>
            <span className={classnames(styles.status, styles[appchain?.status])}>
              { appchain?.status }
            </span>
            {/* <div className={styles.vote}>
              <span className={classnames(styles.btn, styles.up)}><UpOutlined /></span>
              <span className={styles.num}>0</span>
              <span className={classnames(styles.btn, styles.down)}><DownOutlined /></span>
            </div> */}
          </div>
          
        </div>
        <div className={styles.right}>
          <div className={styles.buttons}>
            {
              appchain && appchain.founder_id == window.accountId &&
              <Link to={`/update/${id}`}>
                <Button type='primary' icon={<EditOutlined />}>Update</Button>
              </Link>
            }
            
            <Button type='primary' icon={<CodeOutlined />} 
              disabled={ !appchain || appchain.status != 'Active' }>RPC Call</Button>
          </div>
        </div>
      </div>
      
      <div className={styles.detail}>
        <div className={styles.left}>
          <div className={styles.baseInfo}>
            <span className={classnames(styles.tag, styles.id, styles.skeleton)}>{ appchain && 'ID: ' + appchain.id }</span>
            {
              appchain &&
              <span className={classnames(styles.tag, styles.block)}>
                at block #{appchain.block_height}
              </span>
            }
          </div>
          <div className={styles.baseInfo}>
            {
              appchain &&
              <a className={classnames(styles.tag, styles.link)} href={`${window.nearConfig.explorerUrl}/accounts/${appchain.founder_id}`} target='_blank'>
                <UserOutlined /> {appchain.founder_id}
              </a>
            }
            {
              appchain?.website_url &&
              <a className={classnames(styles.tag, styles.link)} href={appchain.website_url} target='_blank'>
                <LinkOutlined /> Website
              </a>
            }
            {
              appchain?.github_address &&
              <a className={classnames(styles.tag, styles.link)} href={appchain.github_address} target='_blank'>
                <GithubOutlined /> Github
              </a>
            }
          </div>
        </div>
        <div className={styles.right}>
          <Descriptions column={3} layout="vertical" colon={false}>
            <Descriptions.Item label="Bonded">
              {
                appchain ?
                <span> { appchain.bond_tokens } OCT </span> :
                <span className={styles.skeleton} style={{ width: '200px', height: '24px' }} />
              }
            </Descriptions.Item>
            <Descriptions.Item label="Chain Spec">
              {
                appchain ?
                appchain.chain_spec_hash ?
                <CopyToClipboard text={`${appchain.chain_spec_url}`} onCopy={() => message.info('Copied!')}>
                  <div style={{ cursor: 'pointer', display: 'flex' }}>
                    <span style={{ flex: '1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '180px' }}>
                      { appchain.chain_spec_url }
                    </span> 
                    <span style={{ marginLeft: "5px", color: "#aaa" }}><CopyOutlined /></span>
                  </div>
                </CopyToClipboard> :
                <span>Not Provided</span> :
                <span className={styles.skeleton} style={{ width: '200px', height: '24px' }} />
              }
            </Descriptions.Item>
            <Descriptions.Item label="Chain Spec Hash">
              {
                appchain ?
                appchain.chain_spec_hash ?
                <CopyToClipboard text={`${appchain.chain_spec_hash}`} onCopy={() => message.info('Copied!')}>
                  <div style={{ cursor: 'pointer', display: 'flex' }}>
                    <span style={{ flex: '1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '180px' }}>
                      { appchain.chain_spec_hash }
                    </span> 
                    <span style={{ marginLeft: "5px", color: "#aaa" }}><CopyOutlined /></span>
                  </div>
                </CopyToClipboard> :
                <span>Not Provided</span> :
                <span className={styles.skeleton} style={{ width: '200px', height: '24px' }} />
              }
              
            </Descriptions.Item>
            {
              appchain && appchain.boot_nodes &&
              <Descriptions.Item label="Boot Nodes">
                <CopyToClipboard text={`${appchain.boot_nodes}`} onCopy={() => message.info('Copied!')}>
                  <div style={{ cursor: 'pointer', display: 'flex' }}>
                    <span style={{ flex: '1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '180px' }}>
                      { appchain.boot_nodes }
                    </span> 
                    <span style={{ marginLeft: "5px", color: "#aaa" }}><CopyOutlined /></span>
                  </div>
                </CopyToClipboard>
              </Descriptions.Item>
            }
            {
              appchain && appchain.boot_nodes &&
              <Descriptions.Item label="Rpc Endpoint">
                <CopyToClipboard text={`${appchain.rpc_endpoint}`} onCopy={() => message.info('Copied!')}>
                  <div style={{ cursor: 'pointer', display: 'flex' }}>
                    <span style={{ flex: '1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '180px' }}>
                      { appchain.rpc_endpoint }
                    </span> 
                    <span style={{ marginLeft: "5px", color: "#aaa" }}><CopyOutlined /></span>
                  </div>
                </CopyToClipboard>
              </Descriptions.Item>
            }
          </Descriptions>
          
        </div>
      </div>
      
      <div style={{marginTop: "20px"}}>
        <Card>
          <Tabs defaultActiveKey='blocks'>
            <Tabs.TabPane tab='Blocks' key='blocks'>
              <ConfigProvider renderEmpty={() => {
                return (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Appchain is not ready' />
                );
              }}>
                <Table columns={[
                  {
                    title: 'Block'
                  },
                  {
                    title: 'Hash'
                  },
                  {
                    title: 'Calls'
                  },
                  {
                    title: 'Time'
                  }
                ]} />
              </ConfigProvider>
            </Tabs.TabPane>
            <Tabs.TabPane tab='Validators' key='validators'>
              <Table columns={columns} rowKey={record => record.account_id} loading={isLoading || isLoadingValidators}
                dataSource={validatorSet?.validators} pagination={false} />
            </Tabs.TabPane>
          </Tabs>
        </Card>
        {/* <Card title={<span>Validators 
          <Button type="text" disabled={currValidatorSetIdx <= 0} size="small" icon={<LeftOutlined />} onClick={onPrevIndex} /> 
            Index: {currValidatorSetIdx} <Button size="small" type="text" onClick={onNextIndex} disabled={currValidatorSetIdx >= appchainValidatorIdex} 
            icon={<RightOutlined />} /></span>} 
          bordered={false} loading={isLoading || isLoadingValidators}>
          <Table columns={columns} rowKey={record => record.account_id} dataSource={validatorSet?.validators} pagination={false} />
        </Card> */}
      </div>
    </div>
  );
}

export default React.memo(Appchain);