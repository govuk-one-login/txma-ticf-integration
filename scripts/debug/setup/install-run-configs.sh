#!/bin/bash
# Sets up local debug run configurations.
# Usage: bash scripts/debug/setup/install-run-configs.sh [vscode|intellij]
# Omit the argument to run both.

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
IDE="${1:-all}"

setup_vscode() {
    local VSCODE_DIR="$ROOT_DIR/.vscode"
    mkdir -p "$VSCODE_DIR"
    local CONFIGS=""
    for d in "$ROOT_DIR/src/lambdas/"/*/; do
        local LAMBDA
        LAMBDA=$(basename "$d")
        CONFIGS="${CONFIGS}
    {
      \"name\": \"Debug ${LAMBDA}\",
      \"type\": \"node\",
      \"request\": \"launch\",
      \"runtimeExecutable\": \"\${workspaceFolder}/node_modules/.bin/ts-node\",
      \"args\": [\"\${workspaceFolder}/scripts/debug/invoke-local.ts\", \"${LAMBDA}\"],
      \"cwd\": \"\${workspaceFolder}\",
      \"sourceMaps\": true,
      \"skipFiles\": [\"<node_internals>/**\", \"**/node_modules/**\"]
    },"
    done
    CONFIGS="${CONFIGS%,}"
    cat > "$VSCODE_DIR/launch.json" <<EOF
{
  "version": "0.2.0",
  "configurations": [${CONFIGS}
  ]
}
EOF
    echo "==> Generated $VSCODE_DIR/launch.json"
}

setup_intellij() {
    local IDEA_DIR="$ROOT_DIR/.idea/runConfigurations"
    mkdir -p "$IDEA_DIR"
    local NODE_INTERPRETER
    NODE_INTERPRETER="$HOME/.nvm/versions/node/v24.14.1/bin/node"
    for d in "$ROOT_DIR/src/lambdas/"/*/; do
        local LAMBDA
        LAMBDA=$(basename "$d")
        cat > "$IDEA_DIR/Debug_${LAMBDA}.xml" <<EOF
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Debug ${LAMBDA}" type="NodeJSConfigurationType" factoryName="Node.js">
    <node-interpreter>${NODE_INTERPRETER}</node-interpreter>
    <node-parameters>--import tsx/esm</node-parameters>
    <working-dir>${ROOT_DIR}</working-dir>
    <script-path>${ROOT_DIR}/scripts/debug/invoke-local.ts</script-path>
    <script-parameters>${LAMBDA}</script-parameters>
    <method v="2" />
  </configuration>
</component>
EOF
        echo "==> Generated $IDEA_DIR/Debug_${LAMBDA}.xml"
    done
    echo ""
    echo "==> IntelliJ run configurations installed. Reload the project if already open."
    echo ""
    echo "   Node interpreter : ${NODE_INTERPRETER}"
    echo "   Node parameters  : --import tsx/esm"
    echo "   Working directory: $ROOT_DIR"
    echo "   JavaScript file  : $ROOT_DIR/scripts/debug/invoke-local.ts"
    echo ""
    echo "   Available lambdas:"
    for d in "$ROOT_DIR/src/lambdas/"/*/; do
        echo "     - $(basename "$d")"
    done
    echo ""
}

case "$IDE" in
    vscode)    setup_vscode ;;
    intellij)  setup_intellij ;;
    all)       setup_vscode; setup_intellij ;;
    *)
        echo "Usage: $0 [vscode|intellij]"
        exit 1
        ;;
esac
