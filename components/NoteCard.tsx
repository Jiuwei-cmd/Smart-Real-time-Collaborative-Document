

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function NoteCard({
  title,
  date,
  content,
  tag,
  isEditMode,
  selectedAllNotes,
}: {
  title: string;
  date: string;
  content: string;
  tag: string;
  isEditMode: boolean;
  selectedAllNotes: boolean;
}) {

  const [showHoverButton, setShowHoverButton] = useState(false); // 悬停按钮显示
  const [isSelected, setIsSelected] = useState(false); // 选中状态
  const router = useRouter();

  // 当isEditMode变化时，重置isSelected状态
  useEffect(() => {
    setIsSelected(false);

  }, [isEditMode]);

  // 当selectedAllNotes变化时，更新所有卡片的选中状态
  useEffect(() => {
    setIsSelected(selectedAllNotes);

  }, [selectedAllNotes]);

  const handleClick = () => {
    if (isEditMode) {
      setIsSelected(!isSelected);
    } else {
      router.push('/dashboard/notes')
    }
  }


  return (
    <div
      className='relative'
      onMouseEnter={() => setShowHoverButton(true)}
      onMouseLeave={() => setShowHoverButton(false)}
      onClick={handleClick}
    >
      {(isEditMode && (showHoverButton || isSelected)) && (
        <div
          className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 transition-colors duration-200 z-10 ${isSelected
            // ? 'bg-blue-500 border-blue-500' // 实心：背景+边框同色
            ? 'border-6 border-slate-950'
            : 'border-gray-500' // 空心：只有边框
            }`}
        />
      )}
      <Card
        className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isEditMode && isSelected && 'z-10 bg-gray-200 border-slate-950'}`}>
        <CardHeader className=" dark:bg-gray-900 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">新笔记</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">2025/12/18 11:13</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm line-clamp-4 mb-3">
            新笔记! 新笔记 带点回去五大年末能对town，什么是人工智能？什么是人工智能？简单来说——它让机器像人一样思考和学习。从识别你的脸解锁手机，到自动驾驶汽车在复杂路况中穿行，背后都是AI在运作。这种...
          </p>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              语文
            </span>
          </div>
        </CardContent>
        <CardFooter className="border-t">
          <span className="text-sm text-primary cursor-pointer mt-2 hover:underline ">查看详情 →</span>
        </CardFooter>
      </Card>
    </div>)
}