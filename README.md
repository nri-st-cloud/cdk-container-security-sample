# CDK Container Security Sample

[Qiita](https://qiita.com/)のエンジニアフェスタ2021 [Trend Micro Cloud One を使ってAWS環境をよりセキュアにする方法について投稿しよう！](https://qiita.com/tags/qiita%e3%82%a8%e3%83%b3%e3%82%b8%e3%83%8b%e3%82%a2%e3%83%95%e3%82%a7%e3%82%b9%e3%82%bf_trendmicro)に投稿した[記事](https://qiita.com/nst-zama/items/954ce559b2de46e946ed#policy-based-deployment-controller%E3%82%92%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB%E3%81%99%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AEconstruct%E3%82%92%E4%BD%9C%E6%88%90%E3%81%99%E3%82%8B)のソース例です。

詳しくは[記事本文](https://qiita.com/nst-zama/items/954ce559b2de46e946ed#policy-based-deployment-controller%E3%82%92%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB%E3%81%99%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AEconstruct%E3%82%92%E4%BD%9C%E6%88%90%E3%81%99%E3%82%8B)をご覧ください。

## How To Use

### Container SecurityのAPI Keyを作成

Trend Micro Cloud Oneにログインし、Container SecurityのAPI Keyを２種類作成する

1. [Container Securityのクラスタ追加用](https://cloudone.trendmicro.com/docs/container-security/cluster-add/)
2. [Deep Security Smart Checkインストール用](https://cloudone.trendmicro.com/docs/container-security/sc-integrate/)

上記２つのキーをそれぞれAWS Systems Managerのパラメータストアに登録し、Keyを控えておく。

### ソースのClone

```bash
$ git clone https://github.com/nri-st-cloud/cdk-container-security-sample.git
$ yarn # 関連パッケージのインストール
```

### Deploy

```bash
$ yarn cdk deploy --parameters CloudOneApiKey=${Container Securityのクラスタ追加用KeyのパラメータストアKey} --parameters SmartCheckApiKey=${Deep Security Smart Checkインストール用KeyのパラメータストアKey}
```

### Destroy

```bash
$ yarn cdk destroy
```



