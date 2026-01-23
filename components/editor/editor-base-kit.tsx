import { BaseAlignKit } from '../editor/plugins/align-base-kit';
import { BaseBasicBlocksKit } from '../editor/plugins/basic-blocks-base-kit';
import { BaseBasicMarksKit } from '../editor/plugins/basic-marks-base-kit';
import { BaseCalloutKit } from '../editor/plugins/callout-base-kit';
import { BaseCodeBlockKit } from '../editor/plugins/code-block-base-kit';
import { BaseColumnKit } from '../editor/plugins/column-base-kit';
import { BaseCommentKit } from '../editor/plugins/comment-base-kit';
import { BaseDateKit } from '../editor/plugins/date-base-kit';
import { BaseFontKit } from '../editor/plugins/font-base-kit';
import { BaseLineHeightKit } from '../editor/plugins/line-height-base-kit';
import { BaseLinkKit } from '../editor/plugins/link-base-kit';
import { BaseListKit } from '../editor/plugins/list-base-kit';
import { MarkdownKit } from '../editor/plugins/markdown-kit';
import { BaseMathKit } from '../editor/plugins/math-base-kit';
import { BaseMediaKit } from '../editor/plugins/media-base-kit';
import { BaseMentionKit } from '../editor/plugins/mention-base-kit';
import { BaseSuggestionKit } from '../editor/plugins/suggestion-base-kit';
import { BaseTableKit } from '../editor/plugins/table-base-kit';
import { BaseTocKit } from '../editor/plugins/toc-base-kit';
import { BaseToggleKit } from '../editor/plugins/toggle-base-kit';

export const BaseEditorKit = [
  ...BaseBasicBlocksKit,
  ...BaseCodeBlockKit,
  ...BaseTableKit,
  ...BaseToggleKit,
  ...BaseTocKit,
  ...BaseMediaKit,
  ...BaseCalloutKit,
  ...BaseColumnKit,
  ...BaseMathKit,
  ...BaseDateKit,
  ...BaseLinkKit,
  ...BaseMentionKit,
  ...BaseBasicMarksKit,
  ...BaseFontKit,
  ...BaseListKit,
  ...BaseAlignKit,
  ...BaseLineHeightKit,
  ...BaseCommentKit,
  ...BaseSuggestionKit,
  ...MarkdownKit,
];
