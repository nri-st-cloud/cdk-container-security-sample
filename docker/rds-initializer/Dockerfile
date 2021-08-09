FROM debian:stable-slim

RUN apt-get update && apt-get install -y jq && apt-get install -y git && apt-get install -y postgresql-client

RUN mkdir /tmp/workspace

COPY ./scripts/import_data.sh /tmp/workspace/import_data.sh

WORKDIR /tmp/workspace

ENTRYPOINT ["sh", "import_data.sh"]