'use client';

import { useState, useEffect, useMemo } from 'react';

import { Plate, usePlateEditor } from 'platejs/react';
// import type { Value } from 'platejs';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { Undo, Redo, Eraser, Trash2, X } from 'lucide-react';
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  H5Plugin,
  H6Plugin,
} from '@platejs/basic-nodes/react';
import { FontColorPlugin, FontBackgroundColorPlugin, TextAlignPlugin } from '@platejs/basic-styles/react';
import { ListPlugin } from '@platejs/list/react';
import { TogglePlugin } from '@platejs/toggle/react';
import { IndentPlugin } from '@platejs/indent/react';
import { LinkPlugin } from '@platejs/link/react';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import { BlockquoteElement } from '@/components/ui/blockquote-node';
import { ToggleElement } from '@/components/ui/toggle-node';
import { LinkElement } from '@/components/ui/link-node';
import { H1Element, H2Element, H3Element, H4Element, H5Element, H6Element } from '@/components/ui/heading-node';
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@platejs/code-block/react';
import { ToolbarButton } from '@/components/ui/toolbar';
import { TurnIntoToolbarButton } from '@/components/ui/turn-into-toolbar-button';
import { ExportToolbarButton } from '@/components/ui/export-toolbar-button';
import { ImportToolbarButton } from '@/components/ui/import-toolbar-button';
import { InsertToolbarButton } from '@/components/ui/insert-toolbar-button';
import { AIToolbarButton } from '@/components/ui/ai-toolbar-button';
import { CodeLeaf } from '@/components/ui/code-node';
import { FontColorToolbarButton } from '@/components/ui/font-color-toolbar-button';
import { AlignToolbarButton } from '@/components/ui/align-toolbar-button';
import { NumberedListToolbarButton, BulletedListToolbarButton, TodoListToolbarButton } from '@/components/ui/list-toolbar-button';
import { ToggleToolbarButton } from '@/components/ui/toggle-toolbar-button';
import { LinkToolbarButton } from '@/components/ui/link-toolbar-button';
import { all, createLowlight } from 'lowlight';
import { CodeBlockElement, CodeLineElement, CodeSyntaxLeaf } from '@/components/ui/code-block-node';
import { ColumnKit } from '@/components/column-kit';
import { TableKit } from '@/components/table-kit';
import { MediaKit } from '@/components/media-kit';
import { MathKit } from '@/components/math-kit';
import { DateKit } from '@/components/date-kit';
import { LinkKit } from '@/components/link-kit';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTagsStore } from '@/app/store/useTagsStore';

export default function NoteDetailPage() {
  // const params = useParams();
  // const { id } = params; // 获取动态参数
  const router = useRouter();
  const lowlight = createLowlight(all);
  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      H4Plugin.withComponent(H4Element),
      H5Plugin.withComponent(H5Element),
      H6Plugin.withComponent(H6Element),
      CodePlugin.configure({
        node: { component: CodeLeaf },
        shortcuts: { toggle: { keys: 'mod+e' } },
      }),
      CodeBlockPlugin.configure({
        node: { component: CodeBlockElement },
        options: { lowlight },
        shortcuts: { toggle: { keys: 'mod+alt+8' } },
      }),
      CodeLinePlugin.withComponent(CodeLineElement),
      CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
      BlockquotePlugin.withComponent(BlockquoteElement),
      FontColorPlugin, // 添加字体颜色插件
      FontBackgroundColorPlugin, // 添加字体背景颜色插件
      TextAlignPlugin, // 添加文本对齐插件
      ListPlugin, // 添加列表插件
      IndentPlugin, // 添加缩进插件（Toggle 所需）
      TogglePlugin.withComponent(ToggleElement), // 添加折叠内容插件
      LinkPlugin.withComponent(LinkElement), // 添加超链接插件
      ...ColumnKit,
      ...TableKit,
      ...MediaKit,
      ...MathKit,
      ...DateKit,
      ...LinkKit,
    ], // 添加标记插件
    // value: initialValue,         // 设置初始内容
  }); // 初始化编辑器实例


  // Tag state management - use Zustand store
  const { tags: storeTags, fetchTags, addTag, deleteTag: deleteTagFromStore } = useTagsStore();
  const [selectedTag, setSelectedTag] = useState('全部标签');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);

  // Transform store tags into display format with "全部标签" at the beginning
  const displayTags = useMemo(() => {
    const allTagsOption = { id: 'all', value: '全部标签', label: '全部标签' };
    const dbTags = storeTags.map(tag => ({
      id: tag.id,
      value: tag.value,
      label: tag.value
    }));
    return [allTagsOption, ...dbTags];
    // return [dbTags]
  }, [storeTags]);


  const handleTagChange = (value: string) => {
    if (value === 'new') {
      setIsDialogOpen(true);
    } else {
      setSelectedTag(value);
    }
  };

  console.log(12345)

  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      const result = await addTag(newTagName.trim());
      if (result.success && result.tag) {
        setSelectedTag(result.tag.value);
        setNewTagName('');
        setIsDialogOpen(false);
      } else {
        // 可以选择显示错误消息
        console.error('Failed to create tag:', result.error);
      }
    }
  };

  const handleDeleteTag = async (e: React.PointerEvent, tagId: string, tagValue: string) => {
    // 阻止冒泡
    e.stopPropagation();
    e.preventDefault(); // 防止Select的默认行为

    // 不能删除“全部标签”
    if (tagValue === '全部标签') return;

    await deleteTagFromStore(tagId);

    // 如果删除的是当前选中的标签，则切换到“全部标签”
    if (selectedTag === tagValue) {
      console.log('删除的是当前选中的标签');
      setSelectedTag('全部标签');
    } else {
      console.log('删除的不是当前选中的标签');
      setSelectedTag(selectedTag);
    }

  }

  return (
    <>
      {/* <h1>笔记 #{id}</h1> */}
      <div className="flex items-center">
        <Button onClick={() => router.push('/dashboard')} variant="link" className="mb-7 p-1 rounded-md hover:bg-gray-100 transition-colors">
          <ArrowLeft width={48} height={48} className="mr-2" />
        </Button>
        <h1 className="text-3xl font-bold mb-8">笔记详情</h1>
      </div>

      <Plate editor={editor}>      {/* 提供编辑器上下文 */}
        <FixedToolbar className="flex justify-start gap-1 w-fit">
          {/* Tag Selector */}
          <Select value={selectedTag} onValueChange={handleTagChange}>
            <SelectTrigger className="w-[120px] h-9 border-gray-200 bg-white hover:bg-gray-50">
              <SelectValue placeholder="全部标签" />
            </SelectTrigger>
            <SelectContent>
              {displayTags.map((tag: { id: string; value: string; label: string }) => (
                <SelectItem key={tag.id} value={tag.value} className="group relative">
                  <span>{tag.label}</span>
                  {tag.value !== '全部标签' && (
                    <button
                      type='button'
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteTag(e, tag.id, tag.value)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
                      aria-label="删除标签"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                </SelectItem>
              ))}
              <SelectItem value="new">+ 新建</SelectItem>
            </SelectContent>
          </Select>

          <ToolbarButton onClick={() => editor.undo()}>
            <Undo className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.redo()}>
            <Redo className="w-5 h-5" />
          </ToolbarButton>
          {/* 标记工具栏按钮 */}
          <AIToolbarButton />
          <ExportToolbarButton />
          <ImportToolbarButton />
          <InsertToolbarButton />
          <TurnIntoToolbarButton />
          <MarkToolbarButton nodeType="bold" tooltip="加粗 (⌘+B)">B</MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="斜体 (⌘+I)">I</MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="下划线 (⌘+U)">U</MarkToolbarButton>
          <MarkToolbarButton nodeType="strikethrough" tooltip="删除线 (⌘+S)">S</MarkToolbarButton>
          <MarkToolbarButton nodeType="code" tooltip="代码 (⌘+K)">C</MarkToolbarButton>

          <FontColorToolbarButton nodeType="color" tooltip="字体颜色">
            A
          </FontColorToolbarButton>
          <FontColorToolbarButton nodeType="backgroundColor" tooltip="背景颜色">
            BG
          </FontColorToolbarButton>
          <AlignToolbarButton />
          <NumberedListToolbarButton />
          <BulletedListToolbarButton />
          <TodoListToolbarButton />
          <ToggleToolbarButton />
          <LinkToolbarButton />
          <ToolbarButton 
            tooltip="清除内容" 
            className="bg-gray-100 hover:bg-gray-200"
            onClick={() => {
              editor.tf.reset();
              editor.tf.focus();
            }}
          >
            <Eraser className="w-5 h-5 text-gray-700" />
          </ToolbarButton>
          <ToolbarButton tooltip="删除" className="bg-red-100 hover:bg-red-200">
            <Trash2 className="w-5 h-5 text-red-600" />
          </ToolbarButton>
        </FixedToolbar>
        <EditorContainer>
          <Editor placeholder="输入您精彩的内容..." variant="none" className="w-full px-0 pt-4 pb-72 text-base" />
        </EditorContainer>
      </Plate>

      {/* New Tag Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新建标签</DialogTitle>
            <DialogDescription>
              为您的笔记创建一个新标签，方便分类管理。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tag-name" className="text-right">
                标签名称
              </Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTag();
                  }
                }}
                placeholder="输入标签名称..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTag}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}