#!/usr/bin/env sh
set -e

TOOL_NAME="fairtool"
ZIP_URL="https://github.com/appfair/Fair/releases/latest/download/${TOOL_NAME}-bin.zip"
UNZIP_DIR="/tmp/${TOOL_NAME}_install_$$"
BIN_NAME="${TOOL_NAME}"
BIN_PATH="${TOOL_NAME}-bin/${BIN_NAME}"

echo "Installing ${TOOL_NAME}..."

# Detect platform
OS="$(uname -s)"
case "$OS" in
  Linux*)   PLATFORM="linux" ;;
  Darwin*)  PLATFORM="macos" ;;
  CYGWIN*|MINGW*|MSYS*) PLATFORM="windows" ;;
  *) echo "Unsupported OS: $OS" && exit 1 ;;
esac

# Determine install location
if [ "$PLATFORM" = "macos" ]; then
  #INSTALL_DIR="$HOME/Library/Application Support/$TOOL_NAME"
  INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/$TOOL_NAME"
  BIN_DIR="$HOME/.local/bin"
elif [ "$PLATFORM" = "linux" ]; then
  INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/$TOOL_NAME"
  BIN_DIR="$HOME/.local/bin"
else # windows (WSL/Git Bash)
  INSTALL_DIR="$APPDATA\\$TOOL_NAME"
  BIN_DIR="$HOME/bin"
fi

mkdir -p "$INSTALL_DIR" "$BIN_DIR" "$UNZIP_DIR"

# Download zip
echo "Downloading ${ZIP_URL}..."
curl -fsSL "$ZIP_URL" -o "$UNZIP_DIR/${TOOL_NAME}.zip"

# Extract
echo "Extracting package..."
unzip -qo "$UNZIP_DIR/${TOOL_NAME}.zip" -d "$INSTALL_DIR"

# Link executable
if [ -f "$INSTALL_DIR/$BIN_PATH" ]; then
  chmod +x "$INSTALL_DIR/$BIN_PATH"
  ln -sf "$INSTALL_DIR/$BIN_PATH" "$BIN_DIR/$BIN_NAME"
else
  echo "Error: No '${BIN_NAME}' executable found in package."
  exit 1
fi

# Ensure PATH is updated
if ! echo "$PATH" | grep -q "$BIN_DIR"; then
  SHELL_RC=""
  case "$SHELL" in
    *bash) SHELL_RC="$HOME/.bashrc" ;;
    *zsh) SHELL_RC="$HOME/.zshrc" ;;
    *fish) SHELL_RC="$HOME/.config/fish/config.fish" ;;
  esac
  if [ -n "$SHELL_RC" ]; then
    echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$SHELL_RC"
    echo "Added $BIN_DIR to PATH in $SHELL_RC"
  else
    echo "Please add $BIN_DIR to your PATH manually."
  fi
fi

echo "Cleaning up..."
rm -rf "$UNZIP_DIR"

echo "${TOOL_NAME} installed successfully!"
echo "Try running: $BIN_NAME --help"
