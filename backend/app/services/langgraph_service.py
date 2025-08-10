import logging
from typing import Dict, Any, List, TypedDict
from typing_extensions import Annotated
import json
from langgraph.graph import StateGraph, END, START

from .llm_service import OllamaService
from .vector_db_service import MilvusService

logger = logging.getLogger(__name__)

# LangGraphで使用する状態を定義
class RAGState(TypedDict):
    query: str
    context_url: str
    conversation_history: List[Dict[str, str]]
    top_k: int
    requires_rag: bool
    routing_reasoning: str
    answer: str
    sources: List[Dict[str, Any]]
    method: str

class IntelligentRAGService:
    def __init__(self, ollama_service: OllamaService, milvus_service: MilvusService):
        self.ollama = ollama_service
        self.milvus = milvus_service
        self.workflow = self._create_workflow()
        
    def _create_workflow(self):
        """LangGraphワークフローを作成"""
        workflow = StateGraph(RAGState)
        
        # ノードを定義
        workflow.add_node("route_query", self._route_query)
        workflow.add_node("perform_rag", self._perform_rag)
        workflow.add_node("direct_answer", self._direct_answer)
        
        # エッジを定義
        workflow.set_entry_point("route_query")
        
        # 条件分岐エッジ
        workflow.add_conditional_edges(
            "route_query",
            self._decide_next_step,
            {
                "rag": "perform_rag",
                "direct": "direct_answer"
            }
        )
        
        # 終了エッジ
        workflow.add_edge("perform_rag", END)
        workflow.add_edge("direct_answer", END)
        
        return workflow.compile()
        
    def _decide_next_step(self, state: RAGState) -> str:
        """RAGルーティングの結果に基づいて次のステップを決定"""
        return "rag" if state.get("requires_rag", True) else "direct"
    
    def _route_query(self, state: RAGState) -> RAGState:
        """クエリを分析してRAGが必要かどうか判断"""
        query = state["query"]
        context_url = state["context_url"]
        conversation_history = state.get("conversation_history", [])
        
        # RAG判定用のプロンプト
        routing_prompt = f"""あなたは質問を分析して、RAG（検索拡張生成）が必要かどうかを判断するエキスパートです。

与えられた質問について、提供されたURLのコンテンツから情報を検索する必要があるかどうかを判断してください。

コンテキストURL: {context_url}

質問: {query}

判断基準:
- URLのコンテンツに関する具体的な情報が必要な場合 → RAGが必要
- 文書の内容についての質問 → RAGが必要  
- 翻訳のみの要求 → RAGは不要
- 一般的な質問（URLコンテンツに関係ない） → RAGは不要
- 前回の会話の続きで新しい情報が不要 → RAGは不要

ただし、このアプリケーションは与えられたURLのコンテンツについて答えることが主な目的なので、迷った場合は積極的にRAGを使用してください。

以下のJSON形式で回答してください:
{{"requires_rag": true/false, "reasoning": "判断理由"}}"""
        
        try:
            # LLMでRAG必要性を判断
            messages = [
                {"role": "system", "content": routing_prompt},
                {"role": "user", "content": query}
            ]
            
            # 会話履歴がある場合は追加コンテキストとして提供
            if conversation_history:
                context_msg = f"前回の会話履歴:\n"
                for msg in conversation_history[-3:]:  # 直近3件のみ
                    context_msg += f"{msg['role']}: {msg['content']}\n"
                messages.insert(1, {"role": "system", "content": context_msg})
            
            # モデル名を取得
            from app.services.llm_service import GENERATION_MODEL
            model_name = GENERATION_MODEL if ':' in GENERATION_MODEL else f"{GENERATION_MODEL}:latest"
            
            response = self.ollama.client.chat(
                model=model_name,
                messages=messages
            )
            
            # JSON形式の回答をパース
            content = response['message']['content'].strip()
            if content.startswith('```json'):
                content = content[7:-3].strip()
            elif content.startswith('```'):
                content = content[3:-3].strip()
                
            result = json.loads(content)
            requires_rag = result.get("requires_rag", True)  # デフォルトはRAGを使用
            reasoning = result.get("reasoning", "判断できませんでした")
            
            logger.info(f"RAG判定結果: {requires_rag}, 理由: {reasoning}")
            
            # 状態を更新して返す
            return {
                **state,
                "requires_rag": requires_rag,
                "routing_reasoning": reasoning
            }
            
        except Exception as e:
            logger.error(f"RAG判定でエラー: {e}")
            # エラーの場合はRAGを使用する（安全側に倒す）
            return {
                **state,
                "requires_rag": True,
                "routing_reasoning": f"判定エラーのためRAGを使用: {str(e)}"
            }
    
    def _perform_rag(self, state: RAGState) -> RAGState:
        """RAGを実行して回答を生成"""
        query = state["query"]
        context_url = state["context_url"]
        conversation_history = state.get("conversation_history", [])
        top_k = state.get("top_k", 3)
        
        try:
            # 1. クエリをエンベディング
            query_embedding = self.ollama.generate_embedding(query)
            if not query_embedding:
                raise Exception("クエリのエンベディング生成に失敗")
            
            # 2. 関連コンテンツを検索
            search_results = self.milvus.search(
                query_embedding=query_embedding,
                context_url=context_url,
                top_k=top_k
            )
            
            if not search_results:
                return {
                    **state,
                    "answer": f"{context_url}のコンテンツから関連する情報を見つけることができませんでした。",
                    "sources": [],
                    "method": "rag"
                }
            
            # 3. コンテキストを構築
            context = "\n\n".join([f"ソースURL: {res['url']}\n内容: {res['text']}" for res in search_results])
            
            # 4. LLMで回答を生成（RAGコンテキスト付き）
            answer = self.ollama.generate_chat_response(query, context, conversation_history)
            
            return {
                **state,
                "answer": answer,
                "sources": search_results,
                "method": "rag"
            }
            
        except Exception as e:
            logger.error(f"RAG実行でエラー: {e}")
            return {
                **state,
                "answer": f"RAGでの回答生成に失敗しました: {str(e)}",
                "sources": [],
                "method": "rag_error"
            }
    
    def _direct_answer(self, state: RAGState) -> RAGState:
        """RAGなしで直接回答を生成"""
        query = state["query"]
        conversation_history = state.get("conversation_history", [])
        context_url = state["context_url"]
        
        try:
            # RAGなしでLLMが回答を生成
            # ただし、コンテキストURLについて言及する場合は注意するよう指示
            no_rag_context = f"""あなたは親切なアシスタントです。ユーザーの質問に答えてください。

注意: このアプリケーションは通常 {context_url} のコンテンツに基づいて答えることを目的としていますが、
この質問にはそのコンテンツの検索は不要と判断されました。

質問に適切に答えてください。もし質問が {context_url} の具体的な内容について聞いている場合は、
コンテンツを検索する必要があることを伝えてください。"""
            
            answer = self.ollama.generate_chat_response(query, no_rag_context, conversation_history)
            
            return {
                **state,
                "answer": answer,
                "sources": [],
                "method": "direct"
            }
            
        except Exception as e:
            logger.error(f"直接回答でエラー: {e}")
            return {
                **state,
                "answer": f"回答生成に失敗しました: {str(e)}",
                "sources": [],
                "method": "direct_error"
            }
    
    def process_query(self, query: str, context_url: str, conversation_history: List[Dict[str, str]] = None, top_k: int = 3) -> Dict[str, Any]:
        """クエリを処理してインテリジェントにRAGを適用"""
        initial_state = {
            "query": query,
            "context_url": context_url,
            "conversation_history": conversation_history or [],
            "top_k": top_k
        }
        
        try:
            # ワークフローを実行
            final_state = self.workflow.invoke(initial_state)
            return final_state
        except Exception as e:
            logger.error(f"ワークフロー実行でエラー: {e}")
            return {
                "answer": f"処理中にエラーが発生しました: {str(e)}",
                "sources": [],
                "method": "error",
                "requires_rag": True,
                "routing_reasoning": f"エラー: {str(e)}"
            }
    
    def process_query_stream(self, query: str, context_url: str, conversation_history: List[Dict[str, str]] = None, top_k: int = 3):
        """ストリーミング対応のクエリ処理"""
        # まずRAG判定を実行
        initial_state = {
            "query": query,
            "context_url": context_url,  
            "conversation_history": conversation_history or [],
            "top_k": top_k
        }
        
        try:
            # ルーティング判定を実行
            routing_state = self._route_query(initial_state)
            requires_rag = routing_state.get("requires_rag", True)
            
            if requires_rag:
                # RAGでストリーミング回答を生成
                yield from self._perform_rag_stream(routing_state)
            else:
                # 直接ストリーミング回答を生成
                yield from self._direct_answer_stream(routing_state)
                
        except Exception as e:
            logger.error(f"ストリーミング処理でエラー: {e}")
            yield {
                "type": "error",
                "content": f"処理中にエラーが発生しました: {str(e)}"
            }
    
    def _perform_rag_stream(self, state: Dict[str, Any]):
        """RAGでストリーミング回答を生成"""
        query = state["query"]
        context_url = state["context_url"]
        conversation_history = state.get("conversation_history", [])
        top_k = state.get("top_k", 3)
        
        try:
            # 1. エンベディングと検索
            query_embedding = self.ollama.generate_embedding(query)
            if not query_embedding:
                yield {"type": "error", "content": "クエリのエンベディング生成に失敗"}
                return
                
            search_results = self.milvus.search(
                query_embedding=query_embedding,
                context_url=context_url,
                top_k=top_k
            )
            
            # ソース情報を先に送信
            sources_data = {
                "type": "sources",
                "sources": search_results,
                "method": "rag"
            }
            yield sources_data
            
            if not search_results:
                yield {
                    "type": "content",
                    "content": f"{context_url}のコンテンツから関連する情報を見つけることができませんでした。"
                }
                return
            
            # 2. コンテキスト構築とストリーミング回答
            context = "\n\n".join([f"ソースURL: {res['url']}\n内容: {res['text']}" for res in search_results])
            
            # ストリーミング回答を生成
            for chunk in self.ollama.generate_chat_response_stream(query, context, conversation_history):
                if chunk:
                    yield {
                        "type": "content",
                        "content": chunk
                    }
                    
        except Exception as e:
            logger.error(f"RAGストリーミングでエラー: {e}")
            yield {
                "type": "error", 
                "content": f"RAGでの回答生成に失敗しました: {str(e)}"
            }
    
    def _direct_answer_stream(self, state: Dict[str, Any]):
        """RAGなしでストリーミング回答を生成"""
        query = state["query"]
        context_url = state["context_url"]
        conversation_history = state.get("conversation_history", [])
        
        try:
            # ソース情報（RAGなし）を送信
            sources_data = {
                "type": "sources",
                "sources": [],
                "method": "direct"
            }
            yield sources_data
            
            # RAGなしのコンテキスト
            no_rag_context = f"""あなたは親切なアシスタントです。ユーザーの質問に答えてください。

注意: このアプリケーションは通常 {context_url} のコンテンツに基づいて答えることを目的としていますが、
この質問にはそのコンテンツの検索は不要と判断されました。

質問に適切に答えてください。もし質問が {context_url} の具体的な内容について聞いている場合は、
コンテンツを検索する必要があることを伝えてください。"""
            
            # ストリーミング回答を生成
            for chunk in self.ollama.generate_chat_response_stream(query, no_rag_context, conversation_history):
                if chunk:
                    yield {
                        "type": "content",
                        "content": chunk
                    }
                    
        except Exception as e:
            logger.error(f"直接回答ストリーミングでエラー: {e}")
            yield {
                "type": "error",
                "content": f"回答生成に失敗しました: {str(e)}"
            }


# サービスインスタンス管理
intelligent_rag_service = None

def get_intelligent_rag_service():
    global intelligent_rag_service
    if intelligent_rag_service is None:
        from .llm_service import get_ollama_service
        from .vector_db_service import get_milvus_service
        
        ollama = get_ollama_service()
        milvus = get_milvus_service()
        intelligent_rag_service = IntelligentRAGService(ollama, milvus)
    
    return intelligent_rag_service
