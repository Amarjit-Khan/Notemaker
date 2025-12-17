import React from 'react';

class EditableBlock extends React.Component {
    constructor(props) {
        super(props);
        this.contentEditableRef = React.createRef();
        this.lastHtml = props.html;
    }

    render() {
        const { tagName, className, style, placeholder, fontSize, readOnly, html, onKeyDown, onFocus } = this.props;
        const Tag = tagName || 'div';

        return (
            <Tag
                className={className}
                style={{ ...style, fontSize: fontSize ? `${fontSize}px` : undefined }}
                ref={this.contentEditableRef}
                contentEditable={!readOnly}
                onInput={this.emitChange}
                onKeyDown={onKeyDown}
                onPaste={this.handlePaste}
                onFocus={onFocus}
                dangerouslySetInnerHTML={{ __html: html }}
                data-placeholder={placeholder}
            />
        );
    }

    handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');

        if (text.includes('\n') && this.props.onSplitPaste) {
            // Split by newline (handle various line endings)
            const lines = text.split(/\r\n|\r|\n/);
            const firstLine = lines[0];
            const otherLines = lines.slice(1);

            // Insert the first line into the current block at cursor
            if (firstLine) {
                document.execCommand('insertText', false, firstLine);
            }

            // Delegate the rest to parent to create new blocks
            if (otherLines.length > 0) {
                this.props.onSplitPaste(otherLines);
            }
        } else {
            // Single line paste - just insert text stripped of formatting
            document.execCommand('insertText', false, text);
        }
    }

    shouldComponentUpdate(nextProps) {
        // If the html prop matches the current DOM, we do NOT want to re-render,
        // because re-rendering would reset the cursor.
        // We only render if:
        // 1. The HTML is different (external update like Undo).
        // 2. Other props changed (readOnly, style, etc).

        const el = this.contentEditableRef.current;
        if (!el) return true;

        // Check if plain HTML string matches
        if (nextProps.html !== el.innerHTML) {
            return true;
        }

        // Check primitives
        if (this.props.readOnly !== nextProps.readOnly ||
            this.props.fontSize !== nextProps.fontSize ||
            this.props.placeholder !== nextProps.placeholder ||
            this.props.className !== nextProps.className
        ) {
            return true;
        }

        // Shallow comparison for style object
        const prevStyle = this.props.style || {};
        const nextStyle = nextProps.style || {};

        const prevKeys = Object.keys(prevStyle);
        const nextKeys = Object.keys(nextStyle);

        if (prevKeys.length !== nextKeys.length) return true;

        for (let key of prevKeys) {
            if (prevStyle[key] !== nextStyle[key]) {
                return true;
            }
        }

        // Compare handlers? If using functional updates, stale handlers are usually fine.
        // But if we strictly skip, we assume handlers update correctly or aren't needed for *typing*.
        // Returning false here means NO RENDER.
        return false;
    }

    componentDidUpdate() {
        const el = this.contentEditableRef.current;
        if (!el) return;

        // If the prop HTML is strictly different from DOM, update DOM.
        // This handles Undo/Redo or loading.
        if (this.props.html !== el.innerHTML) {
            el.innerHTML = this.props.html;
        }
        this.lastHtml = this.props.html;
    }

    emitChange = (e) => {
        const html = e.target.innerHTML;
        if (this.props.onChange && html !== this.lastHtml) {
            this.props.onChange(html);
        }
        this.lastHtml = html;
    }
}

export default EditableBlock;
