# Docker Desktop メモリ設定ガイド

## 問題の原因
現在、Docker Desktop for Macには約3.8GBのメモリしか割り当てられていません。
gpt-oss:20bモデル（約13GB）を実行するには、Docker Desktopにより多くのメモリを割り当てる必要があります。

## 設定手順

### 1. Docker Desktopの設定を開く
1. メニューバーのDockerアイコンをクリック
2. 「Settings...」または「Preferences...」を選択

### 2. Resourcesタブを選択
1. 左側のメニューから「Resources」をクリック
2. 「Advanced」を選択（表示されている場合）

### 3. メモリを増やす
1. 「Memory」スライダーを移動
2. **推奨設定: 16GB以上**
   - gpt-oss:20bモデルには最低13.4GBが必要
   - システムやその他のコンテナ用の余裕を含めて16GB推奨
3. CPUsも4以上に設定することを推奨

### 4. 設定を適用
1. 「Apply & Restart」ボタンをクリック
2. Docker Desktopが再起動するまで待つ

## 設定確認
設定変更後、以下のコマンドで確認できます：
```bash
docker system info | grep -E "Total Memory|CPUs"
```

期待される出力：
```
CPUs: 4以上
Total Memory: 16GiB以上
```

## 設定変更後の手順

1. **Dockerコンテナを再起動**
```bash
docker compose down
docker compose up -d
```

2. **モデルを再設定**
backend/app/services/llm_service.pyのモデル設定を元に戻します：
```python
DEFAULT_LLM_MODEL = "gpt-oss:latest"  # または "gpt-oss:20b"
```

3. **バックエンドを再起動**
```bash
docker compose restart backend
```

## トラブルシューティング

### Docker Desktopの設定が保存されない場合
1. Docker Desktopを完全に終了
2. ターミナルで以下を実行：
```bash
osascript -e 'quit app "Docker"'
```
3. Docker Desktopを再起動して設定を変更

### メモリ設定スライダーが16GBまで行かない場合
macOSのシステム全体のメモリ使用状況を確認：
```bash
vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+)[^0-9]+(\d+)/ and printf("%-30s % 16.2f MB\n", "$1:", $2 * $size / 1048576);'
```

他のアプリケーションを終了してメモリを解放してください。

## 環境変数による最適化

docker-compose.ymlに追加した環境変数の説明：
- `OLLAMA_MAX_LOADED_MODELS=1`: 同時にロードするモデルを1つに制限
- `OLLAMA_NUM_PARALLEL=1`: 並列処理を1つに制限してメモリ使用を最適化
- `OLLAMA_KEEP_ALIVE=5m`: モデルを5分間メモリに保持（デフォルトは5分）

これらの設定により、メモリ使用効率が向上します。
