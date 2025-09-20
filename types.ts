export interface Edge {
  id: string;
  from: string; // source node id
  to: string; // target node id
}

export interface NodeType {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'text' | 'image' | 'youtube' | 'website' | 'code' | 'audio' | 'video' | 'loading' | 'search_result' | 'screen';
  content: any;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    image?: { data: string; mimeType: string };
    reference?: NodeType;
    model?: string;
    tokenCount?: number;
}

export interface Project {
  id:string;
  name: string;
  updatedAt: string; // ISO string
  nodes: NodeType[];
  chatHistory: ChatMessage[];
  edges: Edge[];
}