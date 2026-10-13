import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Bảng Markdown bọc trong khung cuộn ngang: mỗi cột rộng tối thiểu ~120px nên trên điện thoại bảng nhiều cột
 * cuộn ngang thay vì đẩy tràn trang; màn rộng đủ chỗ thì chữ trong ô tự xuống dòng, không cần cuộn.
 */
const MARKDOWN_COMPONENTS: Components = {
  table: ({ node: _node, ...props }) => (
    <div className="markdown-table -mx-1 my-4 overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:thin]" tabIndex={0} role="region" aria-label="Bảng">
      <table {...props} className="w-full border-collapse text-base [&_td]:min-w-[7.5rem] [&_th]:min-w-[7.5rem]" />
    </div>
  ),
};

/**
 * Lý thuyết của bài (Markdown + bảng GFM). File riêng để `LessonView` tải lười — react-markdown/remark-gfm
 * chỉ về khi có bài cần hiện. Kiểu chữ của khối do thẻ `.markdown` bọc ngoài trong LessonView quyết định.
 */
export default function LessonMarkdown({ source }: { source: string }) {
  return <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{source}</Markdown>;
}
