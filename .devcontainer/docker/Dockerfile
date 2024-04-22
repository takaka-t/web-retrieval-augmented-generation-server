# debian
FROM node:20.12-bookworm-slim

# timezone
RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

# apt
RUN apt update

# git
RUN apt-get install -y git

# ping
RUN apt install -y iputils-ping net-tools
