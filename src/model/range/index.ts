/**
 * the HighlightRange Class（HRange）
 * It's a special object called HRange in Highlighter,
 * represents for a piece of chosen dom
 */

import type { DomNode, HookMap } from '../../types';
import type Hook from '../../util/hook';
import HighlightSource from '../../model/source/index';
import { ERROR } from '../../types';
import { getDomRange, removeSelection } from '../../model/range/selection';
import uuid from '../../util/uuid';
import { getDomMeta, formatDomNode } from '../../model/range/dom';
import { eventEmitter, INTERNAL_ERROR_EVENT } from '../../util/const';

class HighlightRange {
    static removeDomRange = removeSelection;

    start: DomNode;

    end: DomNode;

    text: string;

    id: string;

    frozen: boolean;

    constructor(start: DomNode, end: DomNode, text: string, id: string, frozen = false) {
        if (start.$node.nodeType !== 3 || end.$node.nodeType !== 3) {
            eventEmitter.emit(INTERNAL_ERROR_EVENT, {
                type: ERROR.RANGE_NODE_INVALID,
            });
        }

        this.start = formatDomNode(start);
        this.end = formatDomNode(end);
        this.text = text;
        this.frozen = frozen;
        this.id = id;
    }

    static fromSelection($root: Document | HTMLElement, idHook: Hook<string>) {
        const range = getDomRange($root.ownerDocument.defaultView);

        if (!range) {
            return null;
        }

        const start: DomNode = {
            $node: range.startContainer,
            offset: range.startOffset,
        };
        const end: DomNode = {
            $node: range.endContainer,
            offset: range.endOffset,
        };

        const text = range.toString();
        let id = idHook.call(start, end, text);

        id = typeof id !== 'undefined' && id !== null ? id : uuid();

        return new HighlightRange(start, end, text, id);
    }

    // serialize the HRange instance
    // so that you can save the returned object (e.g. use JSON.stringify on it and send to backend)
    serialize($root: Document | HTMLElement, hooks: HookMap): HighlightSource {
        const startMeta = getDomMeta(this.start.$node as Text, this.start.offset, $root);
        const endMeta = getDomMeta(this.end.$node as Text, this.end.offset, $root);

        let extra;

        if (!hooks.Serialize.RecordInfo.isEmpty()) {
            extra = hooks.Serialize.RecordInfo.call(this.start, this.end, $root);
        }

        this.frozen = true;

        return new HighlightSource(startMeta, endMeta, this.text, this.id, extra);
    }
}

export default HighlightRange;
