import { useState, type ReactNode } from 'react';
import { Button, Modal, ModalFooter } from '@/components/ui';
import type { GridContext, GridPreview } from '../../api/aopGridDraft';
import type { EditProps } from './AopFields';
import { AopGridPreview } from './AopGridPreview';

export interface PendingGridPreview { result: GridPreview; changes: GridContext['changes']; resolve: GridContext['resolve'] }
interface Props extends EditProps {
  context: GridContext;
  preview: PendingGridPreview | null; onPreview: (preview: PendingGridPreview | null) => void;
  children?: ReactNode;
}

export function AopGridTools({ context, preview, onPreview, children, ...edit }: Props): ReactNode {
  const [notice, setNotice] = useState('');
  const stale = preview && (preview.resolve !== context.resolve || preview.changes !== context.changes);
  function applied(count: number): void {
    setNotice(`${count} cells updated. Changes are unsaved. Ctrl/Cmd+Z to undo.`);
  }
  return <>
    {children}
    {notice && <p role="status" className="w-full text-xs text-gray-600">{notice}</p>}
    <Modal isOpen={!!preview} onClose={() => onPreview(null)} title={preview ? `Preview: ${preview.result.label}` : 'Preview changes'} description="Applying updates your draft. Use Save Changes to save the configuration." size="full">
      {preview && <>
        <AopGridPreview preview={preview.result} />
        {stale && <p role="alert" className="mt-3 text-sm text-red-700">Values changed while this preview was open. Close it and preview again.</p>}
        <ModalFooter><Button variant="outline" onClick={() => onPreview(null)}>Cancel</Button>
          <Button disabled={edit.disabled || !edit.onBatchChange || !!stale || !!preview.result.errors.length || !preview.result.cells.length} onClick={() => {
            edit.onBatchChange?.(preview.result.cells.map((cell) => cell.change), preview.result.label);
            applied(preview.result.cells.length);
            onPreview(null);
          }}>Apply to draft</Button>
        </ModalFooter>
      </>}
    </Modal>
  </>;
}
