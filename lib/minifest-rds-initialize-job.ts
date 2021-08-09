import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import {DockerImageAsset} from '@aws-cdk/aws-ecr-assets';

/**
 * RdsInitializeJobに指定するProperty
 */ 
export interface RdsInitializeJobProps{
    /** マニフェストを適用するEKSクラスタ*/
    cluster: eks.ICluster,
    /** RDSの認証情報が格納されているSecretの情報*/
    rdsCredentialSecret: {
        name: string,
        key: string
    }
}

/**
 * RDSの初期化Jobを作成するConstruct
 */ 
export class RdsInitializeJob extends cdk.Construct {
    /** 作成されるマニフェストのConstructNode(依存性の定義に使用)*/
    readonly manifestNode: cdk.ConstructNode
    
    /**
     * コンストラクタ
     */ 
    constructor(scope: cdk.Construct, id: string, props: RdsInitializeJobProps){
        super(scope, id);
        
        const {cluster, rdsCredentialSecret} = props;
        
        /**
         * jobで使用するDockerイメージのAsset
         */ 
        const rdsInitializerImage = new DockerImageAsset(this, 'rds-initializer', {
            directory: path.join(__dirname, '../docker/rds-initializer')
        });
        
        /**
         * RDS初期化ジョブのマニフェスト
         */ 
        const manifest = new eks.KubernetesManifest(this, 'rds-initialize-job', {
          cluster,
          manifest:[
            {
              apiVersion: "batch/v1",
              kind: "Job",
              metadata:{
                name: "rds-initialize-job"
              },
              spec:{
                template:{
                  spec:{
                    containers: [
                      {
                        name: "rds-initialize",
                        image: rdsInitializerImage.imageUri, //DockerAsset化Imageをこのように参照できる
                        volumeMounts:[
                          {
                            name: "rdsdbinfo",
                            mountPath: "/etc/secret"
                          }
                        ]
                      }
                    ],
                    volumes: [
                      { //external secretで連携したRDSの認証情報
                        name: "rdsdbinfo",
                        secret: {
                          secretName: rdsCredentialSecret.name,
                          items: [
                            {
                              key: rdsCredentialSecret.key,
                              path: 'rds-db-info'
                            }
                          ]
                        }
                      }
                    ],
                    restartPolicy: "Never"
                  }
                }
              }
            }
          ]
        });
        
        this.manifestNode = manifest.node;
    }
}