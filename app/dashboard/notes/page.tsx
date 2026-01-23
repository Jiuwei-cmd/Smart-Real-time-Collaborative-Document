'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { debounce } from 'lodash';
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
import { ColumnKit } from '@/components/editor/plugins/column-kit';
import { TableKit } from '@/components/editor/plugins/table-kit';
import { MediaKit } from '@/components/editor/plugins/media-kit';
import { MathKit } from '@/components/editor/plugins/math-kit';
import { DateKit } from '@/components/editor/plugins/date-kit';
import { LinkKit } from '@/components/editor/plugins/link-kit';
import { AIKit } from '@/components/editor/plugins/ai-kit';
import { SuggestionKit } from '@/components/editor/plugins/suggestion-kit';
import { CommentKit } from '@/components/editor/plugins/comment-kit';
import { BlockMenuKit } from '@/components/editor/plugins/block-menu-kit';
import { FloatingToolbarKit } from '@/components/editor/plugins/floating-toolbar-kit';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTagsStore } from '@/app/store/useTagsStore';
import { useNoteStore } from '@/app/store/useNoteStore';
import { toast } from 'sonner';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { dbHelpers } from '@/lib/db/localDB';
import { formatRelativeTime } from '@/lib/utils/timeUtils';
import { NetworkStatusBanner } from '@/components/ui/network-status-banner';
import { fetchNoteById } from '@/lib/api/notes';

export default function NoteDetailPage() {
  // 获取 URL 查询参数
  const searchParams = useSearchParams();
  const noteId = searchParams.get('id'); // 如果是新建笔记，id 为 null；如果是编辑，id 为笔记ID
  
  const router = useRouter();
  const lowlight = createLowlight(all);
  
  // 网络状态和自动同步
  const isOnline = useNetworkStatus();
  useAutoSync();
  
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
      // BlockSelectionPlugin, // Required by AIKit for block selection functionality
      ...AIKit,
      ...SuggestionKit,
      ...CommentKit,
      ...BlockMenuKit,
      ...FloatingToolbarKit, // Floating toolbar for text selection
    ], // 添加标记插件
    // value: initialValue,         // 设置初始内容
  }); // 初始化编辑器实例


  // Note title state
  const [noteTitle, setNoteTitle] = useState('');
  
  // 保存状态提示
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  
  // 离线保存状态
  const [offlineSaving, setOfflineSaving] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  
  // 跟踪笔记是否已加载，避免重复加载
  const loadedNoteId = useRef<string | null>(null);

  // Tag state management - use Zustand store
  const { tags: storeTags, fetchTags, addTag, deleteTag: deleteTagFromStore } = useTagsStore();
  const [selectedTag, setSelectedTag] = useState('全部标签');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Note state management - use Zustand store
  const { notes, saveNote, updateNote, loading } = useNoteStore();

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);

  // 根据 noteId 加载笔记内容
  // 注意：这里需要在 useEffect 中设置状态来初始化编辑器内容，这是合理且必要的
  useEffect(() => {
    // 如果是编辑模式且笔记还未加载
    if (noteId && loadedNoteId.current !== noteId) {
      console.log('正在编辑笔记，ID:', noteId);
      
      // 定义加载笔记的异步函数
      const loadNote = async () => {
        // 先从 notes 数组中找到对应的笔记
        let note = notes.find(n => n.id === noteId);
        
        // 如果本地没有找到（可能是被分享的笔记），则从数据库获取
        if (!note) {
          console.log('本地未找到笔记，尝试从数据库获取（可能是分享的笔记）');
          note = await fetchNoteById(noteId);
        }
        
        if (note) {
          // 💾 保存到 IndexedDB（离线编辑准备）
          dbHelpers.saveCurrentEditingNote(note).then(() => {
            console.log('✅ 笔记已缓存到本地，支持离线编辑');
          });
          
          // 设置标题
          // eslint-disable-next-line react-hooks/exhaustive-deps
          setNoteTitle(note.title);
          
          // 设置标签 - 根据 tag_id 找到对应的 tag value
          if (note.tag_id) {
            const tag = storeTags.find(t => t.id === note.tag_id);
            if (tag) {
              setSelectedTag(tag.value);
            }
          } else {
            setSelectedTag('全部标签');
          }
          
          // 设置编辑器内容 - content 是 JSON 字符串，需要解析
          try {
            const contentData = JSON.parse(note.content);
            editor.tf.setValue(contentData);
          } catch (error) {
            console.error('解析笔记内容失败:', error);
          }
          
          // 标记为已加载
          loadedNoteId.current = noteId;
        } else {
          console.warn('未找到对应的笔记，ID:', noteId);
          toast.error('笔记不存在或无权限访问');
        }
      };
      
      // 调用加载函数
      loadNote();
    } else if (!noteId) {
      console.log('正在新建笔记');
      // 重置加载标志
      loadedNoteId.current = null;
    }
  }, [noteId, notes, storeTags, editor]);

  // 监听 loading 状态变化
  useEffect(() => {
    // 当 loading 从 true 变为 false，说明保存完成
    if (!loading && noteId) {
      setShowSavedMessage(true);
      
      // 5分钟后隐藏"已保存"提示
      const timer = setTimeout(() => {
        setShowSavedMessage(false);
      }, 300000);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, noteId]);

  // 监听 noteId 变化，切换笔记时重置保存状态
  useEffect(() => {
    // 当切换到不同的笔记时，重置所有保存状态
    setShowSavedMessage(false);
    setOfflineSaving(false);
    setOfflineSaved(false);
  }, [noteId]);

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

  // 使用 useMemo 和 lodash debounce 实现自动保存
  const debouncedAutoSave = useMemo(
    () => debounce(async () => {
      // 如果标题为空，不自动保存
      if (!noteTitle.trim()) {
        console.log('标题为空，跳过自动保存');
        return;
      }
      
      // 获取编辑器内容
      const editorContent = editor.children;
      
      // 找到选中标签的 ID
      const tagId = selectedTag === '全部标签' 
        ? null 
        : storeTags.find(tag => tag.value === selectedTag)?.id || null;
      
      let result;
      
      // 🌐 检查网络状态
      if (!isOnline && noteId) {
        // 离线模式：只能编辑已存在的笔记
        console.log('📴 离线模式：保存到本地');
        
        // 设置离线保存中状态
        setOfflineSaving(true);
        
        // 保存到 IndexedDB，标记为待同步
        const localNote = {
          id: noteId,
          user_id: notes.find(n => n.id === noteId)?.user_id || '',
          title: noteTitle,
          content: JSON.stringify(editorContent),
          tag_id: tagId,
          created_at: notes.find(n => n.id === noteId)?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false
        };
        
        // 使用isPending=true标记为待同步
        await dbHelpers.saveCurrentEditingNote(localNote, true);
        
        // 设置离线已保存状态
        setOfflineSaving(false);
        setOfflineSaved(true);
        
        // 5分钟后隐藏"已保存"提示
        setTimeout(() => {
          setOfflineSaved(false);
        }, 300000);
        
        return;
      } else if (!isOnline && !noteId) {
        // 离线时无法新建笔记
        toast.warning('离线模式', {
          description: '请连接网络后再新建笔记'
        });
        return;
      }
      
      // 在线模式：正常保存到云端
      if (noteId) {
        result = await updateNote(noteId, noteTitle, editorContent, tagId);
      } else {
        result = await saveNote(noteTitle, editorContent, tagId);
        
        // 🔑 关键：首次保存成功后，更新 URL，避免重复创建
        if (result.success && result.note) {
          const newNoteId = result.note.id;
          // 使用 replace 而不是 push，避免增加历史记录
          router.replace(`/dashboard/notes?id=${newNoteId}`);
        }
      }
      
      if (result?.success) {
        console.log('✅ 自动保存成功');
      } else {
        console.error('❌ 自动保存失败:', result?.error);
      }
    }, 2000), // 2秒防抖延迟
    [noteId, noteTitle, selectedTag, storeTags, editor, updateNote, saveNote, router, isOnline, notes] // 依赖项
  );
  
  // 清理防抖函数
  useEffect(() => {
    return () => {
      debouncedAutoSave.cancel();
    };
  }, [debouncedAutoSave]);

  const handleEditorChange = () => {
    // 触发防抖的自动保存
    debouncedAutoSave();
  }

  // 监听标题和标签变化，触发自动保存
  useEffect(() => {
    // 只有在有标题的情况下才触发（避免初始化时触发）
    if (noteTitle.trim()) {
      debouncedAutoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteTitle, selectedTag]);

  return (
    <>
      {/* <h1>笔记 #{id}</h1> */}
      <div className="flex items-center">
        <Button onClick={() => router.push('/dashboard')} variant="link" className="mb-7 p-1 rounded-md hover:bg-gray-100 transition-colors">
          <ArrowLeft width={48} height={48} className="mr-2" />
        </Button>
        <h1 className="text-3xl font-bold mb-8">笔记详情</h1>
      </div>

      <NetworkStatusBanner />

      <Plate editor={editor} onChange={handleEditorChange}>      {/* 提供编辑器上下文 */}
        <FixedToolbar className="relative flex justify-start gap-1 w-fit">
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
        
        {/* 最近修改时间提示 - 绝对定位在工具栏下方 */}
        <div className="absolute top-52 mt-2 right-77">
          <span className="text-sm text-gray-400">
            {!isOnline ? (
              // 离线状态
              offlineSaving ? (
                '保存本地中...'
              ) : offlineSaved ? (
                '已经保存到本地'
              ) : (
                '离线'
              )
            ) : loading ? (
              '保存中...'
            ) : showSavedMessage ? (
              <span>已经保存到云端</span>
            ) : (
              <>
                最近修改：
                {noteId && notes.length > 0 && (() => {
                  const currentNote = notes.find(n => n.id === noteId);
                  return currentNote?.updated_at ? formatRelativeTime(currentNote.updated_at) : '';
                })()}
              </>
            )}
          </span>
        </div>
        
        {/* Note Title Input */}
        <div className="w-full px-0 pt-2 pb-2">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="请输入标题"
            className="w-full text-2xl font-bold border-none outline-none focus:outline-none placeholder:text-gray-300 bg-transparent mb-5 mt-5"
          />
        </div>
        
        <EditorContainer>
          <Editor placeholder="这里是笔记正文内容..." variant="none" className="w-full px-0 pt-0 pb-72 text-base" />
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