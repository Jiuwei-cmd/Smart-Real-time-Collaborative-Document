

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTagColorClasses } from '@/lib/utils/tagColors';
import { cn } from '@/lib/utils';
import { useSelectedNotesStore } from '@/app/store/useSelectedNotesStore';
import { highlightText } from '@/components/ui/highlightText';
import { Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUserProfileStore } from '@/app/store/useUserProfileStore';
import { getAcceptedFriends } from '@/lib/api/friends';
import { UserProfile } from '@/lib/api/users';
import { shareDocument } from '@/lib/api/shares';
import { toast } from 'sonner';

export function NoteCard({
  noteId,
  title,
  date,
  content,
  tag,
  tagColor = 'blue',
  isEditMode,
  selectedAllNotes,
  searchKeyword,
}: {
  noteId: string;
  title: string;
  date: string;
  content: string;
  tag: string;
  tagColor?: string;
  isEditMode: boolean;
  selectedAllNotes: boolean;
  searchKeyword?: string;
}) {

  const { selectedNoteIds, toggleNoteSelection, clearSelection } = useSelectedNotesStore();
  const isSelected = selectedNoteIds.has(noteId);
  const router = useRouter();
  const profile = useUserProfileStore((state) => state.profile);
  
  // 分享对话框状态
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      clearSelection();
    }
  }, [isEditMode, clearSelection]);

  useEffect(() => {
    // 当全选状态变化时，如果当前选中状态与全选状态不一致，则切换
    if (selectedAllNotes !== isSelected) {
      toggleNoteSelection(noteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAllNotes]);

  const handleClick = () => {
    if (isEditMode) {
      toggleNoteSelection(noteId);
    } else {
      router.push(`/dashboard/notes?id=${noteId}`);
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
    setIsShareDialogOpen(true);
    
    // 获取好友列表
      setIsLoadingFriends(true);
      try {
        const friendsList = await getAcceptedFriends(profile!.id);
        setFriends(friendsList);
      } catch (error) {
        console.error('获取好友列表失败:', error);
      } finally {
        setIsLoadingFriends(false);
      }
  }

  const handleShareToFriend = async (friendId: string, friendName: string) => {
    if (!profile?.id) {
      toast.error('错误', {
        description: '无法获取用户信息',
        duration: 3000,
      });
      return;
    }

    try {
      // 调用 API 分享笔记（传入 owner_id）
      await shareDocument(noteId, friendId, profile.id);
      
      // 显示成功提示
      toast.success('分享成功', {
        description: `已成功分享给 ${friendName}`,
        duration: 3000,
      });
      
      setIsShareDialogOpen(false);
    } catch (error) {
      console.error('分享失败:', error);
      
      // 显示错误提示
      toast.error('分享失败', {
        description: '请稍后重试',
        duration: 3000,
      });
    }
  }

  return (
    <div
      className='relative'
      onClick={handleClick}
    >
      {/* 编辑模式：显示选择圆圈 */}
      {isEditMode && (
        <div
          className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 transition-colors duration-200 z-10 ${isSelected
            ? 'border-6 border-slate-950'
            : 'border-gray-500'
            }`}
        />
      )}
      
      {/* 非编辑模式：显示分享按钮 */}
      {!isEditMode && (
        <button
          onClick={handleShare}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:shadow-md hover:bg-accent hover:scale-110 transition-all duration-200 group"
          title="分享笔记"
        >
          <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      )}
      
      <Card
        className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
          isEditMode && isSelected 
            ? 'z-10 bg-gray-200 border-slate-950' 
            : isEditMode 
            ? 'bg-gray-100'
            : ''
        }`}>
        <CardHeader className=" dark:bg-gray-900 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {highlightText(title, searchKeyword || '')}
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">{date}</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm line-clamp-4 mb-3 leading-relaxed break-all h-[5.2rem]">
            {highlightText(content, searchKeyword || '')}
          </p>
          <div className="flex items-center">
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              getTagColorClasses(tagColor)
            )}>
              {tag}
            </span>
          </div>
        </CardContent>
        <CardFooter className="border-t">
          <span className="text-sm text-primary cursor-pointer mt-2 hover:underline ">查看详情 →</span>
        </CardFooter>
      </Card>

      {/* 分享给好友对话框 */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>分享笔记给好友</DialogTitle>
            <DialogDescription>
              选择要分享「{title}」的好友
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto py-4">
            {isLoadingFriends ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-8 w-8 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-muted-foreground">加载好友列表中...</p>
                </div>
              </div>
            ) : friends.length > 0 ? (
              friends.map((friend) => (
                <div 
                  key={friend.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* 好友头像 */}
                  {friend.avatar_url ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback>
                        {friend.nickname?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold">
                        {friend.nickname?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  
                  {/* 好友信息 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {friend.nickname || '未知用户'}
                    </h4>
                  </div>
                  
                  {/* 分享按钮 */}
                  <Button
                    size="sm"
                    onClick={() => handleShareToFriend(friend.id, friend.nickname || '未知用户')}
                    className="flex-shrink-0"
                  >
                    分享
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">暂无好友</p>
                  <p className="text-xs text-muted-foreground">添加好友后即可分享笔记</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>)
}