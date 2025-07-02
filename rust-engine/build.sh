#!/bin/bash
set -e

echo "Building OmniAuthor Rust Performance Engine..."

# Install wasm-pack if not present
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WebAssembly module
echo "Compiling Rust to WebAssembly..."
wasm-pack build --target web --out-dir ../client/src/wasm --out-name omniauthor-engine

echo "Rust engine built successfully!"
echo "WebAssembly module available at: client/src/wasm/"