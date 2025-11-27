#!/bin/sh
set -e

echo "Waiting for Redis nodes to be ready..."
sleep 10 # 노드들이 완전히 뜰 때까지 조금 넉넉히 대기

echo "Creating Redis Cluster..."

# redis-cli 명령어로 클러스터 생성
# --cluster-replicas 1 : 마스터 1개당 레플리카 1개 생성 (총 3마스터 + 3레플리카)
redis-cli --cluster create \
  redis-node-1:7000 \
  redis-node-2:7001 \
  redis-node-3:7002 \
  redis-node-4:7003 \
  redis-node-5:7004 \
  redis-node-6:7005 \
  --cluster-replicas 1 \
  --cluster-yes

echo "Redis Cluster created successfully!"