#!/usr/bin/env bash
# Run ONCE on a fresh Ubuntu 24.04 EC2 instance (as the default `ubuntu` user):
#   curl -fsSL https://raw.githubusercontent.com/Saksh2024/AgentLab/<branch>/deploy/aws/bootstrap.sh | bash
# or copy it over and run:  bash bootstrap.sh
#
# It installs Docker (+ compose/buildx plugins), adds swap (the Vite build is memory hungry),
# and clones the repo to ~/AgentLab. It does NOT touch secrets: you create .env afterwards.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Saksh2024/AgentLab.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-$HOME/AgentLab}"

echo ">> Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker

echo ">> Ensuring 2G swap"
if ! swapon --show | grep -q .; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo ">> Cloning $REPO_URL ($BRANCH) into $APP_DIR"
sudo apt-get install -y git >/dev/null
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$BRANCH" && git -C "$APP_DIR" checkout "$BRANCH" && git -C "$APP_DIR" pull --ff-only
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cat <<EOF

Bootstrap done. Next (log out and back in once so the docker group applies):
  cd $APP_DIR
  cp .env.example .env && nano .env     # set OPENAI_API_KEY, API_KEY, HTTP_PORT=80, ALLOWED_ORIGINS
  docker compose up -d --build
  docker compose ps
EOF
