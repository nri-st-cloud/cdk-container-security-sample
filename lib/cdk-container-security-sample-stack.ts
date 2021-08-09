import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as rds from '@aws-cdk/aws-rds';

import {PolicyBasedDeploymentController} from './helm-policybased-deployment-controller';
import {SmartCheck} from './helm-smartcheck';
import {RdsInitializeJob} from './minifest-rds-initialize-job';

/**
 * 使用するCDK Contextをマップするinterface
 */
interface CdkContainerSecuritySampleContext{
  /** CIDRプレフィックス*/
  cidrPrefix: string,
  /** EKSクラスタのノード数*/
  desiredCapacity: number,
  /** EKSクラスタのノードのインスタンスタイプ*/
  nodeInstanceType: string,
  /** EKSクラスタ名*/
  clusterName: string,
}

/**
 * CdkContainerSecuritySampleContextのデフォルト値
 */ 
const DEFAULT_CONTEXT: CdkContainerSecuritySampleContext = {
  cidrPrefix: '10.0',
  desiredCapacity: 2,
  nodeInstanceType: 'm5.large',
  clusterName: 'container-security-sample',
}


export class CdkContainerSecuritySampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // CDK Contextのパース
    const context = this.parseContext();
    
    // EKSクラスタをデプロイするVPCの作成
    const vpc = new ec2.Vpc(this, 'cloudone-poc-vpc', {
      cidr: `${context.cidrPrefix}.0.0/16`,
      natGateways:1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public1',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'Public2',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'Private1',
          subnetType: ec2.SubnetType.PRIVATE
        },
        {
          cidrMask: 24,
          name: 'Private2',
          subnetType: ec2.SubnetType.PRIVATE
        }
      ]
    });
    
    // EKSクラスタの作成
    const cluster = new eks.Cluster(this, 'container-security-cluster', {
      vpc,
      clusterName: context.clusterName,
      version: eks.KubernetesVersion.V1_20,
      defaultCapacity: context.desiredCapacity,
      defaultCapacityInstance: new ec2.InstanceType(context.nodeInstanceType)
    });
    
    
    /**
     * kubernetes-external-secrets(AWS Secrets Managerで管理されているSecretをKubernatesのSecretに連携するController)のインストール
     */ 
     
    // kubernetes-external-secretsで使用するサービスアカウントの作成
    const externalSecretServiceAccount = cluster.addServiceAccount("external-secret-sa", {name: `${context.clusterName}-sa`});
    
    // Helm経由でkubernetes-external-secretsのインストール
    // @see https://github.com/external-secrets/kubernetes-external-secrets/tree/master/charts/kubernetes-external-secrets
    const externalSecretHelm = new eks.HelmChart(this,'external-secret', {
      cluster,
      repository: "https://external-secrets.github.io/kubernetes-external-secrets",
      chart: "kubernetes-external-secrets",
      values: {
        securityContext:{
          fsGroup: 65534
        },
        serviceAccount:{
          create:false,
          name: externalSecretServiceAccount.serviceAccountName
        },
        env:{
          AWS_REGION: this.region
        }
      }
    });
    
    
    // EKS上のコンテナが利用するRDS(PostgreSQL)をプライベートサブネットへ作成
    const postgresRds = new rds.DatabaseInstance(this, 'postgres-container-security', {
      engine: rds.DatabaseInstanceEngine.postgres({version: rds.PostgresEngineVersion.VER_13_3}),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE
      }
    });
    
    // EKSクラスタからRDSへのデフォルトポートでの疎通を許可する
    postgresRds.connections.allowDefaultPortFrom(cluster);
    
    /**
     * kubernetes-external-secretsを使用してSecretManagerに格納されたRDSの接続情報を
     * KubernetesのSecretに連携する
     */ 
    
    // RDSの接続情報が格納されているSecret名
    const postgresRdsSecretInfo = postgresRds.secret;
    
    if(postgresRdsSecretInfo){
      // kubernetes-external-secretsのサービスアカウントに接続情報の読み取りを許可
      postgresRdsSecretInfo.grantRead(externalSecretServiceAccount);
      
      // kubernetes-external-secretsを使用して接続情報を連携するマニフェストの追加
      const postgresRdsSecretManifest = new eks.KubernetesManifest(this, 'rds-secret-manifest', {
        cluster,
        manifest:[{
          apiVersion: 'kubernetes-client.io/v1',
          kind: 'ExternalSecret',
          metadata: {
            name: 'postgres-rds-secret',
          },
          spec:{
            backendType: "secretsManager",
            data:[
              {
                key: postgresRdsSecretInfo.secretName,
                name: "dbcredential"
              }
            ]
          }
        }]
      });
      // このマニフェストがkubernetes-external-secretsのインストール後に実行されるよう依存関係を明示
      postgresRdsSecretManifest.node.addDependency(externalSecretHelm);
      
      // rdsの初期化Jobの適用
      const rdsInitializeJob = new RdsInitializeJob(this, 'rds-initialize', {
        cluster,
        rdsCredentialSecret: {
          name: 'postgres-rds-secret',
          key: "dbcredential"
        }
      });
      // このマニフェストがpostgresRdsSecretManifestの後に適用されるよう依存関係を明示
      rdsInitializeJob.manifestNode.addDependency(postgresRdsSecretManifest);
    }
    
    //Cloud One Container Securityの導入
    new PolicyBasedDeploymentController(this, "cloudone", {
      cluster,
      apiKey: cdk.SecretValue.cfnParameter(new cdk.CfnParameter(this, 'CloudOneApiKey', {type: "AWS::SSM::Parameter::Value<String>", noEcho: true}))
    });
    
    //DeepSecurity SmartCheckの導入
    new SmartCheck(this, "smartcheck", {
      cluster,
      apiKey: cdk.SecretValue.cfnParameter(new cdk.CfnParameter(this, 'SmartCheckApiKey', {type: "AWS::SSM::Parameter::Value<String>", noEcho: true}))
    });
  }
  
  /**
   * CDK Contextをパースして返す
   */ 
  private parseContext(): CdkContainerSecuritySampleContext{
    return {
      cidrPrefix: this.node.tryGetContext("CIDR_PREFIX") ?? DEFAULT_CONTEXT.cidrPrefix,
      desiredCapacity: this.node.tryGetContext("DESIRED_CAPACITY") ?? DEFAULT_CONTEXT.desiredCapacity,
      nodeInstanceType: this.node.tryGetContext("NODE_INSTANCE_TYPE") ?? DEFAULT_CONTEXT.nodeInstanceType,
      clusterName: this.node.tryGetContext("CLUSTER_NAME") ?? DEFAULT_CONTEXT.clusterName,
    }
  }
}
