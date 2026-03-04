'use client';
// app/dashboard/page.tsx
import { Button } from '@/components/ui/button';
import { Plus, Search, EditIcon, RotateCcw, X, Trash2, CheckSquare } from 'lucide-react';
import { Spinner } from "@/components/ui/spinner"
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { NoteCard } from '@/components/editor/plugins/NoteCard';
import { useTagsStore } from '@/app/store/useTagsStore';
import { useNoteStore } from '@/app/store/useNoteStore';
import { useSelectedNotesStore } from '@/app/store/useSelectedNotesStore';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils/timeUtils';



export default function DashboardHomePage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAllNotes, setSelectedAllNotes] = useState(false);
  const [selectedTag, setSelectedTag] = useState('全部标签');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6); // 每页显示6条
  
  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');

  // Tag state management - use Zustand store
  const { tags: storeTags, fetchTags } = useTagsStore();
  
  // Note state management - use Zustand store
  const { notes, totalCount, fetchNotes, deleteNote, loading } = useNoteStore();
  
  // Selected notes state management
  const { selectedNoteIds, getSelectedCount, clearSelection, selectAll } = useSelectedNotesStore();
  const selectedCount = getSelectedCount();

  // 搜索输入框引用
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Transform store tags into display format with "全部标签" at the beginning
  const displayTags = useMemo(() => {
    const allTagsOption = { id: 'all', value: '全部标签', label: '全部标签' };
    const dbTags = storeTags.map(tag => ({
      id: tag.id,
      value: tag.value,
      label: tag.value
    }));
    return [allTagsOption, ...dbTags];
  }, [storeTags]);

  // 分页计算逻辑 - 使用服务端返回的totalCount
  const totalPages = Math.ceil(totalCount / pageSize);

  // 当页码、标签或搜索关键词变化时，重新获取数据
  useEffect(() => {
    // 根据 selectedTag 找到对应的 tagId
    const selectedTagObj = storeTags.find(tag => tag.value === selectedTag);
    const tagId = selectedTag === '全部标签' ? null : selectedTagObj?.id || null;
    
    fetchNotes(currentPage, pageSize, tagId, searchKeyword);
  }, [currentPage, pageSize, selectedTag, searchKeyword, fetchNotes, storeTags]);

  // 当页码、标签或搜索关键词变化时，重置选择状态
  useEffect(() => {
    setSelectedAllNotes(false);
    clearSelection();
  }, [currentPage, selectedTag, searchKeyword, clearSelection]);

  // 当标签或搜索关键词变化时，重置页码为1
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTag, searchKeyword]);

  // 分页操作函数
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 搜索功能
  const handleSearch = () => {
    const keyword = searchInputRef.current?.value || '';
    setSearchKeyword(keyword.trim());
  };

  // 重置功能
  const handleReset = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setSearchKeyword('');
  };

  const handleDeleteClick = () => {
    // 将 Set 转换为数组
    const noteIdsArray = Array.from(selectedNoteIds);
    const confirmMessage = noteIdsArray.length === 1 
      ? '确定要删除这条笔记吗？' 
      : `确定要删除选中的 ${noteIdsArray.length} 条笔记吗？`;
    
    setDialogMessage(confirmMessage);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const noteIdsArray = Array.from(selectedNoteIds);
    setShowDeleteDialog(false);

    // 调用删除方法
    const result = await deleteNote(noteIdsArray);
    
    if (result.success) {
      // 删除成功，清空选择并退出编辑模式
      clearSelection();
      setSelectedAllNotes(false);
      setIsEditMode(false);
      
      // 检查删除后是否需要返回前一页
      // 如果删除后当前页会变成空页，且不在第一页，则返回前一页
      const remainingCount = totalCount - noteIdsArray.length;
      const newTotalPages = Math.ceil(remainingCount / pageSize);
      
      if (currentPage > newTotalPages && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        // 如果不需要返回前一页，重新获取当前页数据以填充空位
        const selectedTagObj = storeTags.find(tag => tag.value === selectedTag);
        const tagId = selectedTag === '全部标签' ? null : selectedTagObj?.id || null;
        fetchNotes(currentPage, pageSize, tagId, searchKeyword);
      }
      
      toast.success('删除成功！', {
        description: `成功删除 ${noteIdsArray.length} 条笔记`,
        duration: 3000,
      });
    } else {
      toast.error('删除失败！', {
        description: `删除失败: ${result.error}`,
        duration: 3000,
      });
    }
  };

  return (
    <div className=" mx-auto w-full">
      {/* 新增笔记搜索框，里面的内容靠两边对齐 */}
      <div className="flex items-center justify-between mb-6 ">
        <div className='mr-2 ml-2'>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="输入搜索关键词..."
            className="w-100 mr-2 px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Button className="px-4 mr-2 py-5" onClick={handleSearch}>
            <Search className="mr-1 h-4 w-4 text-muted-foreground" />
            搜索
          </Button>
          {/* 增加一个重置按钮 */}
          <Button className="px-4 py-5 " variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-1 h-4 w-4 text-muted-foreground" />
            重置
          </Button>
        </div>

        {/* 标签类型筛选区域 */}
        <div className="flex items-center gap-2">
          <span>标签类型：</span>
          {/* 下拉菜单 */}
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="全部标签" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {displayTags.map((tag: { id: string; value: string; label: string }) => (
                  <SelectItem key={tag.id} value={tag.value}>
                    {tag.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">我的文档</h2>
      </div>

      <div className="flex justify-between items-center mb-6">
        {!isEditMode ? (
          notes.length > 0 && (
            <Button variant="outline" onClick={() => setIsEditMode(true)}>
              <EditIcon className="h-4 w-4" />
              编辑文档
            </Button>
          )
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditMode(false);
                setSelectedAllNotes(false);
                clearSelection();
              }} 
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              取消
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const newState = !selectedAllNotes;
                setSelectedAllNotes(newState);
                if (newState) {
                  selectAll(notes.map(note => note.id));
                } else {
                  clearSelection();
                }
              }} 
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              全选
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteClick} 
              className="flex items-center gap-2"
              disabled={selectedCount === 0}
            >
              <Trash2 className="h-4 w-4" />
              删除 ({selectedCount})
            </Button>
          </div>
        )}
        {notes.length > 0 && (
          <Button asChild>
            <Link href="/dashboard/notes">
              <Plus className="h-4 w-4" />
              新建文档
            </Link>
          </Button>
        )}
      </div>

      {/* 笔记列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {notes.map((note) => {
            // 查找笔记对应的标签信息
            const noteTag = storeTags.find(tag => tag.id === note.tag_id);
            
            // 解析笔记内容并提取纯文本预览
            const getContentPreview = (content: string) => {
              try {
                const contentObj = JSON.parse(content);
                const texts = contentObj.map((block: any) => {
                  return block.children?.map((child: any) => child.text).join('') || '';
                }).join(' ');
                return texts.substring(0, 150) + '...';
              } catch {
                return '暂无内容...';
              }
            };
            
            return (
              <NoteCard
                key={note.id}
                noteId={note.id}
                title={note.title || '无标题'}
                date={formatDateTime(note.updated_at)}
                content={getContentPreview(note.content)}
                tag={noteTag?.value || '未分类'}
                tagColor={noteTag?.color || 'blue'}
                isEditMode={isEditMode}
                selectedAllNotes={selectedAllNotes}
                searchKeyword={searchKeyword}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32">
          {/* 图标容器 - 带渐变背景 */}
          <Link href="/dashboard/notes" className="block mb-8 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl rounded-full group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all"></div>
              <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10 p-8 rounded-full group-hover:from-primary/20 group-hover:to-purple-500/20 transition-all group-hover:scale-110 transform duration-300">
                <Plus className="h-20 w-20 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          </Link>
          
          {/* 文字内容 */}
          <h3 className="text-2xl font-bold text-foreground mb-2">开始您的第一篇笔记</h3>
          <p className="text-muted-foreground text-center max-w-md">
            记录想法、整理思绪、创作内容 —— 一切从这里开始
          </p>
          
          {/* 小提示 */}
          <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">✓</span>
              </div>
              <span>支持富文本编辑</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">✓</span>
              </div>
              <span>云端自动保存</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">✓</span>
              </div>
              <span>标签分类管理</span>
            </div>
          </div>
        </div>
      )}

      {/* 分页组件 */}
      {notes.length > 0 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {(() => {
                const pages = [];
                const maxButtons = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                const endPage = Math.min(totalPages, startPage + maxButtons - 1);

                if (endPage - startPage + 1 < maxButtons) {
                  startPage = Math.max(1, endPage - maxButtons + 1);
                }

                // 显示第一页
                if (startPage > 1) {
                  pages.push(
                    <PaginationItem key={1}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(1);
                        }}
                        isActive={currentPage === 1}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                }

                // 显示中间页码
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(i);
                        }}
                        isActive={currentPage === i}
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                // 显示最后一页
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  pages.push(
                    <PaginationItem key={totalPages}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }}
                        isActive={currentPage === totalPages}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                return pages;
              })()}

              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  正在删除...
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}