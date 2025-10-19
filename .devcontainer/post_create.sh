#!/bin/bash

# bun, uvのインストール。MCPサーバやClaude CodeのHooksで使用する

# パス変数の定義
CLAUDE_DIR="$HOME/.claude"
BUN_BIN="$HOME/.bun/bin/bun"

# UVの条件付きインストール
if ! command -v uv &> /dev/null; then
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
else
    echo "uv already installed, skipping..."
fi

# Bunの条件付きインストール
if [ ! -f "$BUN_BIN" ]; then
    echo "Installing bun..."
    curl -fsSL https://bun.sh/install | bash
else
    echo "bun already installed, skipping..."
fi

# 最新版をインストールしたいので、毎回実行する
echo "Installing claude code..."
npm i -g @anthropic-ai/claude-code

# 環境パスの設定
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Codexの条件付きインストール
if ! command -v codex &> /dev/null; then
    echo "Installing codex..."
    npm i -g @openai/codex
else
    echo "codex already installed, skipping..."
fi

echo "Installation completed!"

# Claude Code設定集のインストール
echo "Installing Claude Code settings..."

if [ -d "$CLAUDE_DIR" ]; then
    # 認証ファイルをバックアップ
    cp "$CLAUDE_DIR"/.claude.json* /tmp/ 2>/dev/null || true
    cp "$CLAUDE_DIR"/.credentials.json /tmp/ 2>/dev/null || true

    # 設定集をクローンして上書き
    cd /tmp
    git clone https://github.com/Suntory-Y-Water/claude-code-settings.git
    cp -r claude-code-settings/* "$CLAUDE_DIR"/

    # 認証ファイルを復元
    cp /tmp/.claude.json* "$CLAUDE_DIR"/ 2>/dev/null || true
    cp /tmp/.credentials.json "$CLAUDE_DIR"/ 2>/dev/null || true

    rm -rf /tmp/claude-code-settings
else
    git clone https://github.com/Suntory-Y-Water/claude-code-settings.git "$CLAUDE_DIR"
fi

# 依存関係のインストール
if [ -f "$CLAUDE_DIR/package.json" ]; then
    cd "$CLAUDE_DIR"
    # 初期セットアップ時は絶対パスじゃないとPATHが通っていないため
    if [ -f "$BUN_BIN" ]; then
        "$BUN_BIN" install
    else
        echo "Warning: bun not found, skipping package installation"
    fi
fi

chown -R node:node "$CLAUDE_DIR"
echo "Claude Code settings installation completed!"

# npmとnpxを使用させずbunを使うようにする設定
echo '' >> ~/.bashrc
echo 'alias npm="echo \"WARNING: npm は使用しないでください。代わりに、bun を使用してください。\" && false"' >> ~/.bashrc
echo 'alias npx="echo \"WARNING: npx は使用しないでください。代わりに、bunx を使用してください。\" && false"' >> ~/.bashrc