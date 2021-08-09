import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';

/**
 * PolicyBasedDeploymentControllerのプロパティ
 */ 
export interface PolicyBasedDeploymentControllerProps{
    /** インストール対象のEKSクラスタ*/
    cluster: eks.ICluster,
    /** Cloud Oneが発行したAPI Key*/
    apiKey: cdk.SecretValue
}

/**
 * Trend Micro Cloud One Container SecurityのPolicy-based Deployment ControllerをインストールするHelmを適用するConstruct
 * @see https://cloudone.trendmicro.com/docs/container-security/cluster-add/#install-the-policy-based-deployment-controller
 */ 
export class PolicyBasedDeploymentController extends cdk.Construct{
    constructor(scope: cdk.Construct, id:string, props: PolicyBasedDeploymentControllerProps){
        super(scope, id);
        
        const {cluster, apiKey} = props;
        new eks.HelmChart(this, "policybased-deployment", {
            cluster,
            release: "trendmicro",
            namespace: "trendmicro-system",
            createNamespace: true,
            chart: "https://github.com/trendmicro/cloudone-container-security-helm/archive/master.tar.gz",
            values: {
                cloudOne: {
                    apiKey
                }
            } 
        })
    }
}