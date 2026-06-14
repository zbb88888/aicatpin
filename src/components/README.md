# AICatPin 组件库

## 概述

AICatPin 使用 shadcn/ui 组件库，并扩展了赛博朋克风格的变体。

## 组件列表

### UI 组件

#### Button
按钮组件，支持多种变体：

```tsx
import { Button } from '@/components/ui/button'

// 默认按钮
<Button>默认按钮</Button>

// 赛博朋克风格
<Button variant="cyber">赛博按钮</Button>
<Button variant="cyberOutline">赛博轮廓按钮</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="lg">大按钮</Button>
<Button size="icon">图标按钮</Button>
```

**变体：**
- `default` - 默认样式
- `destructive` - 危险操作
- `outline` - 轮廓样式
- `secondary` - 次要样式
- `ghost` - 幽灵样式
- `link` - 链接样式
- `cyber` - 赛博朋克风格
- `cyberOutline` - 赛博朋克轮廓风格

#### Input
输入框组件：

```tsx
import { Input } from '@/components/ui/input'

<Input placeholder="输入内容..." />
<Input type="search" placeholder="搜索..." />
```

#### Dialog
对话框组件：

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger>打开对话框</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述内容</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

#### ScrollArea
滚动区域组件：

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className="h-[200px]">
  {/* 内容 */}
</ScrollArea>
```

#### Popover
弹出框组件：

```tsx
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'

<Popover>
  <PopoverTrigger>触发器</PopoverTrigger>
  <PopoverContent>弹出内容</PopoverContent>
</Popover>
```

#### Badge
徽章组件：

```tsx
import { Badge } from '@/components/ui/badge'

<Badge>默认</Badge>
<Badge variant="cyber">赛博风格</Badge>
<Badge variant="cyberOutline">赛博轮廓</Badge>
<Badge variant="magenta">品红色</Badge>
<Badge variant="magentaOutline">品红轮廓</Badge>
```

## 布局组件

### MainLayout
主布局组件，实现三栏式布局：

```tsx
import { MainLayout } from '@/components/layout/MainLayout'

function App() {
  return <MainLayout />
}
```

**布局结构：**
- **左栏 (250px)**：分类列表、高频标签云、最近笔记
- **中栏 (Fluid)**：编辑器主舞台区域
- **右栏 (300px)**：知识图谱占位符

## 赛博朋克主题

### 颜色变量

主题使用 CSS 变量定义颜色：

```css
:root {
  --cyber-cyan: 180 100% 50%;
  --cyber-magenta: 300 100% 50%;
  --cyber-yellow: 60 100% 50%;
  --cyber-green: 120 100% 50%;
  --cyber-red: 0 100% 50%;
}
```

### 自定义类名

- `cyber-border` - 赛博朋克边框样式
- `cyber-glow` - 发光效果
- `cyber-text` - 文字发光效果
- `cyber-gradient` - 渐变背景
- `scanline` - 扫描线效果
- `noise` - 噪点效果
- `grid-pattern` - 网格图案

### 动画

- `animate-float` - 浮动动画
- `animate-glitch` - 故障动画
- `animate-glow` - 发光动画

## 字体

- **主要字体**：Inter（无衬线字体）
- **代码字体**：JetBrains Mono（等宽字体）

## 使用示例

### 创建赛博朋克风格的卡片

```tsx
<div className="p-4 border border-cyan-500/30 rounded-lg bg-card/50 backdrop-blur-sm cyber-glow">
  <h3 className="text-lg font-semibold cyber-text">标题</h3>
  <p className="text-cyan-400/60">内容</p>
</div>
```

### 创建发光按钮

```tsx
<Button variant="cyber" className="animate-glow">
  发光按钮
</Button>
```

### 创建赛博朋克风格的输入框

```tsx
<Input 
  placeholder="输入内容..." 
  className="bg-cyan-500/5 border-cyan-500/30 focus:border-cyan-500/50 focus:ring-cyan-500/20"
/>
```

## 开发指南

### 添加新组件

1. 在 `src/components/ui/` 目录下创建新组件文件
2. 使用 `cn()` 工具函数合并类名
3. 支持 `className` 属性进行自定义
4. 使用 TypeScript 定义类型

### 扩展变体

1. 在 `tailwind.config.js` 中定义新的颜色
2. 在 `globals.css` 中添加 CSS 变量
3. 在组件中添加新的变体

### 主题定制

1. 修改 `globals.css` 中的 CSS 变量
2. 更新 `tailwind.config.js` 中的颜色配置
3. 调整组件的默认样式

## 依赖

- `@radix-ui/react-*` - 基础 UI 原语
- `class-variance-authority` - 变体管理
- `clsx` - 类名合并
- `tailwind-merge` - Tailwind 类名合并
- `lucide-react` - 图标库

## 相关文档

- [shadcn/ui 文档](https://ui.shadcn.com)
- [Radix UI 文档](https://www.radix-ui.com)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [Lucide 图标](https://lucide.dev)