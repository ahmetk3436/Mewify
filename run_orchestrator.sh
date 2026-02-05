#!/bin/bash

# Mewify Orchestrator Runner
cd /Users/ahmetcoskunkizilkaya/Desktop/fully-autonomous-mobile-system/orchestrator

# Project configuration
export PROJECT_ROOT=/Users/ahmetcoskunkizilkaya/Desktop/Mewify

# Engine Agent (DeepSeek for planning)
export ENGINE_API_KEY=sk-09fba15cdf494915b5b34c678ac694d3
export ENGINE_API_URL=https://api.deepseek.com/v1/chat/completions
export ENGINE_MODEL=deepseek-reasoner

# Executioner Agent (GLM-4.7 for code generation)
export EXECUTIONER_MODE=api
export EXECUTIONER_API_KEY=3145a06cd026411e83c45d450aa108f2.2VBi51joAjUaVx15
export EXECUTIONER_API_URL=https://api.z.ai/api/paas/v4/chat/completions
export EXECUTIONER_MODEL=glm-4.7

# Debugger Agent (GLM-4.7 for debugging)
export DEBUGGER_API_KEY=3145a06cd026411e83c45d450aa108f2.2VBi51joAjUaVx15
export DEBUGGER_API_URL=https://api.z.ai/api/paas/v4/chat/completions
export DEBUGGER_MODEL=glm-4.7

# Deployment (Git-Claw)
export GITHUB_PAT=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
export GITHUB_OWNER=ahmetk3436
export COOLIFY_TOKEN="1|gLNvAM35l8nWZdtEuG1unpwtNuaP77VPi4WA4bwO1b21562a"
export COOLIFY_URL=http://89.47.113.196:8000
export COOLIFY_SERVER=lgs0s8kkggk0c88ogws0wk44
export COOLIFY_PROJECT=hwcw4gw0scs40888okkcs8ws

# Run orchestrator
./orchestrator_bin -mode continuous
