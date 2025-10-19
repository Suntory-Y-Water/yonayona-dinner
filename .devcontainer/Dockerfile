FROM mcr.microsoft.com/devcontainers/javascript-node:22-bookworm

# 作業ディレクトリを設定
WORKDIR /workspaces

# 非rootユーザー 'node' として実行する設定
# devcontainer.json の remoteUser と合わせる
USER node

# Claude設定ディレクトリとツール用ディレクトリの権限設定
RUN mkdir -p /home/node/.claude && \
    mkdir -p /home/node/.local/bin && \
    mkdir -p /home/node/.bun/bin && \
    mkdir -p /home/node/.codex && \
    chown -R node:node /home/node/.claude && \
    chown -R node:node /home/node/.local && \
    chown -R node:node /home/node/.bun && \
    chown -R node:node /home/node/.codex