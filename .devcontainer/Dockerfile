FROM mcr.microsoft.com/devcontainers/javascript-node:0-18

# Install PostgreSQL
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install postgresql postgresql-contrib \
    && apt-get clean

# Configure PostgreSQL to trust all connections
RUN echo "host all all all trust" >> /etc/postgresql/14/main/pg_hba.conf