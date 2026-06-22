declare module "@tiptap/react" {
  import { ComponentType } from "react";
  export const useEditor: any;
  export const EditorContent: ComponentType<any>;
  export type Editor = any;
  export default useEditor;
}

declare module "@tiptap/starter-kit" {
  const content: any;
  export default content;
}

declare module "@tiptap/extension-image" {
  const content: any;
  export default content;
}

declare module "@tiptap/extension-link" {
  const content: any;
  export default content;
}
