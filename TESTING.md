# Testing Guide

このドキュメントでは、RAG-based Web Content Chat Applicationのテストの実行方法について説明します。

## 概要

このプロジェクトには以下のテストが含まれています：

### バックエンドテスト (FastAPI + pytest)
- API エンドポイントのテスト
- エラーハンドリングのテスト
- サービス層のモックテスト
- リクエスト/レスポンスバリデーションのテスト

### フロントエンドテスト (React + Vitest + Testing Library)
- コンポーネントのレンダリングテスト
- ユーザーインタラクションのテスト
- API統合のモックテスト
- UIの状態変更テスト

## セットアップ

### バックエンドテストのセットアップ

1. バックエンドディレクトリに移動：
```bash
cd backend
```

2. Python仮想環境を作成・有効化：
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows
```

3. 依存関係をインストール：
```bash
pip install -r requirements.txt
```

### フロントエンドテストのセットアップ

1. フロントエンドディレクトリに移動：
```bash
cd frontend
```

2. 依存関係をインストール：
```bash
npm install
```

## テスト実行

### バックエンドテストの実行

```bash
cd backend

# 全テストを実行
pytest

# より詳細な出力でテストを実行
pytest -v

# 特定のテストファイルを実行
pytest tests/test_main.py

# 特定のテスト関数を実行
pytest tests/test_chat.py::TestChatEndpoint::test_chat_success

# カバレッジレポート付きでテスト実行
pytest --cov=app --cov-report=html
```

### フロントエンドテストの実行

```bash
cd frontend

# 全テストを実行
npm test

# ウォッチモードでテスト実行
npm run test

# UIモードでテスト実行（ブラウザで結果を表示）
npm run test:ui

# 特定のテストファイルを実行
npx vitest src/test/Chat.test.tsx

# カバレッジレポート付きでテスト実行
npx vitest --coverage
```

## テストファイル構成

### バックエンド
```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # テスト設定とフィクスチャ
│   ├── test_main.py         # メインアプリケーションのテスト
│   ├── test_chat.py         # チャットAPIのテスト
│   ├── test_contexts.py     # コンテキストAPIのテスト
│   └── test_scrape.py       # スクレイピングAPIのテスト
└── pytest.ini              # pytest設定
```

### フロントエンド
```
frontend/
├── src/
│   └── test/
│       ├── setup.ts              # テストセットアップ
│       ├── App.test.tsx          # アプリケーション全体のテスト
│       ├── Chat.test.tsx         # チャットコンポーネントのテスト
│       ├── ContextSelector.test.tsx  # コンテキスト選択のテスト
│       └── IngestionForm.test.tsx    # URL取り込みフォームのテスト
└── vitest.config.ts         # Vitest設定
```

## テスト内容

### バックエンドテスト

1. **API エンドポイントテスト**
   - 正常系のレスポンステスト
   - エラーケースの処理テスト
   - リクエストバリデーションテスト

2. **サービス層テスト**
   - Ollama, Milvus, スクレイピングサービスのモックテスト
   - サービス接続エラーの処理テスト

3. **統合テスト**
   - APIエンドポイント間の連携テスト

### フロントエンドテスト

1. **コンポーネントレンダリングテスト**
   - 各コンポーネントの正常な表示確認
   - プロパティによる表示変更の確認

2. **ユーザーインタラクションテスト**
   - フォーム送信のテスト
   - ボタンクリックの動作確認
   - 入力値の変更テスト

3. **API統合テスト**
   - APIエラー時の適切な表示
   - ローディング状態の確認
   - レスポンスデータの正常な処理

## モック戦略

### バックエンド
- 外部サービス（Ollama, Milvus）は全てモック
- HTTPリクエスト・レスポンスのテストに集中
- 依存性注入を活用したテスタビリティ

### フロントエンド
- fetchAPIのモック
- UIライブラリ（toast等）のモック
- コンポーネント間の相互作用テスト

## CI/CD での実行

### GitHub Actions 例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run tests
        run: |
          cd frontend
          npm test
```

## トラブルシューティング

### よくある問題

1. **TypeScript エラー**: 依存関係が正しくインストールされていない
   - 解決策: `npm install` を再実行

2. **Import エラー**: パスエイリアスの設定問題
   - 解決策: `tsconfig.json` と `vitest.config.ts` の設定を確認

3. **Mock エラー**: モジュールが正しくモックされていない
   - 解決策: モックの設定を確認し、必要に応じて `vi.clearAllMocks()` を使用

## テスト追加のガイドライン

新しいテストを追加する際は：

1. **バックエンド**
   - 新しいAPIエンドポイントには対応するテストを追加
   - エラーケースも含めた包括的なテスト
   - モックを使用してサービス依存関係を分離

2. **フロントエンド**  
   - 新しいコンポーネントには対応するテストを追加
   - ユーザーの操作フローをテスト
   - API呼び出しはモックを使用

このテスト構成により、アプリケーションの品質を保証し、リグレッションを防ぐことができます。