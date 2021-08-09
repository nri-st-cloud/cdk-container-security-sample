#!/bin/bash

# RDS(Postgres)の認証情報が以下にマウントされる
DBINFO_DIR=/etc/secret
DBINFO_JSON=$DBINFO_DIR/rds-db-info

# 認証情報はJSONで格納されているのでjqでパースして環境変数に設定する
export PGHOST=`cat $DBINFO_JSON | jq -r .host`
export PGPORT=`cat $DBINFO_JSON | jq -r .port`
export PGUSER=`cat $DBINFO_JSON | jq -r .username`
export PGPASSWORD=`cat $DBINFO_JSON | jq -r .password`
export PGDATABASE=postgres


# AWSの公式サンプルデータをCloneする
git clone https://github.com/aws-samples/aws-database-migration-samples/

# CloneしたSQLを実行する
cd aws-database-migration-samples/PostgreSQL/sampledb/v1/
psql -f ./install-postgresql.sql 