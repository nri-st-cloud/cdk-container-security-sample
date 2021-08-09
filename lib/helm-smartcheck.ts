import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';

/**
 * SmartCheckのプロパティ
 */ 
export interface SmartCheckProps{
    /** インストール対象のEKSクラスタ*/
    cluster: eks.ICluster,
    /** Cloud Oneが発行したAPI Key*/
    apiKey: cdk.SecretValue
}

/**
 * Trend Micro Cloud One Container SecurityのDeepSecurity SmartCheckをインストールするHelmを適用するConstruct
 * @see https://cloudone.trendmicro.com/docs/container-security/sc-integrate/
 * @see https://github.com/deep-security/smartcheck-helm
 */ 
export class SmartCheck extends cdk.Construct{
    constructor(scope: cdk.Construct, id: string, props: SmartCheckProps){
        super(scope, id);
        
        const {cluster, apiKey} = props;
        new eks.HelmChart(this, "smartcheck-deployment", {
            cluster,
            release: "deepsecurity-smartcheck",
            chart: "https://github.com/deep-security/smartcheck-helm/archive/master.tar.gz",
            values: {
                cloudOne: {
                    apiKey
                },
                auth: {
                    /**
                     * 管理コンソールのパスワードを作成する際のシード
                     * ここではStack IDを使用する
                     */ 
                    secretSeed: cdk.Stack.of(this).stackId
                }
            } 
        })
    }
}