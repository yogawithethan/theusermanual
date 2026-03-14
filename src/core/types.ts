export type NodeType = "layer1" | "layer2" | "layer3" | "layer4" | "content";
export type ParentType = "root" | NodeType;
export type TemplateName = "pill-card" | "lesson-pill" | "lesson-page" | "preview-frame";
export type PreviewDevice = "desktop" | "tablet" | "mobile";

export interface ShadowConfig {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface ThemeConfig {
  id: string;
  fonts: {
    heading: string;
    subheading: string;
    body: string;
  };
  colors: {
    background: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
  };
  card: {
    radius: number;
    borderWidth: number;
    shadow: ShadowConfig;
  };
  effects: {
    uppercase: boolean;
    underline: boolean;
    italic: boolean;
    boldHeading: boolean;
  };
}

export interface SceneConfig {
  id: string;
  layout: string;
  background: {
    type: string;
    value: string;
  };
  navigation: {
    showSearch: boolean;
    showMenu: boolean;
    showAccount: boolean;
  };
  nodeLayout: {
    direction: string;
    gap: number;
    align: string;
  };
  preview: {
    deviceFrame: string;
    showCanvas: boolean;
  };
}

export interface SandboxConfig {
  id: string;
  title: string;
  rootNodeId: string;
  layerLabels: Record<NodeType, string>;
  allowedChildTypes: Record<ParentType, NodeType[]>;
  defaultTemplates: Record<NodeType, TemplateName>;
  defaultTheme: string;
  defaultScene: string;
}

interface BaseStoredNode {
  id: string;
  parentId: string | null;
  children: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RootNodeMeta extends BaseStoredNode {
  type: "root";
  title: string;
  slug: string;
  template: null;
  themeRef: string;
  sceneRef: string;
  icon: string | null;
  description: string | null;
  contentFile: null;
}

export interface NodeMeta extends BaseStoredNode {
  type: NodeType;
  title: string;
  slug: string;
  template: TemplateName;
  themeRef: string;
  sceneRef: string;
  icon: string | null;
  description: string | null;
  contentFile: string | null;
}

export type StoredNodeMeta = RootNodeMeta | NodeMeta;

export interface CreateNodeInput {
  type: NodeType;
  title: string;
  slug: string;
  parentId: string;
  index?: number;
  id?: string;
  template?: TemplateName;
  themeRef?: string;
  sceneRef?: string;
  icon?: string | null;
  description?: string | null;
  contentFile?: string | null;
}

export interface UpdateNodeInput {
  title?: string;
  slug?: string;
  template?: TemplateName;
  themeRef?: string;
  sceneRef?: string;
  icon?: string | null;
  description?: string | null;
  contentFile?: string | null;
}

export interface MoveNodeInput {
  nodeId: string;
  newParentId: string;
  index?: number;
}

export interface DuplicateNodeInput {
  nodeId: string;
  targetParentId?: string;
  index?: number;
}

export interface ReorderChildrenInput {
  parentId: string;
  orderedChildIds: string[];
}

export interface UpdateSandboxConfigInput extends Partial<SandboxConfig> {}
export interface UpdateThemeInput extends Partial<ThemeConfig> {}
export interface UpdateSceneInput extends Partial<SceneConfig> {}

export interface SelectionState {
  selectedNodeId: string | null;
  device: PreviewDevice;
}

export interface NodeActionAvailability {
  nodeId: string;
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  canPreview: boolean;
  canCreateChildren: boolean;
  allowedChildTypes: NodeType[];
}

export interface EditorColumnView {
  parentId: string;
  label: string;
  selectedNodeId: string | null;
  nodes: NodeMeta[];
}

export interface PreviewContext {
  node: StoredNodeMeta;
  ancestorChain: StoredNodeMeta[];
  theme: ThemeConfig;
  scene: SceneConfig;
  device: PreviewDevice;
  content: string | null;
}
