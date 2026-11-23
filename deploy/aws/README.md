# Deploying AgentLab on AWS (EC2 + Docker Compose)

The repo is already containerized (`backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`).
This runbook runs that exact stack on one EC2 instance.

```
Internet :80 -> [EC2: nginx container (frontend + /api proxy)] -> backend container (FastAPI) -> SQLite on Docker volume (EBS disk)
```

**Why EC2 and not Fargate/App Runner?** The app stores data in SQLite. Fargate/App Runner have no
local persistent disk (EFS + SQLite is unreliable because of file locking), so data would reset on every
deploy. One EC2 instance keeps the SQLite file on an EBS disk, and `docker-compose.yml` works unchanged.
Moving to RDS/DynamoDB later is the way to scale beyond one box.

Cost: t3.small (~$15/mo) + 20 GB gp3 (~$1.6/mo) + Elastic IP (free while attached to a running instance).

## 0. One-time local setup

```bash
winget install Amazon.AWSCLI        # then reopen the terminal
aws configure                       # IAM user/role with EC2 permissions; pick a region, e.g. ap-south-1
aws sts get-caller-identity         # sanity check
```

## 1. Make sure the branch you deploy has the Dockerfiles

The Docker work lives on `feat/docker-ci-hardening` (PR #1). Either merge that PR into `main`,
or set `BRANCH=feat/docker-ci-hardening` below.

## 2. Create the AWS resources (bash / Git Bash)

```bash
export AWS_REGION=ap-south-1
export NAME=agentlab
MY_IP=$(curl -s https://checkip.amazonaws.com)

# SSH key
aws ec2 create-key-pair --key-name $NAME --query KeyMaterial --output text > $NAME.pem
chmod 600 $NAME.pem

# Security group: HTTP open to the world, SSH only from your IP
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SG=$(aws ec2 create-security-group --group-name $NAME --description "AgentLab" --vpc-id $VPC --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr $MY_IP/32

# Latest Ubuntu 24.04 AMI, launch instance
AMI=$(aws ssm get-parameter --name /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id --query Parameter.Value --output text)
IID=$(aws ec2 run-instances --image-id $AMI --instance-type t3.small --key-name $NAME --security-group-ids $SG \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3}' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NAME}]" \
  --query 'Instances[0].InstanceId' --output text)
aws ec2 wait instance-running --instance-ids $IID

# Stable public IP
ALLOC=$(aws ec2 allocate-address --domain vpc --query AllocationId --output text)
aws ec2 associate-address --instance-id $IID --allocation-id $ALLOC
EIP=$(aws ec2 describe-addresses --allocation-ids $ALLOC --query 'Addresses[0].PublicIp' --output text)
echo "Elastic IP: $EIP"
```

(Or do the same in the console: EC2 > Launch instance > Ubuntu 24.04, t3.small, 20 GB, ports 22 + 80.)

## 3. Install Docker and fetch the code

```bash
ssh -i $NAME.pem ubuntu@$EIP
# on the server:
curl -fsSL https://raw.githubusercontent.com/Saksh2024/AgentLab/main/deploy/aws/bootstrap.sh | BRANCH=main bash
exit && ssh -i $NAME.pem ubuntu@$EIP     # re-login so the docker group applies
```

> If `deploy/aws/bootstrap.sh` isn't on `main` yet, use the branch name in both the URL and `BRANCH=`.

## 4. Configure secrets and start

```bash
cd ~/AgentLab
cp .env.example .env
# generate a random shared secret for API_KEY:  openssl rand -hex 24
nano .env
```

Set in `.env`:

```
OPENAI_API_KEY=<your Gemini/OpenAI key>
API_KEY=<random string>            # nginx injects it as X-API-Key; it never reaches the browser
HTTP_PORT=80
ALLOWED_ORIGINS=http://<ELASTIC_IP>
RATE_LIMIT_PER_MINUTE=60
```

```bash
docker compose up -d --build       # first build takes a few minutes
docker compose ps                  # both services should be healthy
curl -s localhost/healthz
curl -s localhost/api/v1/versions/ | head -c 200
```

Open `http://<ELASTIC_IP>/` in a browser.

## 5. Updating later

```bash
ssh -i agentlab.pem ubuntu@<ELASTIC_IP>
cd ~/AgentLab && git pull --ff-only && docker compose up -d --build
```

## 6. Operations

| Task | Command |
|---|---|
| Logs | `docker compose logs -f backend` |
| Restart | `docker compose restart` |
| Back up SQLite | `docker run --rm -v agentlab_agentlab-data:/data -v $PWD:/out alpine tar czf /out/agentlab-data.tgz /data` |
| EBS snapshot | EC2 > Volumes > Create snapshot (or AWS Backup / DLM schedule) |

## 7. HTTPS (recommended before sharing publicly)

Plain HTTP on an IP is fine for a demo. For HTTPS you need a domain: point an A record at the Elastic IP, then either
put the instance behind an ALB + ACM certificate (ALB ~$16/mo), or add a Caddy container in front of nginx
(automatic Let's Encrypt, free). Then set `ALLOWED_ORIGINS=https://<domain>`.

## 8. Teardown (stop all charges)

```bash
aws ec2 terminate-instances --instance-ids $IID
aws ec2 wait instance-terminated --instance-ids $IID
aws ec2 release-address --allocation-id $ALLOC
aws ec2 delete-security-group --group-id $SG
aws ec2 delete-key-pair --key-name $NAME
```

## Notes

- Backend has no published port; only nginx (port 80) is reachable, so `TRUST_PROXY_HEADERS=true` in compose is safe.
- Do **not** put real keys in `render.yaml`, user-data or git. `.env` is git-ignored and lives only on the server.
- The Render keys you used earlier should be considered reused credentials: rotate them if they were ever committed or shared.
