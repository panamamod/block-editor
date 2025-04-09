"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
/**
 * Block Editor Plugin for Obsidian
 * Provides a block-based editing experience similar to Notion
 */
class BlockEditorPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.blockModeStates = new Map();
        this.blockModeButton = null;
        this.dragIndicator = null;
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Block Editor Plugin loaded!');
            yield this.loadStyles();
            this.registerCommands();
            this.registerEventHandlers();
            this.createDragIndicator();
            this.updateBlockModeButton();
        });
    }
    onunload() {
        console.log('Block Editor Plugin unloaded!');
        this.cleanup();
    }
    // INITIALIZATION METHODS
    /**
     * Load CSS styles for the plugin
     */
    loadStyles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const styleEl = document.createElement('style');
                styleEl.id = 'block-editor-styles';
                const cssPath = '.obsidian/plugins/block-editor-plugin/styles.css';
                const cssContent = yield this.app.vault.adapter.read(cssPath);
                styleEl.textContent = cssContent;
                document.head.appendChild(styleEl);
                console.log('Styles.css successfully loaded');
            }
            catch (err) {
                console.error('Error loading styles.css:', err);
            }
        });
    }
    /**
     * Register plugin commands
     */
    registerCommands() {
        this.addCommand({
            id: 'toggle-block-mode',
            name: 'Toggle Block Mode',
            checkCallback: (checking) => {
                const view = this.getActiveMarkdownView();
                if (!view)
                    return false;
                if (!checking)
                    this.toggleBlockMode(view);
                return true;
            },
        });
    }
    /**
     * Register event handlers
     */
    registerEventHandlers() {
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.handleViewChange()));
        this.registerEvent(this.app.workspace.on('file-open', () => this.handleViewChange()));
    }
    /**
     * Create the drag indicator element
     */
    createDragIndicator() {
        if (this.dragIndicator)
            return;
        this.dragIndicator = document.createElement('div');
        this.dragIndicator.className = 'block-drag-indicator';
        document.body.appendChild(this.dragIndicator);
    }
    /**
     * Clean up resources when plugin is unloaded
     */
    cleanup() {
        var _a, _b, _c;
        (_a = this.blockModeButton) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = this.dragIndicator) === null || _b === void 0 ? void 0 : _b.remove();
        this.blockModeStates.forEach((state, view) => {
            if (state.isActive)
                this.restoreOriginalView(view);
        });
        (_c = document.getElementById('block-editor-styles')) === null || _c === void 0 ? void 0 : _c.remove();
    }
    // VIEW MANAGEMENT METHODS
    /**
     * Get the active markdown view
     */
    getActiveMarkdownView() {
        return this.app.workspace.getActiveViewOfType(obsidian_1.MarkdownView);
    }
    /**
     * Handle view changes (active leaf or file open)
     */
    handleViewChange() {
        const view = this.getActiveMarkdownView();
        if (!view)
            return;
        const state = this.blockModeStates.get(view);
        if (state === null || state === void 0 ? void 0 : state.isActive) {
            this.renderBlockEditor(view);
        }
        else {
            this.restoreOriginalView(view);
        }
        this.updateBlockModeButton();
    }
    /**
     * Toggle block mode for a view
     */
    toggleBlockMode(view) {
        const state = this.blockModeStates.get(view) || {
            isActive: false,
            originalContent: '',
        };
        state.isActive = !state.isActive;
        if (state.isActive) {
            state.originalContent = view.editor.getValue();
            this.renderBlockEditor(view);
        }
        else {
            this.restoreOriginalView(view);
        }
        this.blockModeStates.set(view, state);
        this.updateBlockModeButton();
    }
    /**
     * Update the block mode toggle button
     */
    updateBlockModeButton() {
        var _a, _b;
        const view = this.getActiveMarkdownView();
        if (!view)
            return;
        const header = (_a = view.contentEl.closest('.workspace-leaf-content')) === null || _a === void 0 ? void 0 : _a.querySelector('.view-header');
        if (!header)
            return;
        (_b = this.blockModeButton) === null || _b === void 0 ? void 0 : _b.remove();
        this.blockModeButton = this.createBlockModeButton(view);
        const actionsContainer = header.querySelector('.view-actions');
        if (actionsContainer) {
            actionsContainer.prepend(this.blockModeButton);
        }
    }
    /**
     * Create the block mode toggle button
     */
    createBlockModeButton(view) {
        const button = document.createElement('button');
        const state = this.blockModeStates.get(view);
        const isActive = (state === null || state === void 0 ? void 0 : state.isActive) || false;
        button.className = 'clickable-icon view-action block-mode-button';
        button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    `;
        button.setAttribute('aria-label', 'Toggle Block Mode');
        button.classList.toggle('is-active', isActive);
        button.addEventListener('click', () => this.toggleBlockMode(view));
        return button;
    }
    // BLOCK EDITOR RENDERING
    /**
     * Render the block editor for a view
     */
    renderBlockEditor(view) {
        const container = view.contentEl;
        const editor = view.editor;
        const content = editor.getValue();
        // Remove previous blockContainer if it exists
        const existingContainer = container.querySelector('.block-editor-container');
        if (existingContainer)
            existingContainer.remove();
        // Create new container
        const blockContainer = document.createElement('div');
        blockContainer.className = 'block-editor-container';
        container.appendChild(blockContainer);
        // Hide original editor elements by setting display: none
        const elementsToHide = container.querySelectorAll('.markdown-source-view.mod-cm6');
        elementsToHide.forEach((el) => {
            el.style.display = 'none';
        });
        // Split content into lines and create blocks
        const lines = content.trim() ? content.split('\n') : [''];
        lines.forEach((line, index) => {
            const blockWrapper = this.createBlockElement(line, index, editor, view, blockContainer);
            blockContainer.appendChild(blockWrapper);
        });
        // Set focus on first block
        const firstBlock = blockContainer.querySelector('.block');
        if (firstBlock)
            firstBlock.focus();
    }
    hideOriginalEditor(container) {
        const sourceView = container.querySelector('.markdown-source-view.mod-cm6');
        if (sourceView) {
            // Save the original display value if we haven't already
            if (!sourceView.dataset.originalDisplay) {
                sourceView.dataset.originalDisplay = sourceView.style.display || '';
            }
            // Set display to none
            sourceView.style.display = 'none';
        }
    }
    /**
     * Restore the original view
     */
    restoreOriginalView(view) {
        var _a;
        const container = view.contentEl;
        // Remove block container if it exists
        (_a = container.querySelector('.block-editor-container')) === null || _a === void 0 ? void 0 : _a.remove();
        // Restore the original editor display
        const sourceView = container.querySelector('.markdown-source-view.mod-cm6');
        if (sourceView) {
            if (sourceView.dataset.originalDisplay !== undefined) {
                sourceView.style.display = sourceView.dataset.originalDisplay;
            }
            else {
                sourceView.style.display = '';
            }
        }
    }
    // BLOCK ELEMENTS CREATION AND HANDLING
    /**
     * Create a new block element
     */
    createBlockElement(line, index, editor, view, container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'block-wrapper';
        wrapper.draggable = true;
        wrapper.dataset.index = index.toString();
        // Create controls container
        const controls = document.createElement('div');
        controls.className = 'block-controls';
        // Create drag handle icon (gripper)
        const handle = document.createElement('div');
        handle.className = 'block-handle';
        handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>';
        // Кнопка "плюс" сверху (добавляет блок перед текущим)
        const addBeforeButton = document.createElement('div');
        addBeforeButton.className = 'block-add-button block-add-before';
        addBeforeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        addBeforeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const newWrapper = this.createBlockElement('', 0, editor, view, container);
            wrapper.before(newWrapper);
            const newBlock = newWrapper.querySelector('.block');
            if (newBlock)
                newBlock.focus();
            this.updateContent(container, editor);
        });
        // Кнопка "плюс" снизу (добавляет блок после текущего)
        const addAfterButton = document.createElement('div');
        addAfterButton.className = 'block-add-button block-add-after';
        addAfterButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        addAfterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const newWrapper = this.createBlockElement('', 0, editor, view, container);
            wrapper.after(newWrapper);
            const newBlock = newWrapper.querySelector('.block');
            if (newBlock)
                newBlock.focus();
            this.updateContent(container, editor);
        });
        // Append the "plus" buttons and gripper to the controls container
        controls.append(addBeforeButton, handle, addAfterButton);
        // Create content block
        const block = document.createElement('div');
        block.className = 'block';
        block.contentEditable = 'true';
        // Analyze block type and content
        const { blockType, cleanText } = this.parseBlockType(line);
        block.textContent = cleanText;
        block.dataset.type = blockType;
        // Assemble the wrapper: controls (with nested plus buttons and gripper) and block
        wrapper.append(controls, block);
        this.addBlockListeners(wrapper, block, editor, view, container);
        return wrapper;
    }
    createBlockControls() {
        const controls = document.createElement('div');
        controls.className = 'block-controls';
        const handle = document.createElement('div');
        handle.className = 'block-handle';
        handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>';
        controls.appendChild(handle);
        return controls;
    }
    /**
     * Create the block content element
     */
    createBlockContentElement(line) {
        const block = document.createElement('div');
        block.className = 'block';
        block.contentEditable = 'true';
        // Parse block type and content
        const { blockType, cleanText } = this.parseBlockType(line);
        block.textContent = cleanText;
        block.dataset.type = blockType;
        return block;
    }
    /**
     * Create the add button for a block
     */
    createBlockAddButton(wrapper, editor, view, container) {
        const addButton = document.createElement('div');
        addButton.className = 'block-add-button';
        addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        addButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const newWrapper = this.createBlockElement('', 0, editor, view, container);
            wrapper.before(newWrapper);
            const newBlock = newWrapper.querySelector('.block');
            if (newBlock)
                newBlock.focus();
            this.updateContent(container, editor);
        });
        return addButton;
    }
    /**
     * Parse block type from a line of text
     */
    parseBlockType(line) {
        const trimmed = line.trim();
        if (!trimmed)
            return { blockType: 'p', cleanText: '' };
        if (/^#+/.test(trimmed)) {
            const level = trimmed.match(/^#+/)[0].length;
            return {
                blockType: `h${Math.min(level, 6)}`,
                cleanText: trimmed.replace(/^#+\s*/, ''),
            };
        }
        if (/^\s*[-*]/.test(trimmed)) {
            return {
                blockType: 'ul',
                cleanText: trimmed.replace(/^\s*[-*]\s*/, ''),
            };
        }
        if (/^\s*>/.test(trimmed)) {
            return {
                blockType: 'quote',
                cleanText: trimmed.replace(/^\s*>\s*/, ''),
            };
        }
        return { blockType: 'p', cleanText: trimmed };
    }
    /**
     * Add event listeners to a block element
     */
    addBlockListeners(wrapper, block, editor, view, container) {
        if (!container) {
            console.error('Block container not found');
            return;
        }
        // Add focus and blur handlers
        this.addFocusHandlers(wrapper, block);
        // Add key event handlers
        this.addKeyboardHandlers(wrapper, block, editor, view, container);
        // Add input handler
        block.addEventListener('input', () => this.updateContent(container, editor));
        // Add drag and drop handlers
        this.addDragDropHandlers(wrapper, container, editor);
        // Add handle click handler for format menu
        const handle = wrapper.querySelector('.block-handle');
        if (handle) {
            handle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showFormatMenu(wrapper, block, editor, view, container);
            });
        }
    }
    /**
     * Add focus and blur handlers to a block
     */
    addFocusHandlers(wrapper, block) {
        const setActive = (active) => {
            wrapper.classList.toggle('is-active', active);
        };
        block.addEventListener('focus', () => setActive(true));
        block.addEventListener('blur', (e) => {
            // Don't remove active state if focus moved to formatting menu
            const relatedTarget = e.relatedTarget;
            if (wrapper.contains(relatedTarget))
                return;
            setActive(false);
        });
    }
    /**
     * Add keyboard event handlers to a block
     */
    addKeyboardHandlers(wrapper, block, editor, view, container) {
        block.addEventListener('keydown', (e) => {
            var _a, _b;
            if (e.key === 'Enter' && !e.shiftKey) {
                this.handleEnterKey(e, wrapper, editor, view, container);
            }
            else if (e.key === 'Backspace' && !((_a = block.textContent) === null || _a === void 0 ? void 0 : _a.trim())) {
                this.handleBackspaceKey(e, wrapper, container, editor);
            }
            else if (e.key === 'ArrowUp') {
                this.handleArrowUpKey(e, wrapper);
            }
            else if (e.key === 'ArrowDown') {
                this.handleArrowDownKey(e, wrapper);
            }
            else if (e.key === '/' && !((_b = block.textContent) === null || _b === void 0 ? void 0 : _b.trim())) {
                this.handleSlashKey(e, wrapper, block, editor, view, container);
            }
        });
    }
    /**
     * Handle Enter key press
     */
    handleEnterKey(e, wrapper, editor, view, container) {
        e.preventDefault();
        // Create new block after current one
        const newWrapper = this.createBlockElement('', 0, editor, view, container);
        wrapper.after(newWrapper);
        const newBlock = newWrapper.querySelector('.block');
        if (newBlock)
            newBlock.focus();
        this.updateContent(container, editor);
    }
    /**
     * Handle Backspace key press on empty block
     */
    handleBackspaceKey(e, wrapper, container, editor) {
        e.preventDefault();
        // Only remove if not the only block
        const blocks = container.querySelectorAll('.block-wrapper:not(.new-block-wrapper)');
        if (blocks.length <= 1)
            return;
        const prevWrapper = wrapper.previousElementSibling;
        wrapper.remove();
        // Focus on previous block or next one if there's no previous
        if (prevWrapper && prevWrapper.classList.contains('block-wrapper')) {
            const prevBlock = prevWrapper.querySelector('.block');
            if (prevBlock) {
                prevBlock.focus();
                // Set cursor at end of text
                this.setCursorAtEnd(prevBlock);
            }
        }
        this.updateContent(container, editor);
    }
    /**
     * Set cursor at the end of an element
     */
    setCursorAtEnd(element) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
        sel === null || sel === void 0 ? void 0 : sel.addRange(range);
    }
    /**
     * Handle Arrow Up key press
     */
    handleArrowUpKey(e, wrapper) {
        const prevWrapper = wrapper.previousElementSibling;
        if (prevWrapper && prevWrapper.classList.contains('block-wrapper')) {
            e.preventDefault();
            const prevBlock = prevWrapper.querySelector('.block');
            if (prevBlock)
                prevBlock.focus();
        }
    }
    /**
     * Handle Arrow Down key press
     */
    handleArrowDownKey(e, wrapper) {
        const nextWrapper = wrapper.nextElementSibling;
        if (nextWrapper &&
            nextWrapper.classList.contains('block-wrapper') &&
            !nextWrapper.classList.contains('new-block-wrapper')) {
            e.preventDefault();
            const nextBlock = nextWrapper.querySelector('.block');
            if (nextBlock)
                nextBlock.focus();
        }
    }
    /**
     * Handle Slash key press (format menu)
     */
    handleSlashKey(e, wrapper, block, editor, view, container) {
        e.preventDefault();
        this.showFormatMenu(wrapper, block, editor, view, container);
    }
    /**
     * Add drag and drop handlers to a block
     */
    addDragDropHandlers(wrapper, container, editor) {
        wrapper.addEventListener('dragstart', (e) => {
            if (!container || !e.dataTransfer)
                return;
            const index = Array.from(container.children).indexOf(wrapper);
            if (index !== -1) {
                e.dataTransfer.setData('text/plain', index.toString());
                wrapper.classList.add('dragging');
            }
        });
        wrapper.addEventListener('dragend', () => {
            wrapper.classList.remove('dragging');
            if (this.dragIndicator)
                this.dragIndicator.style.display = 'none';
        });
        wrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.dragIndicator) {
                const rect = wrapper.getBoundingClientRect();
                const insertAfter = e.clientY >= rect.top + rect.height / 2;
                this.dragIndicator.style.display = 'block';
                this.dragIndicator.style.top = `${insertAfter ? rect.bottom : rect.top}px`;
                this.dragIndicator.style.left = `${rect.left}px`;
                this.dragIndicator.style.width = `${rect.width}px`;
            }
        });
        wrapper.addEventListener('dragleave', () => {
            if (this.dragIndicator)
                this.dragIndicator.style.display = 'none';
        });
        wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!container || !e.dataTransfer)
                return;
            // Hide drag indicator
            if (this.dragIndicator)
                this.dragIndicator.style.display = 'none';
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain') || '-1');
            const allWrappers = Array.from(container.querySelectorAll('.block-wrapper:not(.new-block-wrapper)'));
            const toIndex = allWrappers.indexOf(wrapper);
            if (fromIndex >= 0 && fromIndex !== toIndex) {
                const movedWrapper = allWrappers[fromIndex];
                const rect = wrapper.getBoundingClientRect();
                const insertAfter = e.clientY >= rect.top + rect.height / 2;
                if (insertAfter) {
                    wrapper.after(movedWrapper);
                }
                else {
                    wrapper.before(movedWrapper);
                }
                // Update indexes
                container.querySelectorAll('.block-wrapper').forEach((el, idx) => {
                    el.dataset.index = idx.toString();
                });
                this.updateContent(container, editor);
            }
        });
    }
    // CONTENT MANAGEMENT
    /**
     * Update editor content from blocks
     */
    updateContent(container, editor) {
        const blocks = Array.from(container.querySelectorAll('.block-wrapper:not(.new-block-wrapper)'));
        const newLines = blocks.map(wrapper => {
            const block = wrapper.querySelector('.block');
            if (!block)
                return '';
            const blockType = block.dataset.type || 'p';
            const prefix = BlockEditorPlugin.BLOCK_PREFIXES[blockType] || '';
            return `${prefix}${block.textContent || ''}`;
        });
        editor.setValue(newLines.join('\n'));
    }
    // FORMAT MENU
    /**
     * Show the format menu for a block
     */
    showFormatMenu(wrapper, block, editor, view, container) {
        var _a;
        // Close existing menu if it exists
        (_a = document.querySelector('.block-menu')) === null || _a === void 0 ? void 0 : _a.remove();
        // Create menu
        const menu = this.createFormatMenu(wrapper, block, editor, view, container);
        wrapper.appendChild(menu);
        // Set up click outside handler to close menu
        this.setupFormatMenuCloseHandler(menu, wrapper);
    }
    /**
     * Create the format menu
     */
    createFormatMenu(wrapper, block, editor, view, container) {
        const menu = document.createElement('div');
        menu.className = 'block-menu';
        // Add menu header
        const header = document.createElement('div');
        header.className = 'block-menu-header';
        header.textContent = 'Convert to';
        menu.appendChild(header);
        // Add format options
        BlockEditorPlugin.BLOCK_TYPE_OPTIONS.forEach(opt => {
            const btn = this.createFormatMenuOption(opt, block, container, editor, menu);
            menu.appendChild(btn);
        });
        // Add divider
        const divider = document.createElement('div');
        divider.className = 'block-menu-divider';
        menu.appendChild(divider);
        // Add delete button
        const deleteBtn = this.createDeleteButton(wrapper, container, editor, menu);
        menu.appendChild(deleteBtn);
        // Add duplicate button
        const duplicateBtn = this.createDuplicateButton(wrapper, block, editor, view, container, menu);
        menu.appendChild(duplicateBtn);
        return menu;
    }
    /**
       * Create a format option button
       */
    createFormatMenuOption(option, block, container, editor, menu) {
        const btn = document.createElement('button');
        btn.dataset.type = option.type;
        btn.innerHTML = `<span class="icon">${option.icon}</span>${option.label}`;
        btn.addEventListener('click', () => {
            block.dataset.type = option.type;
            this.updateContent(container, editor);
            menu.remove();
            block.focus();
        });
        return btn;
    }
    /**
     * Create a delete button for the format menu
     */
    createDeleteButton(wrapper, container, editor, menu) {
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></span>Delete';
        deleteBtn.addEventListener('click', () => {
            // Only delete if there's more than one block
            if (container.querySelectorAll('.block-wrapper:not(.new-block-wrapper)').length > 1) {
                wrapper.remove();
                this.updateContent(container, editor);
            }
            menu.remove();
        });
        return deleteBtn;
    }
    /**
     * Create a duplicate button for the format menu
     */
    createDuplicateButton(wrapper, block, editor, view, container, menu) {
        const duplicateBtn = document.createElement('button');
        duplicateBtn.innerHTML = '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg></span>Duplicate';
        duplicateBtn.addEventListener('click', () => {
            const clone = this.createBlockElement(block.textContent || '', 0, editor, view, container);
            wrapper.after(clone);
            this.updateContent(container, editor);
            menu.remove();
            const cloneBlock = clone.querySelector('.block');
            if (cloneBlock)
                cloneBlock.focus();
        });
        return duplicateBtn;
    }
    /**
     * Set up event handler to close format menu when clicking outside
     */
    setupFormatMenuCloseHandler(menu, wrapper) {
        const closeOnClickOutside = (e) => {
            if (!menu.contains(e.target) && e.target !== wrapper.querySelector('.block-handle')) {
                menu.remove();
                document.removeEventListener('click', closeOnClickOutside);
            }
        };
        // Use setTimeout to avoid conflict with current click
        setTimeout(() => {
            document.addEventListener('click', closeOnClickOutside);
        }, 0);
    }
}
exports.default = BlockEditorPlugin;
BlockEditorPlugin.BLOCK_PREFIXES = {
    'p': '',
    'h1': '# ',
    'h2': '## ',
    'h3': '### ',
    'h4': '#### ',
    'h5': '##### ',
    'h6': '###### ',
    'ul': '- ',
    'quote': '> ',
};
BlockEditorPlugin.BLOCK_TYPE_OPTIONS = [
    {
        type: 'p',
        label: 'Text block',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 12h.01"/><path d="M10 16H7a4 4 0 1 1 0-8h10a4 4 0 0 0-4 8h-2"/></svg>'
    },
    {
        type: 'h1',
        label: 'Heading 1',
        icon: '<span class="heading-icon">H1</span>'
    },
    {
        type: 'h2',
        label: 'Heading 2',
        icon: '<span class="heading-icon">H2</span>'
    },
    {
        type: 'h3',
        label: 'Heading 3',
        icon: '<span class="heading-icon">H3</span>'
    },
    {
        type: 'ul',
        label: 'List item',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
    },
    {
        type: 'quote',
        label: 'Quote',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>'
    },
];
