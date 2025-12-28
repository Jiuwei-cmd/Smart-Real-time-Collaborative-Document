'use client';
// app/dashboard/page.tsx
import { Button } from '@/components/ui/button';
import { Plus, Search, EditIcon, RotateCcw, X, Trash2, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NoteCard } from '@/components/NoteCard';



export default function DashboardHomePage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAllNotes, setSelectedAllNotes] = useState(false);

  return (
    <div className=" mx-auto w-full">
      {/* 新增笔记搜索框，里面的内容靠两边对齐 */}
      <div className="flex items-center justify-between mb-6 ">
        <div className='mr-2 ml-2'>
          <input
            type="text"
            placeholder="输入搜索关键词..."
            className="w-100 mr-2 px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button className="px-4 mr-2 py-5">
            <Search className="mr-1 h-4 w-4 text-muted-foreground" />
            搜索
          </Button>
          {/* 增加一个重置按钮 */}
          <Button className="px-4 py-5 " variant="outline">
            <RotateCcw className="mr-1 h-4 w-4 text-muted-foreground" />
            重置
          </Button>
        </div>

        {/* 标签类型筛选区域 */}
        <div className="flex items-center gap-2">
          <span>标签类型：</span>
          {/* 下拉菜单 */}
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent className='mt-10'>
              <SelectGroup>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">我的笔记</h2>
      </div>

      <div className="flex justify-between items-center mb-6">
        {!isEditMode ? (
          <Button variant="outline" onClick={() => setIsEditMode(true)}>
            <EditIcon className="h-4 w-4" />
            编辑笔记
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditMode(false)} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              取消
            </Button>
            <Button variant="outline" onClick={() => setSelectedAllNotes(!selectedAllNotes)} className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              全选
            </Button>
            <Button variant="destructive" onClick={() => console.log('删除功能待实现')} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              删除 (0)
            </Button>
          </div>
        )}
        <Button asChild>
          <Link href="/dashboard/notes/new">
            <Plus className="h-4 w-4" />
            新建笔记
          </Link>
        </Button>
      </div>

      {/* 笔记列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {/* 笔记卡片 1 */}
        {[1, 2, 3, 4, 5, 6, 7].map((index) => (
          <NoteCard
            key={index}
            title={`新笔记 ${index}`}
            date="2025/12/18 11:13"
            content={`新笔记! 新笔记 带点回去五大年末能对town，什么是人工智能？什么是人工智能？简单来说——它让机器像人一样思考和学习。从识别你的脸解锁手机，到自动驾驶汽车在复杂路况中穿行，背后都是AI在运作。这种...`}
            tag="语文"
            isEditMode={isEditMode}
            selectedAllNotes={selectedAllNotes}
          />
        ))}


      </div>
    </div>
  );
}